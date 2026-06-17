import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-log.entity';

@Injectable()
export class BuildingService {
  constructor(
    @InjectRepository(Building) private buildingRepo: Repository<Building>,
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
    @InjectDataSource() private dataSource: DataSource,
    private auditService: AuditService,
  ) {}

  async upgradeBuilding(kingdomId: string, buildingType: BuildingType, isVip = false, buildingId?: string) {
    // ── Wrap in DB transaction to prevent resource deduction without upgrade ─
    return this.dataSource.transaction(async (manager) => {
    const [building, kingdom] = await Promise.all([
      buildingId
        ? manager.findOne(Building, { where: { id: buildingId, kingdom: { id: kingdomId } } })
        : manager.findOne(Building, { where: { kingdom: { id: kingdomId }, type: buildingType } }),
      manager.findOne(Kingdom, { where: { id: kingdomId } }),
    ]);

    if (!building) throw new BadRequestException('BUILDING_NOT_FOUND');
    if (building.isUpgrading) throw new BadRequestException('ALREADY_UPGRADING');
    if (building.level >= MAX_BUILDING_LEVEL) throw new BadRequestException('BUILDING_MAX_LEVEL');

    const cost = this.getUpgradeCost(building.type as BuildingType, building.level);

    if (kingdom.gold < cost.gold) throw new BadRequestException('NOT_ENOUGH_GOLD');
    if (kingdom.wood < cost.wood) throw new BadRequestException('NOT_ENOUGH_WOOD');
    if (kingdom.stone < cost.stone) throw new BadRequestException('NOT_ENOUGH_STONE');

    // Atomic resource deduction using UPDATE WHERE to prevent race condition
    const deductResult = await manager
      .createQueryBuilder()
      .update(Kingdom)
      .set({
        gold:  () => `gold - ${cost.gold}`,
        wood:  () => `wood - ${cost.wood}`,
        stone: () => `stone - ${cost.stone}`,
      })
      .where('id = :id AND gold >= :g AND wood >= :w AND stone >= :s', {
        id: kingdomId, g: cost.gold, w: cost.wood, s: cost.stone,
      })
      .execute();

    if (!deductResult.affected || deductResult.affected === 0) {
      throw new BadRequestException('NOT_ENOUGH_RESOURCES');
    }

    // Start upgrade timer
    let buildTime = this.getBuildTime(building.type as BuildingType, building.level);
    if (isVip) buildTime = Math.floor(buildTime * (1 - VIP_BUILD_TIME_REDUCTION));

    building.upgradeEndsAt = new Date(Date.now() + buildTime * 1000);
    await manager.save(Building, building);

    this.auditService.log(AuditAction.UPGRADE, kingdomId, {
      type: building.type,
      buildingId: building.id,
      fromLevel: building.level,
      toLevel: building.level + 1,
      cost,
      upgradeEndsAt: building.upgradeEndsAt,
      isVip,
    });

    return {
      building,
      cost,
      upgradeEndsAt: building.upgradeEndsAt,
      durationSeconds: buildTime,
    };
    }); // end transaction
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

    if (kingdom.gems < gemCost) throw new BadRequestException('NOT_ENOUGH_GEMS');

    kingdom.gems -= gemCost;
    building.level += 1;
    building.upgradeEndsAt = null;
    await Promise.all([this.kingdomRepo.save(kingdom), this.buildingRepo.save(building)]);

    // Expand storage caps on level-up
    if (building.type === BuildingType.TOWN_HALL) {
      const mult = 1 + (building.level - 1) * 3.2;
      await this.kingdomRepo.update({ id: kingdomId }, {
        maxGold:  Math.floor(5000 * mult),
        maxWood:  Math.floor(4000 * mult),
        maxStone: Math.floor(3000 * mult),
        maxFood:  Math.floor(2000 * mult),
      });
    } else {
      const STORAGE_BUMP: Partial<Record<BuildingType, { field: string; perLevel: number }>> = {
        [BuildingType.GOLD_MINE]:    { field: 'maxGold',  perLevel: 300 },
        [BuildingType.LUMBER_MILL]:  { field: 'maxWood',  perLevel: 250 },
        [BuildingType.STONE_QUARRY]: { field: 'maxStone', perLevel: 200 },
        [BuildingType.FARM]:         { field: 'maxFood',  perLevel: 150 },
      };
      const bump = STORAGE_BUMP[building.type as BuildingType];
      if (bump) await this.kingdomRepo.increment({ id: kingdomId }, bump.field, bump.perLevel);
    }

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
    if (existing.length >= 6) throw new BadRequestException('Maximum 6 of this building');

    // VIP-only buildings
    if (buildingType === BuildingType.ARCANE_TOWER && !kingdom.isVip) {
      throw new BadRequestException('VIP_REQUIRED');
    }

    // Cost multiplier for duplicates: 1st = 1×, 2nd = 2×, 3rd = 4×
    const mult = Math.pow(2, existing.length);
    const cost = {
      gold:  Math.floor(baseCost.gold  * mult),
      wood:  Math.floor(baseCost.wood  * mult),
      stone: Math.floor(baseCost.stone * mult),
    };

    if (kingdom.gold < cost.gold) throw new BadRequestException('NOT_ENOUGH_GOLD');
    if (kingdom.wood < cost.wood) throw new BadRequestException('NOT_ENOUGH_WOOD');
    if (kingdom.stone < cost.stone) throw new BadRequestException('NOT_ENOUGH_STONE');

    kingdom.gold  -= cost.gold;
    kingdom.wood  -= cost.wood;
    kingdom.stone -= cost.stone;
    await this.kingdomRepo.save(kingdom);

    const slot = existing.length;
    const building = this.buildingRepo.create({ kingdom: { id: kingdomId } as any, type: buildingType, level: 1, slot });
    await this.buildingRepo.save(building);

    return { building, cost };
  }

