import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kingdom } from './kingdom.entity';
import { Building } from '../building/building.entity';
import { Unit } from '../units/unit.entity';
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

    // Complete finished building upgrades
    const now = new Date();
    const buildingsToSave = buildings.filter(
      b => b.upgradeEndsAt && now >= new Date(b.upgradeEndsAt),
    );
    for (const b of buildingsToSave) {
      b.level += 1;
      b.upgradeEndsAt = null;
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

    const productionRates = this.economyService.getProductionRates(buildings);

    return {
      kingdom: updated,
      buildings,
      units,
      productionRates,
      shieldActive: updated.isShielded,
      shieldUntil: updated.shieldUntil,
    };
  }
}
