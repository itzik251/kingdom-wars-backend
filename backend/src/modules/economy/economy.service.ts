import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Building, BuildingType } from '../building/building.entity';
import { Unit } from '../units/unit.entity';
import {
  BASE_PRODUCTION,
  PRODUCTION_MULTIPLIER,
  UNIT_STATS,
  WEAK_PLAYER_RESOURCE_BONUS,
  VIP_GAME_PRODUCTION_MULTIPLIER,
} from '../../constants/game.constants';

const PRODUCER_BUILDINGS: Partial<Record<BuildingType, keyof typeof BASE_PRODUCTION>> = {
  [BuildingType.GOLD_MINE]:    'gold_mine',
  [BuildingType.LUMBER_MILL]:  'lumber_mill',
  [BuildingType.STONE_QUARRY]: 'stone_quarry',
  [BuildingType.FARM]:         'farm',
};

@Injectable()
export class EconomyService {
  constructor(
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
    @InjectRepository(Building) private buildingRepo: Repository<Building>,
    @InjectRepository(Unit) private unitRepo: Repository<Unit>,
  ) {}

  // Called every hour by cron — tick all kingdoms
  // Tick every 5 minutes in dev, every hour in prod
  @Cron('*/5 * * * *')
  async tickAllKingdoms() {
    const kingdoms = await this.kingdomRepo.find();
    await Promise.all(kingdoms.map(k => this.tickKingdom(k.id).catch(() => {})));
  }

  // Apply idle production since last tick for a single kingdom
  async tickKingdom(kingdomId: string): Promise<Kingdom> {
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    const buildings = await this.buildingRepo.find({ where: { kingdom: { id: kingdomId } } });
    const units = await this.unitRepo.find({ where: { kingdom: { id: kingdomId } } });

    const now = new Date();
    // If never ticked, initialise the tick timestamp and continue (first tick earns 0)
    if (!kingdom.lastResourceTick) {
      kingdom.lastResourceTick = now;
      await this.kingdomRepo.save(kingdom);
      return kingdom;
    }

    const lastTick = new Date(kingdom.lastResourceTick);
    const hoursElapsed = (now.getTime() - lastTick.getTime()) / 3_600_000;

    if (hoursElapsed < 0.016) return kingdom; // less than ~1 minute, skip

    const production = this.calculateProduction(buildings, hoursElapsed);
    const upkeep = this.calculateUpkeep(units, hoursElapsed);
    const isWeak = kingdom.score < 1000;

    const weakBonus = isWeak ? WEAK_PLAYER_RESOURCE_BONUS : 0;
    const boostActive = kingdom.productionBoostUntil && now < new Date(kingdom.productionBoostUntil);
    const boostBonus = boostActive ? 1 : 0; // double_production = +100%
    const bonus = 1 + weakBonus + boostBonus;

    kingdom.gold  = Math.min(kingdom.maxGold,  Math.floor(kingdom.gold  + production.gold  * bonus));
    kingdom.wood  = Math.min(kingdom.maxWood,  Math.floor(kingdom.wood  + production.wood  * bonus));
    kingdom.stone = Math.min(kingdom.maxStone, Math.floor(kingdom.stone + production.stone * bonus));
    kingdom.food  = Math.min(kingdom.maxFood,  Math.max(0, Math.floor(kingdom.food + production.food * bonus - upkeep)));

    // VIP players earn GAME tokens passively (1.5x multiplier for VIP)
    if (kingdom.isVip) {
      const totalProduction = production.gold + production.wood + production.stone + production.food;
      const gameEarned = totalProduction * 0.000001 * VIP_GAME_PRODUCTION_MULTIPLIER;
      kingdom.gameBalance = parseFloat(((kingdom.gameBalance ?? 0) + gameEarned).toFixed(6));
    }

    kingdom.lastResourceTick = now;

    // Heal wounded soldiers (base 5/hour per unit type, hospital adds 10/level)
    const hospital = buildings.find(b => b.type === BuildingType.HOSPITAL);
    const healRate = 5 + (hospital ? hospital.level * 10 : 0);
    let woundedChanged = false;
    for (const unit of units) {
      if ((unit.woundedCount || 0) > 0) {
        const healed = Math.min(unit.woundedCount, Math.floor(healRate * hoursElapsed));
        if (healed > 0) {
          unit.woundedCount -= healed;
          unit.count += healed;
          woundedChanged = true;
        }
      }
    }
    if (woundedChanged) {
      await this.unitRepo.save(units.filter(u => u.woundedCount >= 0));
    }

    // Complete any finished building upgrades
    await this.completeBuildingUpgrades(kingdomId, buildings, now);
    await this.completeUnitTraining(kingdomId, units, now);

    return this.kingdomRepo.save(kingdom);
  }

