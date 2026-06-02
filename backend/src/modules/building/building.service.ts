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

  async upgradeBuilding(kingdomId: string, buildingType: BuildingType, isVip = false) {
    const [building, kingdom] = await Promise.all([
      this.buildingRepo.findOne({ where: { kingdom: { id: kingdomId }, type: buildingType } }),
      this.kingdomRepo.findOne({ where: { id: kingdomId } }),
    ]);

    if (!building) throw new BadRequestException('Building not found');
    if (building.isUpgrading) throw new BadRequestException('Building already upgrading');
    if (building.level >= MAX_BUILDING_LEVEL) throw new BadRequestException('Building at max level');

    const cost = this.getUpgradeCost(buildingType, building.level);

    if (kingdom.gold < cost.gold) throw new BadRequestException('Not enough gold');
    if (kingdom.wood < cost.wood) throw new BadRequestException('Not enough wood');
    if (kingdom.stone < cost.stone) throw new BadRequestException('Not enough stone');

    // Deduct cost
    kingdom.gold  -= cost.gold;
    kingdom.wood  -= cost.wood;
    kingdom.stone -= cost.stone;
    await this.kingdomRepo.save(kingdom);

    // Start upgrade timer
    let buildTime = this.getBuildTime(buildingType, building.level);
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

  async speedUpUpgrade(kingdomId: string, buildingType: BuildingType) {
    const [building, kingdom] = await Promise.all([
      this.buildingRepo.findOne({ where: { kingdom: { id: kingdomId }, type: buildingType } }),
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
