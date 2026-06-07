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
  loot: { gold: number; wood: number; stone: number; usdt?: number; game?: number };
  attackerLosses: Record<string, number>;
  defenderLosses: Record<string, number>;
  winStreak?: number;
  streakBonus?: number;
  buildingDamaged?: { type: string; newLevel: number };
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

    // Score-based protection — prevent bullying low-score players
    const attackerScore = attacker.score || 0;
    const defenderScore = defender.score || 0;
    if (attackerScore > 0 && defenderScore > 0 && attackerScore > defenderScore * 10) {
      throw new BadRequestException('לא ניתן לתקוף ממלכה חלשה פי 10 ממך — בחר יריב הוגן');
    }

    // Server-side attack cooldown — prevents API bypass of march time
    const ATTACK_COOLDOWN_MS = 10_000; // 10 seconds minimum between attacks
    if (attacker.lastAttackAt) {
      const msSinceLast = Date.now() - new Date(attacker.lastAttackAt).getTime();
      if (msSinceLast < ATTACK_COOLDOWN_MS) {
        throw new BadRequestException('ATTACK_COOLDOWN');
      }
    }

    await Promise.all([
      this.economyService.tickKingdom(attackerKingdomId),
      this.economyService.tickKingdom(defenderKingdomId),
    ]);

    const [attackerUnits, defenderUnits, defenderBuildings] = await Promise.all([
      this.unitRepo.find({ where: { kingdom: { id: attackerKingdomId } } }),
      this.unitRepo.find({ where: { kingdom: { id: defenderKingdomId } } }),
      this.buildingRepo.find({ where: { kingdom: { id: defenderKingdomId } } }),
    ]);

    const attackerBuildings = await this.buildingRepo.find({ where: { kingdom: { id: attackerKingdomId } } });
    const report = this.simulate(attacker, defender, attackerUnits, defenderUnits, defenderBuildings, attackerBuildings);
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

  async getKingdomProfile(myKingdomId: string, targetKingdomId: string) {
    const [myKingdom, target, targetUnits, targetBuildings] = await Promise.all([
      this.kingdomRepo.findOne({ where: { id: myKingdomId } }),
      this.kingdomRepo.findOne({ where: { id: targetKingdomId }, relations: ['user'] }),
      this.unitRepo.find({ where: { kingdom: { id: targetKingdomId } } }),
      this.buildingRepo.find({ where: { kingdom: { id: targetKingdomId } } }),
    ]);
    if (!target) throw new BadRequestException('Kingdom not found');

    const myUnits = await this.unitRepo.find({ where: { kingdom: { id: myKingdomId } } });

    const wallLevel = targetBuildings.find(b => b.type === BuildingType.WALL)?.level ?? 0;
    const myAttackPower = myUnits.reduce((s, u) => s + u.count * (UNIT_STATS[u.type]?.attackPower ?? 0), 0);
    const defPower =
      targetUnits.reduce((s, u) => s + u.count * (UNIT_STATS[u.type]?.defensePower ?? 0), 0) +
      wallLevel * WALL_DEFENSE_BONUS_PER_LEVEL;

    const lootable = {
      gold:  Math.floor(target.gold  * LOOT_PERCENTAGE),
      wood:  Math.floor(target.wood  * LOOT_PERCENTAGE),
      stone: Math.floor(target.stone * LOOT_PERCENTAGE),
    };

    // Simulated march time: 30 seconds base + score difference factor
    const scoreDiff = Math.abs((myKingdom?.score ?? 0) - target.score);
    const marchSeconds = 30 + Math.floor(scoreDiff / 20);

    const winChance = myAttackPower > 0 && defPower > 0
      ? Math.round(Math.min(95, Math.max(5, (myAttackPower / (myAttackPower + defPower)) * 100)))
      : myAttackPower > 0 ? 90 : 10;

    return {
      id: target.id,
      name: target.name,
      username: target.user?.username || target.user?.firstName,
      score: target.score,
      isShielded: target.isShielded,
      shieldUntil: target.shieldUntil,
      usdtBalance: target.usdtBalance ?? 0,
      resources: { gold: target.gold, wood: target.wood, stone: target.stone },
      lootable,
      defPower,
      myAttackPower,
      winChance,
      marchSeconds,
      wallLevel,
      armySize: targetUnits.reduce((s, u) => s + u.count, 0),
      buildings: targetBuildings.map(b => ({ type: b.type, level: b.level })),
    };
  }

  private simulate(
    attacker: Kingdom,
    defender: Kingdom,
    attackerUnits: Unit[],
    defenderUnits: Unit[],
    defenderBuildings: Building[],
    attackerBuildings: Building[] = [],
  ): BattleReport {
    const wallLevel = defenderBuildings.find(b => b.type === BuildingType.WALL)?.level ?? 0;
    const wallBonus = wallLevel * WALL_DEFENSE_BONUS_PER_LEVEL;

    // Arcane Tower (VIP): +10% attack power per level for all attacker units
    const arcaneLevel = attackerBuildings.find(b => b.type === BuildingType.ARCANE_TOWER)?.level ?? 0;
    const arcaneMult = 1 + arcaneLevel * 0.1;

    let attackPower = attackerUnits.reduce((sum, u) => sum + u.count * UNIT_STATS[u.type].attackPower, 0) * arcaneMult;
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

    // VIP players also loot 20% of defender's USDT
    if (report.attackerWins && attacker.isVip) {
      const usdtLoot = parseFloat(((defender.usdtBalance ?? 0) * 0.20).toFixed(6));
      report.loot.usdt = usdtLoot; // always set (even 0) so frontend can display
      if (usdtLoot > 0) {
        attacker.usdtBalance = parseFloat(((attacker.usdtBalance ?? 0) + usdtLoot).toFixed(6));
        defender.usdtBalance = parseFloat(Math.max(0, (defender.usdtBalance ?? 0) - usdtLoot).toFixed(6));
      }
    }

    if (report.attackerWins) {
      attacker.score += 10 + Math.floor(report.loot.gold / 100);

      // Victory streak — up to 50% bonus loot
      attacker.winStreak = (attacker.winStreak || 0) + 1;
      const streakBonus = Math.min(attacker.winStreak * 0.05, 0.5);
      const bonusGold = Math.floor(report.loot.gold * streakBonus);
      attacker.gold = Math.min(attacker.maxGold, attacker.gold + bonusGold);
      report.winStreak = attacker.winStreak;
      report.streakBonus = bonusGold;
    } else {
      attacker.winStreak = 0;
      report.winStreak = 0;
      report.streakBonus = 0;
    }

    defender.shieldUntil = new Date(Date.now() + POST_ATTACK_SHIELD_HOURS * 3_600_000);
    attacker.lastAttackAt = new Date();
    await this.kingdomRepo.save([attacker, defender]);

    // Notify the DEFENDER's user that they were attacked
    const defenderKingdomFull = await this.kingdomRepo.findOne({ where: { id: defender.id }, relations: ['user'] });
    if (defenderKingdomFull?.user) {
      this.notifService.create(defenderKingdomFull.user.id, 'attacked', {
        attackerName: attacker.name,
        gold: report.loot.gold,
        wood: report.loot.wood,
        won: report.attackerWins,
        telegramId: defenderKingdomFull.user.telegramId,
      }).catch(() => {});
    }

    // Wounded soldiers: a portion of losses become wounded (recover later) instead of dead.
    for (const unit of attackerUnits) {
      const losses = report.attackerLosses[unit.type] ?? 0;
      const actualDead = Math.floor(losses * 0.8); // attacker: 20% wounded
      const wounded = losses - actualDead;
      unit.count = Math.max(0, unit.count - actualDead);
      unit.woundedCount = (unit.woundedCount || 0) + wounded;
    }
    for (const unit of defenderUnits) {
      const losses = report.defenderLosses[unit.type] ?? 0;
      const actualDead = Math.floor(losses * 0.7); // defender: 30% wounded
      const wounded = losses - actualDead;
      unit.count = Math.max(0, unit.count - actualDead);
      unit.woundedCount = (unit.woundedCount || 0) + wounded;
    }
    await this.unitRepo.save([...attackerUnits, ...defenderUnits]);

    // Building damage on decisive wins (attack power more than double defense)
    if (report.attackerWins && report.attackerPower > report.defenderPower * 2) {
      const defenderBuildings = await this.buildingRepo.find({ where: { kingdom: { id: defender.id } } });
      const candidates = defenderBuildings.filter(
        b => b.type !== BuildingType.TOWN_HALL && b.level > 1,
      );
      if (candidates.length > 0) {
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        target.level = Math.max(1, target.level - 1);
        target.needsRepair = true;
        await this.buildingRepo.save(target);
        report.buildingDamaged = { type: target.type, newLevel: target.level };
      }
    }
  }

  private random(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
}
