import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Building, BuildingType } from '../building/building.entity';
import { Unit } from '../units/unit.entity';
import { User } from '../user/user.entity';
import { NotificationService } from '../notifications/notification.service';
import {
  BASE_PRODUCTION,
  PRODUCTION_MULTIPLIER,
  UNIT_STATS,
  WEAK_PLAYER_RESOURCE_BONUS,
} from '../../constants/game.constants';
import { HERO_TYPES, HERO_SALARY_GEMS } from '../units/unit.entity';

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
    @InjectRepository(User) private userRepo: Repository<User>,
    @Inject(forwardRef(() => NotificationService)) private notifService: NotificationService,
  ) {}

  @Cron('*/5 * * * *')
  async tickAllKingdoms() {
    const kingdoms = await this.kingdomRepo.find({ relations: ['user'] });
    // Sequential to avoid DB overload and notification flood
    for (const k of kingdoms) {
      await this.tickKingdom(k.id, k.user?.id, k.user).catch(() => {});
    }
  }

  // Apply idle production since last tick for a single kingdom
  async tickKingdom(kingdomId: string, userId?: string, userObj?: any): Promise<Kingdom> {
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
    const vipBonus = kingdom.isVip ? 0.5 : 0; // VIP = +50% production
    const workerCount = kingdom.workers || 0;
    const workerProductionBonus = 1 + workerCount * 0.04; // +4% per worker
    const bonus = (1 + weakBonus + boostBonus + vipBonus) * workerProductionBonus;

    // Worker salary: 5 gold/hour per worker
    const workerSalary = workerCount * 5 * hoursElapsed;

    // Hero salary: deduct gems daily; heroes who aren't paid leave (count--)
    const HERO_SALARY_INTERVAL_HOURS = 24;
    const heroSalaryTicks = Math.floor(hoursElapsed / HERO_SALARY_INTERVAL_HOURS);
    if (heroSalaryTicks > 0) {
      let gemsNeeded = 0;
      for (const unit of units) {
        if (HERO_TYPES.has(unit.type) && unit.count > 0) {
          gemsNeeded += (HERO_SALARY_GEMS[unit.type] ?? 0) * heroSalaryTicks;
        }
      }
      if (gemsNeeded > 0) {
        if (kingdom.gems >= gemsNeeded) {
          kingdom.gems -= gemsNeeded;
        } else {
          // Not enough gems — heroes leave one by one until debt is covered
          let debt = gemsNeeded - kingdom.gems;
          kingdom.gems = 0;
          for (const unit of units) {
            if (debt <= 0) break;
            if (HERO_TYPES.has(unit.type) && unit.count > 0) {
              const salary = (HERO_SALARY_GEMS[unit.type] ?? 0) * heroSalaryTicks;
              if (salary > 0) {
                unit.count = Math.max(0, unit.count - 1);
                debt -= salary;
              }
            }
          }
          await this.unitRepo.save(units.filter(u => HERO_TYPES.has(u.type)));
        }
      }
    }

    // Food: production - soldier upkeep
    const newFood = kingdom.food + production.food * bonus - upkeep;
    const foodShortfall = Math.max(0, -newFood); // how much food we're short

    kingdom.gold  = Math.min(kingdom.maxGold,  Math.max(0, Math.floor(kingdom.gold  + production.gold  * bonus - workerSalary)));
    kingdom.wood  = Math.min(kingdom.maxWood,  Math.floor(kingdom.wood  + production.wood  * bonus));
    kingdom.stone = Math.min(kingdom.maxStone, Math.floor(kingdom.stone + production.stone * bonus));
    kingdom.food  = Math.min(kingdom.maxFood,  Math.max(0, Math.floor(newFood)));
    kingdom.lastResourceTick = now;

    // Food shortage: soldiers desert (lose 0.5% per food unit short, max 5% per tick)
    if (foodShortfall > 0) {
      const desertionRate = Math.min(0.05, foodShortfall * 0.005);
      let desertionChanged = false;
      for (const unit of units) {
        if (unit.count > 0) {
          const lost = Math.max(1, Math.floor(unit.count * desertionRate));
          unit.count = Math.max(0, unit.count - lost);
          desertionChanged = true;
        }
      }
      if (desertionChanged) {
        await this.unitRepo.save(units.filter(u => u.count >= 0));
      }
    }

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

    // Complete any finished building upgrades — returns completed list for notifications
    const completedBuildings = await this.completeBuildingUpgrades(kingdomId, buildings, now);
    const completedUnits = await this.completeUnitTraining(kingdomId, units, now);
    // Complete finished repairs
    await this.completeRepairs(buildings, now);

    const saved = await this.kingdomRepo.save(kingdom);

    // Send push notifications if we have a userId (from cron or passed by caller)
    const resolvedUserId = userId ?? (await this.kingdomRepo.findOne({ where: { id: kingdomId }, relations: ['user'] }))?.user?.id;
    if (resolvedUserId && (completedBuildings.length > 0 || completedUnits.length > 0)) {
      // Fetch user for telegramId + language (use passed userObj to avoid extra DB query)
      const user = userObj ?? await this.userRepo?.findOne({ where: { id: resolvedUserId } }).catch(() => null);
      const userPayload = user ? { telegramId: user.telegramId, language: user.language || 'en' } : {};

      // Group by type — one push per building type (e.g. 3 farms → one notification)
      if (completedBuildings.length > 0) {
        const grouped = new Map<string, { count: number; level: number }>();
        for (const b of completedBuildings) {
          const existing = grouped.get(b.type);
          if (existing) existing.count++;
          else grouped.set(b.type, { count: 1, level: b.level });
        }
        for (const [type, { count, level }] of grouped) {
          this.notifService.create(resolvedUserId, 'build_done', { ...userPayload, building: type, level, count }).catch(() => {});
        }
      }
      // Group units by type — one push per unit type
      if (completedUnits.length > 0) {
        const grouped = new Map<string, number>();
        for (const u of completedUnits) grouped.set(u.type, (grouped.get(u.type) ?? 0) + u.count);
        for (const [type, count] of grouped) {
          this.notifService.create(resolvedUserId, 'training_done', { ...userPayload, unit: type, count }).catch(() => {});
        }
      }
    }

    (saved as any).__completedBuildings = completedBuildings;
    (saved as any).__completedUnits = completedUnits;
    return saved;
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

  private async completeBuildingUpgrades(kingdomId: string, buildings: Building[], now: Date): Promise<{ type: string; level: number }[]> {
    const completed: { type: string; level: number }[] = [];
    for (const building of buildings) {
      if (building.upgradeEndsAt && now >= new Date(building.upgradeEndsAt)) {
        building.level += 1;
        building.upgradeEndsAt = null;
        await this.buildingRepo.save(building);
        completed.push({ type: building.type, level: building.level });

        if (building.type === BuildingType.TOWN_HALL) {
          const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
          if (kingdom) {
            const mult = 1 + (building.level - 1) * 0.3;
            kingdom.maxGold  = Math.floor(5000 * mult);
            kingdom.maxWood  = Math.floor(4000 * mult);
            kingdom.maxStone = Math.floor(3000 * mult);
            kingdom.maxFood  = Math.floor(2000 * mult);
            await this.kingdomRepo.save(kingdom);
          }
        }
      }
    }
    return completed;
  }

  private async completeUnitTraining(kingdomId: string, units: Unit[], now: Date): Promise<{ type: string; count: number }[]> {
    const completed: { type: string; count: number }[] = [];
    for (const unit of units) {
      if (unit.trainingEndsAt && now >= new Date(unit.trainingEndsAt) && unit.trainingCount > 0) {
        completed.push({ type: unit.type, count: unit.trainingCount });
        unit.count += unit.trainingCount;
        unit.trainingCount = 0;
        unit.trainingEndsAt = null;
        await this.unitRepo.save(unit);
      }
    }
    return completed;
  }

  private async completeRepairs(buildings: Building[], now: Date): Promise<void> {
    for (const building of buildings) {
      if (building.needsRepair && building.repairEndsAt && now >= new Date(building.repairEndsAt)) {
        building.needsRepair = false;
        building.repairEndsAt = null;
        await this.buildingRepo.save(building);
      }
    }
  }

  getProductionRates(buildings: Building[], kingdom?: Kingdom): Record<string, number> {
    const rates = this.calculateProduction(buildings, 1); // per-hour rates

    const now = new Date();
    const isWeak = kingdom ? kingdom.score < 1000 : false;
    const boostActive = !!(kingdom?.productionBoostUntil && now < new Date(kingdom.productionBoostUntil));
    const weakBonus = isWeak ? WEAK_PLAYER_RESOURCE_BONUS : 0;
    const boostBonus = boostActive ? 1 : 0;
    const vipBonus = kingdom?.isVip ? 0.5 : 0;
    const workerCount = kingdom?.workers || 0;
    const workerProductionBonus = 1 + workerCount * 0.04;
    const bonus = (1 + weakBonus + boostBonus + vipBonus) * workerProductionBonus;
    const workerSalary = workerCount * 5;

    return {
      gold:  Math.floor(rates.gold  * bonus - workerSalary),
      wood:  Math.floor(rates.wood  * bonus),
      stone: Math.floor(rates.stone * bonus),
      food:  Math.floor(rates.food  * bonus),
    };
  }
}
