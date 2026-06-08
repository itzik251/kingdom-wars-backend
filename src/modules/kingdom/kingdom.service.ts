import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kingdom } from './kingdom.entity';
import { Building } from '../building/building.entity';
import { Unit, UnitType } from '../units/unit.entity';
import { User } from '../user/user.entity';
import { EconomyService } from '../economy/economy.service';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class KingdomService {
  constructor(
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
    @InjectRepository(Building) private buildingRepo: Repository<Building>,
    @InjectRepository(Unit) private unitRepo: Repository<Unit>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private economyService: EconomyService,
    private notifService: NotificationService,
  ) {}

  async getKingdomByUser(userId: string) {
    // Update lastLogin at most once per 10 minutes (non-blocking)
    this.userRepo.findOne({ where: { id: userId } }).then(user => {
      if (!user) return;
      const now = new Date();
      const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
      if (!lastLogin || now.getTime() - lastLogin.getTime() > 10 * 60 * 1000) {
        this.userRepo.update({ id: userId }, { lastLogin: now }).catch(() => {});
      }
    }).catch(() => {});

    const kingdom = await this.kingdomRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!kingdom) throw new NotFoundException('Kingdom not found');

    // Tick resources before returning — tickKingdom also completes buildings/units
    const updated = await this.economyService.tickKingdom(kingdom.id);

    // Collect what tickKingdom just completed (attached as hidden fields)
    const tickBuildings: { type: string; level: number }[] = (updated as any).__completedBuildings || [];
    const tickUnits: { type: string; count: number }[]     = (updated as any).__completedUnits     || [];

    // NOTE: notifications are already sent by economyService.tickKingdom — no duplicate needed here

    const [buildings, units] = await Promise.all([
      this.buildingRepo.find({ where: { kingdom: { id: kingdom.id } } }),
      this.unitRepo.find({ where: { kingdom: { id: kingdom.id } } }),
    ]);

    // Backfill missing unit rows (e.g. VIP heroes added after kingdom creation)
    const allUnitTypes = Object.values(UnitType);
    const existingTypes = new Set(units.map(u => u.type));
    const missingTypes = allUnitTypes.filter(t => !existingTypes.has(t));
    if (missingTypes.length > 0) {
      const newRows = await this.unitRepo.save(
        missingTypes.map(type => this.unitRepo.create({ kingdom: { id: kingdom.id } as any, type, count: 0, trainingCount: 0, woundedCount: 0 })),
      );
      units.push(...newRows);
    }

    // Notify ONCE when shield expires — only if we haven't already notified for this specific shield
    const now = new Date();
    if (
      updated.shieldUntil &&
      new Date(updated.shieldUntil) <= now &&
      (!updated.shieldExpiredNotifiedAt ||
        new Date(updated.shieldExpiredNotifiedAt) < new Date(updated.shieldUntil))
    ) {
      updated.shieldExpiredNotifiedAt = new Date(updated.shieldUntil);
      await this.kingdomRepo.save(updated);
      const shieldPayload = await this.getUserPayload(userId);
      this.notifService.create(userId, 'shield_expired', shieldPayload).catch(() => {});
    }

    const productionRates = this.economyService.getProductionRates(buildings, updated);

    return {
      kingdom: updated,
      buildings,
      units,
      productionRates,
      shieldActive: updated.isShielded,
      shieldUntil: updated.shieldUntil,
      isVip: !!updated.isVip,
      workers: updated.workers ?? 0,
      maxWorkers: updated.maxWorkers ?? 5,
    };
  }

  private async getUserPayload(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    return { telegramId: user?.telegramId, language: user?.language || 'en' };
  }

  private async sendBuildDoneNotifsRaw(userId: string, buildings: { type: string; level: number }[]) {
    const payload = await this.getUserPayload(userId);
    // Group by type — one push per building type
    const grouped = new Map<string, { count: number; level: number }>();
    for (const b of buildings) {
      const ex = grouped.get(b.type);
      if (ex) ex.count++;
      else grouped.set(b.type, { count: 1, level: b.level });
    }
    for (const [type, { count, level }] of grouped) {
      await this.notifService.create(userId, 'build_done', { ...payload, building: type, level, count }).catch(() => {});
    }
  }

  private async sendTrainingDoneNotifsRaw(userId: string, snapshot: { type: string; count: number }[]) {
    const payload = await this.getUserPayload(userId);
    // Group by unit type
    const grouped = new Map<string, number>();
    for (const s of snapshot) grouped.set(s.type, (grouped.get(s.type) ?? 0) + s.count);
    for (const [type, count] of grouped) {
      await this.notifService.create(userId, 'training_done', { ...payload, unit: type, count }).catch(() => {});
    }
  }


  async getUsdtBalance(kingdomId: string) {
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    return { usdtBalance: kingdom?.usdtBalance ?? 0, gameBalance: kingdom?.gameBalance ?? 0 };
  }

  async requestWithdrawal(kingdomId: string, walletAddress: string) {
    const addr = walletAddress?.trim() || '';
    // Validate TON address format: UQ.../EQ... (48 chars) or raw hex
    if (!addr || !(/^[UE]Q[A-Za-z0-9_-]{46}$/.test(addr) || /^[0-9a-fA-F]{64}$/.test(addr))) {
      throw new BadRequestException('כתובת ארנק TON לא תקינה — חייבת להתחיל ב-UQ או EQ');
    }
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    const MIN_WITHDRAW = 20;
    if ((kingdom?.usdtBalance ?? 0) < MIN_WITHDRAW) {
      throw new BadRequestException(`מינימום ${MIN_WITHDRAW} USDT למשיכה`);
    }
    if (kingdom.withdrawalStatus === 'pending') {
      throw new BadRequestException('יש כבר בקשת משיכה פעילה — המתן לאישור');
    }
    kingdom.withdrawalWallet = walletAddress.trim();
    kingdom.withdrawalPending = kingdom.usdtBalance;
    kingdom.withdrawalStatus = 'pending';
    await this.kingdomRepo.save(kingdom);
    return { success: true, amount: kingdom.withdrawalPending, wallet: kingdom.withdrawalWallet, status: 'pending' };
  }

  async getWithdrawalStatus(kingdomId: string) {
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    return {
      usdtBalance: kingdom?.usdtBalance ?? 0,
      withdrawalPending: kingdom?.withdrawalPending ?? 0,
      withdrawalStatus: kingdom?.withdrawalStatus ?? 'none',
      withdrawalWallet: kingdom?.withdrawalWallet ?? '',
    };
  }

  // Legacy endpoint redirect
  async withdrawUsdt(kingdomId: string) {
    throw new BadRequestException('השתמש ב-request-withdrawal עם כתובת ארנק');
  }

  async buyShield(kingdomId: string) {
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    const SHIELD_COST = 50;
    if (kingdom.gems < SHIELD_COST) throw new BadRequestException('Need 50 gems');
    kingdom.gems -= SHIELD_COST;
    kingdom.shieldUntil = new Date(Date.now() + 24 * 3600 * 1000);
    kingdom.shieldExpiredNotifiedAt = null; // reset so we notify again when this shield expires
    await this.kingdomRepo.save(kingdom);
    return { shieldUntil: kingdom.shieldUntil };
  }

  async hireWorker(kingdomId: string) {
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    const thBuilding = await this.buildingRepo.findOne({ where: { kingdom: { id: kingdomId }, type: 'town_hall' as any } });
    const thLevel = thBuilding?.level ?? 1;
    const maxWorkers = 3 + thLevel;
    if ((kingdom.workers || 0) >= maxWorkers) throw new BadRequestException(`MAX_WORKERS:${maxWorkers}`);
    const HIRE_COST = 50;
    if (kingdom.gold < HIRE_COST) throw new BadRequestException('NOT_ENOUGH_GOLD_WORKER');
    // Atomic update — prevents race condition with the economy cron
    await this.kingdomRepo
      .createQueryBuilder()
      .update()
      .set({ workers: () => 'workers + 1', maxWorkers, gold: () => `gold - ${HIRE_COST}` })
      .where('id = :id AND workers < :max AND gold >= :cost', { id: kingdomId, max: maxWorkers, cost: HIRE_COST })
      .execute();
    const updated = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    return { workers: updated.workers, maxWorkers };
  }

  async fireWorker(kingdomId: string) {
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    if (!kingdom.workers || kingdom.workers <= 0) throw new BadRequestException('NO_WORKERS_TO_FIRE');
    // Atomic update — prevents race condition with the economy cron
    await this.kingdomRepo
      .createQueryBuilder()
      .update()
      .set({ workers: () => 'workers - 1', gold: () => 'gold + 25' })
      .where('id = :id AND workers > 0', { id: kingdomId })
      .execute();
    const updated = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    return { workers: updated.workers };
  }

  async renameKingdom(kingdomId: string, name: string) {
    const clean = name.trim().slice(0, 25);
    if (clean.length < 3) throw new BadRequestException('Name too short');
    await this.kingdomRepo.update({ id: kingdomId }, { name: clean });
    return { name: clean };
  }

  async expandStorage(kingdomId: string) {
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    const COST = 100;
    if (kingdom.gems < COST) throw new BadRequestException('Need 100 gems');
    kingdom.gems -= COST;
    kingdom.maxGold = Math.floor(kingdom.maxGold * 1.5);
    kingdom.maxWood = Math.floor(kingdom.maxWood * 1.5);
    kingdom.maxStone = Math.floor(kingdom.maxStone * 1.5);
    kingdom.maxFood = Math.floor(kingdom.maxFood * 1.5);
    await this.kingdomRepo.save(kingdom);
    return { maxGold: kingdom.maxGold, maxWood: kingdom.maxWood };
  }
}
