import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit, UnitType } from './unit.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Building, BuildingType } from '../building/building.entity';
import { UNIT_STATS } from '../../constants/game.constants';

@Injectable()
export class UnitsService {
  constructor(
    @InjectRepository(Unit) private unitRepo: Repository<Unit>,
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
    @InjectRepository(Building) private buildingRepo: Repository<Building>,
  ) {}

  async trainUnits(kingdomId: string, unitType: UnitType, amount: number) {
    const [unit, kingdom, barracks] = await Promise.all([
      this.unitRepo.findOne({ where: { kingdom: { id: kingdomId }, type: unitType } }),
      this.kingdomRepo.findOne({ where: { id: kingdomId } }),
      this.buildingRepo.findOne({ where: { kingdom: { id: kingdomId }, type: BuildingType.BARRACKS } }),
    ]);

    if (!barracks) throw new BadRequestException('No Barracks');
    if (unit?.trainingEndsAt && new Date() < unit.trainingEndsAt) {
      throw new BadRequestException('Already training units');
    }

    const stats = UNIT_STATS[unitType];
    if (barracks.level < stats.requiredBarracksLevel) {
      throw new BadRequestException(`Requires Barracks level ${stats.requiredBarracksLevel}`);
    }
    if (stats.requiresVip && !kingdom.isVip) {
      throw new BadRequestException('VIP required');
    }

    // Create the unit row lazily if it doesn't exist yet (avoids null crash below)
    let unitRow = unit;
    if (!unitRow) {
      unitRow = this.unitRepo.create({
        kingdom: { id: kingdomId } as any,
        type: unitType,
        count: 0,
        trainingCount: 0,
        trainingEndsAt: null,
      });
    }

    if (stats.requiresVip) {
      const totalGems = (stats.gemsCost ?? 0) * amount;
      if (kingdom.gems < totalGems) throw new BadRequestException('Not enough gems');
      kingdom.gems -= totalGems;
    } else {
      const totalGold = stats.goldCost * amount;
      if (kingdom.gold < totalGold) throw new BadRequestException('Not enough gold');
      kingdom.gold -= totalGold;
    }
    await this.kingdomRepo.save(kingdom);

    const trainingSeconds = stats.trainingTime * amount;
    unitRow.trainingCount = amount;
    unitRow.trainingEndsAt = new Date(Date.now() + trainingSeconds * 1000);
    await this.unitRepo.save(unitRow);

    return { unit: unitRow, trainingEndsAt: unitRow.trainingEndsAt, durationSeconds: trainingSeconds };
  }

  getAvailableUnits(barracksLevel: number) {
    return Object.entries(UNIT_STATS)
      .filter(([, stats]) => barracksLevel >= stats.requiredBarracksLevel)
      .map(([type, stats]) => ({ type, ...stats }));
  }
}
