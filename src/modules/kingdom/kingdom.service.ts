import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kingdom } from './kingdom.entity';
import { Building, BuildingType } from '../building/building.entity';
import { Unit, UnitType } from '../units/unit.entity';
import { User } from '../user/user.entity';
import { EconomyService } from '../economy/economy.service';
import { NotificationService } from '../notifications/notification.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-log.entity';

@Injectable()
export class KingdomService {
  constructor(
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
    @InjectRepository(Building) private buildingRepo: Repository<Building>,
    @InjectRepository(Unit) private unitRepo: Repository<Unit>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private economyService: EconomyService,
    private notifService: NotificationService,
    private auditService: AuditService,
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

    const productionRates = this.economyService.getProductionRates(buildings, updated, units);

    // Apply storage boost to max values in response only (DB keeps base values)
    const storageBoostActive = !!(updated.storageBoostUntil && new Date() < new Date(updated.storageBoostUntil));
    if (storageBoostActive) {
      updated.maxGold  = Math.floor(updated.maxGold  * 1.5);
      updated.maxWood  = Math.floor(updated.maxWood  * 1.5);
      updated.maxStone = Math.floor(updated.maxStone * 1.5);
      updated.maxFood  = Math.floor(updated.maxFood  * 1.5);
    }

    return {
      kingdom: updated,
      buildings,
      units,
      productionRates,
      shieldActive: updated.isShielded,
      shieldUntil: updated.shieldUntil,
      isVip: !!updated.isVip,
      workers: updated.workers ?? 0,
      maxWorkers: 3 + (buildings.find(b => b.type === 'town_hall')?.level ?? 1),
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
    const MIN_WITHDRAW = 50;
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
    this.auditService.log(AuditAction.WITHDRAW, kingdomId, { amount: kingdom.withdrawalPending, wallet: kingdom.withdrawalWallet });
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
    const base = kingdom.shieldUntil && new Date() < new Date(kingdom.shieldUntil)
      ? new Date(kingdom.shieldUntil) : new Date();
    kingdom.shieldUntil = new Date(base.getTime() + 24 * 3600 * 1000);
    kingdom.shieldExpiredNotifiedAt = null;
    await this.kingdomRepo.save(kingdom);
    this.auditService.log(AuditAction.BUY_SHIELD, kingdomId, { gemsSpent: SHIELD_COST, shieldUntil: kingdom.shieldUntil });
    const userId = (await this.kingdomRepo.findOne({ where: { id: kingdomId }, relations: ['user'] }))?.user?.id;
    if (userId) this.notifService.create(userId, 'shield_purchased', {}).catch(() => {});
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
    const updated = await this.kingdomRepo.findOne({ where: { id: kingdomId }, relations: ['user'] });
    if (updated?.user?.id) this.notifService.create(updated.user.id, 'worker_hired', {}).catch(() => {});
    return { workers: updated.workers, maxWorkers };
  }

  async fireWorker(kingdomId: string) {
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    if (!kingdom.workers || kingdom.workers <= 0) throw new BadRequestException('NO_WORKERS_TO_FIRE');
    await this.kingdomRepo
      .createQueryBuilder()
      .update()
      .set({ workers: () => 'workers - 1', gold: () => 'gold + 25' })
      .where('id = :id AND workers > 0', { id: kingdomId })
      .execute();
    const updated = await this.kingdomRepo.findOne({ where: { id: kingdomId }, relations: ['user'] });
    if (updated?.user?.id) this.notifService.create(updated.user.id, 'worker_fired', {}).catch(() => {});
    return { workers: updated.workers };
  }

  async renameKingdom(kingdomId: string, name: string) {
    const clean = name.trim().slice(0, 25);
    if (clean.length < 3) throw new BadRequestException('Name too short');
    await this.kingdomRepo.update({ id: kingdomId }, { name: clean });
    return { name: clean };
  }

  async buyTitanHero(kingdomId: string) {
    const COST = 0.1;
    const TRAINING_TIME = 300;
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    if (!kingdom) throw new BadRequestException('Kingdom not found');
    if ((kingdom.usdtBalance ?? 0) < COST)
      throw new BadRequestException('נדרש 0.1 USDT לרכישת Titan');
    kingdom.usdtBalance = parseFloat(((kingdom.usdtBalance || 0) - COST).toFixed(6));
    await this.kingdomRepo.save(kingdom);
    this.auditService.log(AuditAction.SPEND_USDT, kingdomId, { action: 'buy_titan', usdtSpent: COST, usdtBalance: kingdom.usdtBalance });
    let titan = await this.unitRepo.findOne({ where: { kingdom: { id: kingdomId }, type: UnitType.TITAN } });
    if (!titan)
      titan = this.unitRepo.create({ kingdom: { id: kingdomId } as any, type: UnitType.TITAN, count: 0, trainingCount: 0, woundedCount: 0 });
    const existingEnd = titan.trainingEndsAt && new Date(titan.trainingEndsAt) > new Date() ? new Date(titan.trainingEndsAt) : new Date();
    titan.trainingCount = (titan.trainingCount || 0) + 1;
    titan.trainingEndsAt = new Date(existingEnd.getTime() + TRAINING_TIME * 1000);
    await this.unitRepo.save(titan);
    return { trainingCount: titan.trainingCount, trainingEndsAt: titan.trainingEndsAt, usdtBalance: kingdom.usdtBalance };
  }

  async buyGiantHero(kingdomId: string) {
    const COST = 0.5;
    const TRAINING_TIME = 600;
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    if (!kingdom) throw new BadRequestException('Kingdom not found');
    if ((kingdom.usdtBalance ?? 0) < COST)
      throw new BadRequestException('נדרש 0.5 USDT לרכישת Giant');
    kingdom.usdtBalance = parseFloat(((kingdom.usdtBalance || 0) - COST).toFixed(6));
    await this.kingdomRepo.save(kingdom);
    this.auditService.log(AuditAction.SPEND_USDT, kingdomId, { action: 'buy_giant', usdtSpent: COST, usdtBalance: kingdom.usdtBalance });
    let giant = await this.unitRepo.findOne({ where: { kingdom: { id: kingdomId }, type: UnitType.GIANT } });
    if (!giant)
      giant = this.unitRepo.create({ kingdom: { id: kingdomId } as any, type: UnitType.GIANT, count: 0, trainingCount: 0, woundedCount: 0 });
    const existingEnd = giant.trainingEndsAt && new Date(giant.trainingEndsAt) > new Date() ? new Date(giant.trainingEndsAt) : new Date();
    giant.trainingCount = (giant.trainingCount || 0) + 1;
    giant.trainingEndsAt = new Date(existingEnd.getTime() + TRAINING_TIME * 1000);
    await this.unitRepo.save(giant);
    return { trainingCount: giant.trainingCount, trainingEndsAt: giant.trainingEndsAt, usdtBalance: kingdom.usdtBalance };
  }

  async buyGems(kingdomId: string, gems: number) {
    if (!gems || gems < 1 || gems > 10000) throw new BadRequestException('Invalid gems amount');
    const cost = parseFloat((gems / 100).toFixed(6));
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    if (!kingdom) throw new BadRequestException('Kingdom not found');
    if ((kingdom.usdtBalance ?? 0) < cost)
      throw new BadRequestException(`נדרש $${cost.toFixed(2)} USDT`);
    kingdom.usdtBalance = parseFloat(((kingdom.usdtBalance || 0) - cost).toFixed(6));
    kingdom.gems = (kingdom.gems || 0) + gems;
    await this.kingdomRepo.save(kingdom);
    this.auditService.log(AuditAction.SPEND_USDT, kingdomId, { action: 'buy_gems', usdtSpent: cost, gemsAdded: gems, gems: kingdom.gems });
    return { gemsAdded: gems, gems: kingdom.gems, usdtBalance: kingdom.usdtBalance };
  }

  async buildGemForge(kingdomId: string) {
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    if (!kingdom) throw new BadRequestException('Kingdom not found');
    const existingForges = await this.buildingRepo.count({ where: { kingdom: { id: kingdomId }, type: BuildingType.GEM_FORGE } });
    if (existingForges >= 3) throw new BadRequestException('Max 3 gem mines');
    const COST = 0.1;
    if ((kingdom.usdtBalance ?? 0) < COST) throw new BadRequestException(`נדרש $${COST} USDT`);
    kingdom.usdtBalance = parseFloat(((kingdom.usdtBalance || 0) - COST).toFixed(6));
    await this.kingdomRepo.save(kingdom);
    const forge = this.buildingRepo.create({
      kingdom: { id: kingdomId } as any,
      type: BuildingType.GEM_FORGE,
      level: 1,
      slot: existingForges,
    });
    await this.buildingRepo.save(forge);
    this.auditService.log(AuditAction.BUILD, kingdomId, { type: 'gem_forge', usdtSpent: COST, usdtBalance: kingdom.usdtBalance });
    return { id: forge.id, level: forge.level, usdtBalance: kingdom.usdtBalance };
  }

  async upgradeGemForge(kingdomId: string, buildingId: string) {
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    if (!kingdom) throw new BadRequestException('Kingdom not found');
    const forge = await this.buildingRepo.findOne({ where: { id: buildingId }, relations: ['kingdom'] });
    if (!forge || forge.kingdom?.id !== kingdomId || forge.type !== BuildingType.GEM_FORGE) throw new BadRequestException('Gem mine not found');
    if (forge.level >= 100) throw new BadRequestException('GEM_FORGE_MAX_LEVEL');
    const COST = parseFloat(((forge.level + 1) * 0.05).toFixed(2));
    if (forge.upgradeEndsAt && new Date() < new Date(forge.upgradeEndsAt))
      throw new BadRequestException('Already upgrading');
    if ((kingdom.usdtBalance ?? 0) < COST) throw new BadRequestException(`נדרש $${COST} USDT`);
    kingdom.usdtBalance = parseFloat(((kingdom.usdtBalance || 0) - COST).toFixed(6));
    const BUILD_TIME_SECS = Math.floor(300 * Math.pow(1.4, forge.level));
    const buildTime = kingdom.isVip ? Math.floor(BUILD_TIME_SECS * 0.70) : BUILD_TIME_SECS;
    forge.upgradeEndsAt = new Date(Date.now() + buildTime * 1000);
    await this.kingdomRepo.save(kingdom);
    await this.buildingRepo.save(forge);
    this.auditService.log(AuditAction.UPGRADE, kingdomId, { type: 'gem_forge', buildingId, fromLevel: forge.level, usdtSpent: COST, upgradeEndsAt: forge.upgradeEndsAt });
    return { id: forge.id, level: forge.level, upgradeEndsAt: forge.upgradeEndsAt, usdtBalance: kingdom.usdtBalance };
  }

  async expandStorage(kingdomId: string) {
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    const COST = 100;
    if (kingdom.gems < COST) throw new BadRequestException('Need 100 gems');
    // If boost already active, extend from current expiry; otherwise from now
    const base = kingdom.storageBoostUntil && new Date() < new Date(kingdom.storageBoostUntil)
      ? new Date(kingdom.storageBoostUntil)
      : new Date();
    kingdom.gems -= COST;
    kingdom.storageBoostUntil = new Date(base.getTime() + 24 * 3_600_000);
    await this.kingdomRepo.save(kingdom);
    this.auditService.log(AuditAction.EXPAND_STORAGE, kingdomId, { gemsSpent: COST, storageBoostUntil: kingdom.storageBoostUntil });
    const userId2 = (await this.kingdomRepo.findOne({ where: { id: kingdomId }, relations: ['user'] }))?.user?.id;
    if (userId2) this.notifService.create(userId2, 'storage_expanded', {}).catch(() => {});
    return { storageBoostUntil: kingdom.storageBoostUntil };
  }

  async getMessages(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const lang = (user?.language as any) || 'en';
    return this.notifService.getMessages(userId, lang);
  }

  async clearMessages(userId: string) {
    return this.notifService.clearMessages(userId);
  }
}