  calculateProduction(buildings: Building[], hours: number): Record<string, number> {
    const result = { gold: 0, wood: 0, stone: 0, food: 0 };

    for (const building of buildings) {
      const key = PRODUCER_BUILDINGS[building.type];
      if (!key || building.isUpgrading) continue;

      const baseRate = BASE_PRODUCTION[key];
      const rate = baseRate * Math.pow(PRODUCTION_MULTIPLIER, building.level - 1);
      const RESOURCE_MAP: Record<string, string> = {
        gold_mine: 'gold', lumber_mill: 'wood', stone_quarry: 'stone', farm: 'food',
      };
      const resource = RESOURCE_MAP[key];
      if (resource) result[resource as keyof typeof result] += rate * hours;
    }

    return result;
  }

  calculateUpkeep(units: Unit[], hours: number): number {
    return units.reduce((total, unit) => {
      const stats = UNIT_STATS[unit.type];
      return total + unit.count * stats.upkeep * hours;
    }, 0);
  }

  private async completeBuildingUpgrades(kingdomId: string, buildings: Building[], now: Date) {
    for (const building of buildings) {
      if (building.upgradeEndsAt && now >= building.upgradeEndsAt) {
        building.level += 1;
        building.upgradeEndsAt = null;
        await this.buildingRepo.save(building);

        // If town hall upgraded, expand storage
        if (building.type === BuildingType.TOWN_HALL) {
          const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
          if (kingdom) {
            const mult = 1 + (building.level - 1) * 0.3; // +30% per TH level
            kingdom.maxGold  = Math.floor(5000 * mult);
            kingdom.maxWood  = Math.floor(4000 * mult);
            kingdom.maxStone = Math.floor(3000 * mult);
            kingdom.maxFood  = Math.floor(2000 * mult);
            await this.kingdomRepo.save(kingdom);
          }
        }
      }
    }
  }

  private async completeUnitTraining(kingdomId: string, units: Unit[], now: Date) {
    for (const unit of units) {
      if (unit.trainingEndsAt && now >= unit.trainingEndsAt) {
        unit.count += unit.trainingCount;
        unit.trainingCount = 0;
        unit.trainingEndsAt = null;
        await this.unitRepo.save(unit);
      }
    }
  }

  getProductionRates(buildings: Building[], kingdom?: Kingdom): Record<string, number> {
    const rates = this.calculateProduction(buildings, 1); // per-hour rates

    // Apply the same bonuses the tick applies, so the UI shows the real rate.
    const now = new Date();
    const isWeak = kingdom ? kingdom.score < 1000 : false;
    const boostActive = !!(kingdom?.productionBoostUntil && now < new Date(kingdom.productionBoostUntil));
    const weakBonus = isWeak ? WEAK_PLAYER_RESOURCE_BONUS : 0;
    const boostBonus = boostActive ? 1 : 0;
    const bonus = 1 + weakBonus + boostBonus;

    return {
      gold:  Math.floor(rates.gold  * bonus),
      wood:  Math.floor(rates.wood  * bonus),
      stone: Math.floor(rates.stone * bonus),
      food:  Math.floor(rates.food  * bonus),
    };
  }
}