  getRepairCost(type: BuildingType, level: number) {
    const upgradeCost = this.getUpgradeCost(type, level);
    const repairTime = Math.floor(this.getBuildTime(type, level) * 0.4); // 40% of upgrade time
    return {
      cost: {
        gold:  Math.floor(upgradeCost.gold  * 0.5),
        wood:  Math.floor(upgradeCost.wood  * 0.5),
        stone: Math.floor(upgradeCost.stone * 0.5),
      },
      repairTimeSeconds: repairTime,
    };
  }

  async repairBuilding(kingdomId: string, buildingId: string) {
    const [building, kingdom] = await Promise.all([
      this.buildingRepo.findOne({ where: { id: buildingId, kingdom: { id: kingdomId } } }),
      this.kingdomRepo.findOne({ where: { id: kingdomId } }),
    ]);
    if (!building) throw new BadRequestException('Building not found');
    if (!building.needsRepair) throw new BadRequestException('Building does not need repair');
    if ((building as any).isRepairing) throw new BadRequestException('Already repairing');

    const { cost, repairTimeSeconds } = this.getRepairCost(building.type as BuildingType, building.level);

    if (kingdom.gold < cost.gold) throw new BadRequestException('NOT_ENOUGH_GOLD');
    if (kingdom.wood < cost.wood) throw new BadRequestException('NOT_ENOUGH_WOOD');
    if (kingdom.stone < cost.stone) throw new BadRequestException('NOT_ENOUGH_STONE');

    kingdom.gold -= cost.gold; kingdom.wood -= cost.wood; kingdom.stone -= cost.stone;
    building.repairEndsAt = new Date(Date.now() + repairTimeSeconds * 1000);
    await Promise.all([this.kingdomRepo.save(kingdom), this.buildingRepo.save(building)]);
    return { building, cost, repairEndsAt: building.repairEndsAt, repairTimeSeconds };
  }

  async completeRepairs(kingdomId: string): Promise<void> {
    const now = new Date();
    const buildings = await this.buildingRepo.find({ where: { kingdom: { id: kingdomId } } });
    const toFix = buildings.filter(b => b.needsRepair && b.repairEndsAt && now >= new Date(b.repairEndsAt));
    for (const b of toFix) {
      b.needsRepair = false;
      b.repairEndsAt = null;
      await this.buildingRepo.save(b);
    }
  }

  async moveBuilding(kingdomId: string, buildingId: string, gridX: number, gridY: number) {
    const building = await this.buildingRepo.findOne({ where: { id: buildingId, kingdom: { id: kingdomId } } });
    if (!building) throw new BadRequestException('Building not found');
    if (gridX < 0 || gridX > 15 || gridY < 0 || gridY > 15) throw new BadRequestException('Invalid position');
    building.gridX = gridX;
    building.gridY = gridY;
    await this.buildingRepo.save(building);
    return { id: building.id, gridX, gridY };
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
