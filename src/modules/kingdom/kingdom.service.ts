import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
