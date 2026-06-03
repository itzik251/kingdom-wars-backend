import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Building, BuildingType } from './building.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import {
  BUILDING_BASE_COSTS,
  BUILDING_BASE_TIMES,
  UPGRADE_COST_MULTIPLIER,
  BUILD_TIME_MULTIPLIER,
  MAX_BUILDING_LEVEL,
  VIP_BUILD_TIME_REDUCTION,
} from '../../constants/game.constants';

@Injectable()
export class BuildingService {
  constructor(
    @InjectRepository(Building) private buildingRepo: Repository<Building>,
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
  ) {}

  async upgradeBuilding(kingdomId: string, buildingType: BuildingType, isVip = false, buildingId?: string) {
    const [building, kingdom] = await Promise.all([
      buildingId
        ? this.buildingRepo.findOne({ where: { id: buildingId, kingdom: { id: kingdomId } } })
        : this.buildingRepo.findOne({ where: { kingdom: { id: kingdomId }, type: buildingType } }),
      this.kingdomRepo.findOne({ where: { id: kingdomId } }),
    ]);

    if (!building) throw new BadRequestException('Building not found');
    if (building.isUpgrading) throw new BadRequestException('Building already upgrading');
    if (building.level >= MAX_BUILDING_LEVEL) throw new BadRequestException('Building at max level');

    const cost = this.getUpgradeCost(building.type as BuildingType, building.level);

    if (kingdom.gold < cost.gold) throw new BadRequestException('Not enough gold');
    if (kingdom.wood < cost.wood) throw new BadRequestException('Not enough wood');
    if (kingdom.stone < cost.stone) throw new BadRequestException('Not enough stone');

    // Deduct cost
    kingdom.gold  -= cost.gold;
    kingdom.wood  -= cost.wood;
    kingdom.stone -= cost.stone;
    await this.kingdomRepo.save(kingdom);

    // Start upgrade timer
    let buildTime = this.getBuildTime(building.type as BuildingType, building.level);
    if (isVip) buildTime = Math.floor(buildTime * (1 - VIP_BUILD_TIME_REDUCTION));

    building.upgradeEndsAt = new Date(Date.now() + buildTime * 1000);
    await this.buildingRepo.save(building);

    return {
      building,
      cost,
      upgradeEndsAt: building.upgradeEndsAt,
      durationSeconds: buildTime,
    };
  }

  async speedUpUpgrade(kingdomId: string, buildingType: BuildingType, buildingId?: string) {
    const [building, kingdom] = await Promise.all([
      buildingId
        ? this.buildingRepo.findOne({ where: { id: buildingId, kingdom: { id: kingdomId } } })
        : this.buildingRepo.findOne({ where: { kingdom: { id: kingdomId }, type: buildingType } }),
      this.kingdomRepo.findOne({ where: { id: kingdomId } }),
    ]);
    if (!building?.upgradeEndsAt || new Date() > new Date(building.upgradeEndsAt))
      throw new BadRequestException('Building is not upgrading');

    const secsLeft = Math.max(0, (new Date(building.upgradeEndsAt).getTime() - Date.now()) / 1000);
    const gemCost = Math.max(1, Math.ceil(secsLeft / 60)); // 1 gem per minute

    if (kingdom.gems < gemCost) throw new BadRequestException(`Need ${gemCost} gems`);

    kingdom.gems -= gemCost;
    building.level += 1;
    building.upgradeEndsAt = null;
    await Promise.all([this.kingdomRepo.save(kingdom), this.buildingRepo.save(building)]);
    return { gemCost, newLevel: building.level };
  }

  getUpgradeCost(type: BuildingType, currentLevel: number): { gold: number; wood: number; stone: number } {
    const base = BUILDING_BASE_COSTS[type];
    const mult = Math.pow(UPGRADE_COST_MULTIPLIER, currentLevel);
    return {
      gold:  Math.floor(base.gold  * mult),
      wood:  Math.floor(base.wood  * mult),
      stone: Math.floor(base.stone * mult),
    };
  }

