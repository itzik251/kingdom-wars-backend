import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kingdom } from './kingdom.entity';
import { Building } from '../building/building.entity';
import { Unit, UnitType } from '../units/unit.entity';
import { EconomyService } from '../economy/economy.service';

@Injectable()
export class KingdomService {
  constructor(
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
    @InjectRepository(Building) private buildingRepo: Repository<Building>,
    @InjectRepository(Unit) private unitRepo: Repository<Unit>,
    private economyService: EconomyService,
  ) {}

  async getKingdomByUser(userId: string) {
    const kingdom = await this.kingdomRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!kingdom) throw new NotFoundException('Kingdom not found');

    // Tick resources before returning
    const updated = await this.economyService.tickKingdom(kingdom.id);
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

    // Complete finished building upgrades
    const now = new Date();
    const buildingsToSave = buildings.filter(
      b => b.upgradeEndsAt && now >= new Date(b.upgradeEndsAt),
    );
    for (const b of buildingsToSave) {
      b.level += 1;
      b.upgradeEndsAt = null;
      if (b.type === 'town_hall') {
        const mult = 1 + (b.level - 1) * 0.3;
        updated.maxGold  = Math.floor(5000 * mult);
        updated.maxWood  = Math.floor(4000 * mult);
        updated.maxStone = Math.floor(3000 * mult);
        updated.maxFood  = Math.floor(2000 * mult);
        await this.kingdomRepo.save(updated);
      }
    }
    if (buildingsToSave.length > 0) await this.buildingRepo.save(buildingsToSave);

    // Complete finished unit training
    const unitsToSave = units.filter(
      u => u.trainingEndsAt && now >= new Date(u.trainingEndsAt) && u.trainingCount > 0,
    );
    for (const u of unitsToSave) {
      u.count += u.trainingCount;
      u.trainingCount = 0;
      u.trainingEndsAt = null;
    }
    if (unitsToSave.length > 0) await this.unitRepo.save(unitsToSave);

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

  async buyShield(kingdomId: string) {
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    const SHIELD_COST = 50;
    if (kingdom.gems < SHIELD_COST) throw new BadRequestException('Need 50 gems');
    kingdom.gems -= SHIELD_COST;
    kingdom.shieldUntil = new Date(Date.now() + 24 * 3600 * 1000);
    await this.kingdomRepo.save(kingdom);
    return { shieldUntil: kingdom.shieldUntil };
  }

  async hireWorker(kingdomId: string) {
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    const thBuilding = await this.buildingRepo.findOne({ where: { kingdom: { id: kingdomId }, type: 'town_hall' as any } });
    const thLevel = thBuilding?.level ?? 1;
    const maxWorkers = 3 + thLevel; // max workers scales with TH level
    if (kingdom.workers >= maxWorkers) throw new BadRequestException(`מקסימום ${maxWorkers} עובדים (שדרג בית עיר)`);
    const HIRE_COST = 50;
    if (kingdom.gold < HIRE_COST) throw new BadRequestException('דרוש 50 זהב לגיוס עובד');
    kingdom.gold -= HIRE_COST;
    kingdom.workers = (kingdom.workers || 0) + 1;
    kingdom.maxWorkers = maxWorkers;
    await this.kingdomRepo.save(kingdom);
    return { workers: kingdom.workers, maxWorkers };
  }

  async fireWorker(kingdomId: string) {
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    if (!kingdom.workers || kingdom.workers <= 0) throw new BadRequestException('אין עובדים לפטר');
    kingdom.workers -= 1;
    kingdom.gold += 25; // partial refund
    await this.kingdomRepo.save(kingdom);
    return { workers: kingdom.workers };
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
