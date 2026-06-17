import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit, UnitType } from './unit.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Building, BuildingType } from '../building/building.entity';
import { UNIT_STATS } from '../../constants/game.constants';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-log.entity';

@Injectable()
export class UnitsService {
  constructor(
    @InjectRepository(Unit) private unitRepo: Repository<Unit>,
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
    @InjectRepository(Building) private buildingRepo: Repository<Building>,
    private auditService: AuditService,
  ) {}

  async trainUnits(kingdomId: string, unitType: UnitType, amount: number) {
    const [unit, kingdom, barracks] = await Promise.all([
      this.unitRepo.findOne({ where: { kingdom: { id: kingdomId }, type: unitType } }),
      this.kingdomRepo.findOne({ where: { id: kingdomId } }),
      this.buildingRepo.findOne({ where: { kingdom: { id: kingdomId }, type: BuildingType.BARRACKS } }),
    ]);

    if (!barracks) throw new BadRequestException('No Barracks');

    const stats = UNIT_STATS[unitType];
    if (barracks.level < stats.requiredBarracksLevel) {
      throw new BadRequestException(`Requires Barracks level ${stats.requiredBarracksLevel}`);
    }
    // Use direct column comparison — the getter may not be available on a plain DB row
    const isVip = kingdom.vipExpiresAt && new Date() < new Date(kingdom.vipExpiresAt);
    if (stats.requiresVip && !isVip) {
      throw new BadRequestException('VIP_REQUIRED');
    }
    // Ragnar can only be trained if player already has at least 1 (unlocked via referral)
    if (stats.requiresReferralHero) {
      const existing = unit; // already fetched above
      if (!existing || existing.count === 0) {
        throw new BadRequestException('RAGNAR_NOT_UNLOCKED');
      }
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

    if (stats.requiresVip || stats.requiresReferralHero) {
      const totalGems = (stats.gemsCost ?? 0) * amount;
      if (kingdom.gems < totalGems) throw new BadRequestException('Not enough gems');
      kingdom.gems -= totalGems;
    } else {
      const totalGold = stats.goldCost * amount;
      if (kingdom.gold < totalGold) throw new BadRequestException('Not enough gold');
      kingdom.gold -= totalGold;
    }
    await this.kingdomRepo.save(kingdom);

    const baseTrainingSeconds = stats.trainingTime * amount;
    const trainingSeconds = isVip ? Math.ceil(baseTrainingSeconds * 0.5) : baseTrainingSeconds;
    if (unitRow.trainingEndsAt && new Date() < unitRow.trainingEndsAt) {
      // Stack on existing training queue instead of blocking
      unitRow.trainingCount += amount;
      unitRow.trainingEndsAt = new Date(unitRow.trainingEndsAt.getTime() + trainingSeconds * 1000);
    } else {
      unitRow.trainingCount = amount;
      unitRow.trainingEndsAt = new Date(Date.now() + trainingSeconds * 1000);
    }
    await this.unitRepo.save(unitRow);

    const costType = (stats.requiresVip || stats.requiresReferralHero) ? 'gems' : 'gold';
    const costAmount = costType === 'gems' ? (stats.gemsCost ?? 0) * amount : stats.goldCost * amount;
    this.auditService.log(AuditAction.TRAIN_UNITS, kingdomId, {
      unitType,
      amount,
      costType,
      costAmount,
      trainingEndsAt: unitRow.trainingEndsAt,
    });

    return { unit: unitRow, trainingEndsAt: unitRow.trainingEndsAt, durationSeconds: trainingSeconds };
  }

  getAvailableUnits(barracksLevel: number) {
    return Object.entries(UNIT_STATS)
      .filter(([, stats]) => barracksLevel >= stats.requiredBarracksLevel)
      .map(([type, stats]) => ({ type, ...stats }));
  }
}