  getBuildTime(type: BuildingType, currentLevel: number): number {
    const base = BUILDING_BASE_TIMES[type];
    return Math.floor(base * Math.pow(BUILD_TIME_MULTIPLIER, currentLevel));
  }

  async buildNew(kingdomId: string, buildingType: BuildingType) {
    const baseCost = BUILDING_BASE_COSTS[buildingType];
    if (!baseCost) throw new BadRequestException('Invalid building type');

    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });

    // Resource buildings may be duplicated (slot 0,1,2); everything else is singular.
    const MULTI_ALLOWED: BuildingType[] = [
      BuildingType.GOLD_MINE, BuildingType.LUMBER_MILL, BuildingType.STONE_QUARRY, BuildingType.FARM,
    ];
    const existing = await this.buildingRepo.find({ where: { kingdom: { id: kingdomId }, type: buildingType } });

    if (existing.length > 0 && !MULTI_ALLOWED.includes(buildingType)) {
      throw new BadRequestException('Building already exists');
    }
    if (existing.length >= 3) throw new BadRequestException('Maximum 3 of this building');

    // VIP-only buildings
    if (buildingType === BuildingType.ARCANE_TOWER && !kingdom.isVip) {
      throw new BadRequestException('VIP required');
    }

    // Cost multiplier for duplicates: 1st = 1×, 2nd = 2×, 3rd = 4×
    const mult = Math.pow(2, existing.length);
    const cost = {
      gold:  Math.floor(baseCost.gold  * mult),
      wood:  Math.floor(baseCost.wood  * mult),
      stone: Math.floor(baseCost.stone * mult),
    };

    if (kingdom.gold < cost.gold) throw new BadRequestException('Not enough gold');
    if (kingdom.wood < cost.wood) throw new BadRequestException('Not enough wood');
    if (kingdom.stone < cost.stone) throw new BadRequestException('Not enough stone');

    kingdom.gold  -= cost.gold;
    kingdom.wood  -= cost.wood;
    kingdom.stone -= cost.stone;
    await this.kingdomRepo.save(kingdom);

    const slot = existing.length;
    const building = this.buildingRepo.create({ kingdom: { id: kingdomId } as any, type: buildingType, level: 1, slot });
    await this.buildingRepo.save(building);

    return { building, cost };
  }

  async repairBuilding(kingdomId: string, buildingId: string) {
    const [building, kingdom] = await Promise.all([
      this.buildingRepo.findOne({ where: { id: buildingId, kingdom: { id: kingdomId } } }),
      this.kingdomRepo.findOne({ where: { id: kingdomId } }),
    ]);
    if (!building) throw new BadRequestException('Building not found');
    if (!building.needsRepair) throw new BadRequestException('Building does not need repair');

    // Repair cost: 50% of upgrade cost at current level
    const baseCost = this.getUpgradeCost(building.type as BuildingType, building.level);
    const cost = { gold: Math.floor(baseCost.gold * 0.5), wood: Math.floor(baseCost.wood * 0.5), stone: Math.floor(baseCost.stone * 0.5) };

    if (kingdom.gold < cost.gold) throw new BadRequestException('Not enough gold');
    if (kingdom.wood < cost.wood) throw new BadRequestException('Not enough wood');
    if (kingdom.stone < cost.stone) throw new BadRequestException('Not enough stone');

    kingdom.gold -= cost.gold; kingdom.wood -= cost.wood; kingdom.stone -= cost.stone;
    building.needsRepair = false;
    await Promise.all([this.kingdomRepo.save(kingdom), this.buildingRepo.save(building)]);
    return { building, cost };
  }

  async getAllUpgradeCosts(kingdomId: string) {
    const buildings = await this.buildingRepo.find({ where: { kingdom: { id: kingdomId } } });
    return buildings.map(b => ({
      type: b.type,
      level: b.level,
      nextLevelCost: this.getUpgradeCost(b.type, b.level),
      buildTimeSeconds: this.getBuildTime(b.type, b.level),
      isUpgrading: b.isUpgrading,
      upgradeEndsAt: b.upgradeEndsAt,
    }));
  }
}
