import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Unit } from '../units/unit.entity';
import { Building, BuildingType } from '../building/building.entity';
import { User } from '../user/user.entity';
import { EconomyService } from '../economy/economy.service';
import { NotificationService } from '../notifications/notification.service';
import {
  UNIT_STATS,
  COMBAT_RANDOM_MIN,
  COMBAT_RANDOM_MAX,
  LOOT_PERCENTAGE,
  DEFENDER_LOSS_MAX,
  WALL_DEFENSE_BONUS_PER_LEVEL,
  POST_ATTACK_SHIELD_HOURS,
  SNOWBALL_SCORE_RATIO,
  SNOWBALL_LOOT_PENALTY,
} from '../../constants/game.constants';

export interface BattleReport {
  attackerWins: boolean;
  attackerPower: number;
  defenderPower: number;
  loot: { gold: number; wood: number; stone: number };
  attackerLosses: Record<string, number>;
  defenderLosses: Record<string, number>;
}

@Injectable()
export class CombatService {
  constructor(
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
    @InjectRepository(Unit) private unitRepo: Repository<Unit>,
    @InjectRepository(Building) private buildingRepo: Repository<Building>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private economyService: EconomyService,
    private notifService: NotificationService,
  ) {}

  async attack(attackerKingdomId: string, defenderKingdomId: string): Promise<BattleReport> {
    if (attackerKingdomId === defenderKingdomId) {
      throw new BadRequestException('Cannot attack yourself');
    }

    const [attacker, defender] = await Promise.all([
      this.kingdomRepo.findOne({ where: { id: attackerKingdomId } }),
      this.kingdomRepo.findOne({ where: { id: defenderKingdomId } }),
    ]);

    if (!attacker || !defender) throw new BadRequestException('Kingdom not found');
    if (defender.isShielded) throw new BadRequestException('Defender is shielded');

    await Promise.all([
      this.economyService.tickKingdom(attackerKingdomId),
      this.economyService.tickKingdom(defenderKingdomId),
    ]);

    const [attackerUnits, defenderUnits, defenderBuildings] = await Promise.all([
      this.unitRepo.find({ where: { kingdom: { id: attackerKingdomId } } }),
      this.unitRepo.find({ where: { kingdom: { id: defenderKingdomId } } }),
      this.buildingRepo.find({ where: { kingdom: { id: defenderKingdomId } } }),
    ]);

    const report = this.simulate(attacker, defender, attackerUnits, defenderUnits, defenderBuildings);
    await this.applyBattleResults(attacker, defender, attackerUnits, defenderUnits, report);

    return report;
  }

  async getTargets(myKingdom: Kingdom) {
    const now = new Date();
    // Return kingdoms near our score range, not shielded, not ourselves
    return this.kingdomRepo
      .createQueryBuilder('k')
      .leftJoinAndSelect('k.user', 'u')
      .where('k.id != :id', { id: myKingdom.id })
      .andWhere('(k.shield_until IS NULL OR k.shield_until < :now)', { now })
      .andWhere('k.score BETWEEN :min AND :max', {
        min: Math.max(0, myKingdom.score - 500),
        max: myKingdom.score + 500,
      })
      .orderBy('RANDOM()')
      .limit(20)
      .getMany();
  }

  private simulate(
    attacker: Kingdom,
    defender: Kingdom,
    attackerUnits: Unit[],
    defenderUnits: Unit[],
    defenderBuildings: Building[],
  ): BattleReport {
    const wallLevel = defenderBuildings.find(b => b.type === BuildingType.WALL)?.level ?? 0;
    const wallBonus = wallLevel * WALL_DEFENSE_BONUS_PER_LEVEL;

    let attackPower = attackerUnits.reduce((sum, u) => sum + u.count * UNIT_STATS[u.type].attackPower, 0);
    let defensePower =
      defenderUnits.reduce((sum, u) => sum + u.count * UNIT_STATS[u.type].defensePower, 0) + wallBonus;

    attackPower  *= this.random(COMBAT_RANDOM_MIN, COMBAT_RANDOM_MAX);
    defensePower *= this.random(COMBAT_RANDOM_MIN, COMBAT_RANDOM_MAX);

    const attackerWins = attackPower > defensePower;

    let lootMultiplier = LOOT_PERCENTAGE;
    if (attacker.score > defender.score * SNOWBALL_SCORE_RATIO) {
      lootMultiplier *= 1 - SNOWBALL_LOOT_PENALTY;
    }

    const loot = attackerWins
      ? {
          gold:  Math.floor(defender.gold  * lootMultiplier),
          wood:  Math.floor(defender.wood  * lootMultiplier),
          stone: Math.floor(defender.stone * lootMultiplier),
        }
      : { gold: 0, wood: 0, stone: 0 };

    const ratio = attackerWins
      ? Math.min(0.5, defensePower / attackPower)
      : Math.min(0.7, attackPower / defensePower);

    return {
      attackerWins,
      attackerPower: Math.round(attackPower),
      defenderPower: Math.round(defensePower),
      loot,
      attackerLosses: this.calculateLosses(attackerUnits, ratio * 0.3),
      defenderLosses: this.calculateLosses(
        defenderUnits,
        attackerWins ? Math.min(DEFENDER_LOSS_MAX, ratio) : ratio * 0.1,
      ),
    };
  }

  private calculateLosses(units: Unit[], lossRate: number): Record<string, number> {
    const losses: Record<string, number> = {};
    for (const unit of units) {
      if (unit.count > 0) {
        losses[unit.type] = Math.floor(unit.count * lossRate);
      }
    }
    return losses;
  }

  private async applyBattleResults(
    attacker: Kingdom,
    defender: Kingdom,
    attackerUnits: Unit[],
    defenderUnits: Unit[],
    report: BattleReport,
  ) {
    attacker.gold  = Math.min(attacker.maxGold,  attacker.gold  + report.loot.gold);
    attacker.wood  = Math.min(attacker.maxWood,  attacker.wood  + report.loot.wood);
    attacker.stone = Math.min(attacker.maxStone, attacker.stone + report.loot.stone);

    defender.gold  = Math.max(0, defender.gold  - report.loot.gold);
    defender.wood  = Math.max(0, defender.wood  - report.loot.wood);
    defender.stone = Math.max(0, defender.stone - report.loot.stone);

    if (report.attackerWins) {
      attacker.score += 10 + Math.floor(report.loot.gold / 100);
    }

    defender.shieldUntil = new Date(Date.now() + POST_ATTACK_SHIELD_HOURS * 3_600_000);
    await this.kingdomRepo.save([attacker, defender]);

    // Notify defender
    const defenderUser = await this.userRepo.findOne({ where: { id: (defender as any).userId || '' } });
    const attackerKingdomFull = await this.kingdomRepo.findOne({ where: { id: attacker.id }, relations: ['user'] });
    if (attackerKingdomFull?.user) {
      this.notifService.create(attackerKingdomFull.user.id, 'attacked', {
        attackerName: attacker.name,
        gold: report.loot.gold,
        wood: report.loot.wood,
        won: report.attackerWins,
        telegramId: defenderUser?.telegramId,
      }).catch(() => {});
    }

    for (const unit of attackerUnits) {
      unit.count = Math.max(0, unit.count - (report.attackerLosses[unit.type] ?? 0));
    }
    for (const unit of defenderUnits) {
      unit.count = Math.max(0, unit.count - (report.defenderLosses[unit.type] ?? 0));
    }
    await this.unitRepo.save([...attackerUnits, ...defenderUnits]);
  }

  private random(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
}
