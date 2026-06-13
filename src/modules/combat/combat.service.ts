import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Unit, UnitType, HERO_TYPES } from '../units/unit.entity';
import { Building, BuildingType } from '../building/building.entity';
import { User } from '../user/user.entity';
import { EconomyService } from '../economy/economy.service';
import { NotificationService } from '../notifications/notification.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-log.entity';
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
  loot: { gold: number; wood: number; stone: number; gems?: number; usdt?: number; game?: number };
  attackerLosses: Record<string, number>;   // total losses (dead + wounded)
  defenderLosses: Record<string, number>;
  attackerWounded: Record<string, number>;  // subset of losses that recover in hospital (70%)
  defenderWounded: Record<string, number>;
  winStreak?: number;
  streakBonus?: number;
  buildingDamaged?: { type: string; newLevel: number };
  heroType?: string;
  squadSize?: number;
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
    private auditService: AuditService,
  ) {}

  async attack(
    attackerKingdomId: string,
    defenderKingdomId: string,
    heroType?: string,
    squadInput?: Record<string, number>,
  ): Promise<BattleReport> {
    if (attackerKingdomId === defenderKingdomId) {
      throw new BadRequestException('Cannot attack yourself');
    }

    const [attacker, defender] = await Promise.all([
      this.kingdomRepo.findOne({ where: { id: attackerKingdomId } }),
      this.kingdomRepo.findOne({ where: { id: defenderKingdomId } }),
    ]);

    if (!attacker || !defender) throw new BadRequestException('Kingdom not found');
    if (defender.isShielded) throw new BadRequestException('Defender is shielded');

    // Anti-snowball protection (disabled — to be replaced with better logic)
    const attackerScore = attacker.score || 0;
    const defenderScore = defender.score || 0;

    // Atomic cooldown check — prevents truly parallel requests (race condition)
    const ATTACK_COOLDOWN_MS = 2_000;
    const cooldownCutoff = new Date(Date.now() - ATTACK_COOLDOWN_MS);
    const claimResult = await this.kingdomRepo
      .createQueryBuilder()
      .update()
      .set({ lastAttackAt: new Date() })
      .where('id = :id', { id: attackerKingdomId })
      .andWhere('(last_attack_at IS NULL OR last_attack_at < :cutoff)', { cutoff: cooldownCutoff })
      .execute();
    if (!claimResult.affected || claimResult.affected === 0) {
      throw new BadRequestException('ATTACK_COOLDOWN');
    }

    await Promise.all([
      this.economyService.tickKingdom(attackerKingdomId),
      this.economyService.tickKingdom(defenderKingdomId),
    ]);

    const [allAttackerUnits, defenderUnits, defenderBuildings] = await Promise.all([
      this.unitRepo.find({ where: { kingdom: { id: attackerKingdomId } } }),
      this.unitRepo.find({ where: { kingdom: { id: defenderKingdomId } } }),
      this.buildingRepo.find({ where: { kingdom: { id: defenderKingdomId } } }),
    ]);

    const attackerBuildings = await this.buildingRepo.find({ where: { kingdom: { id: attackerKingdomId } } });

    // Auto-select strongest hero if attacker has one but frontend didn't send heroType
    const HERO_POWER: Record<string, number> = { giant: 300, titan: 150, dragon_rider: 100, ragnar: 90, paladin: 80, knight: 40 };
    const heroUnits = allAttackerUnits.filter(u => HERO_TYPES.has(u.type as any) && u.count > 0);
    if (heroUnits.length > 0 && !heroType) {
      heroType = heroUnits.reduce((best, u) => (HERO_POWER[u.type] ?? 0) > (HERO_POWER[best.type] ?? 0) ? u : best).type;
    }
    if (heroType) {
      const heroUnit = allAttackerUnits.find(u => u.type === heroType);
      if (!heroUnit || heroUnit.count < 1) throw new BadRequestException(`Hero ${heroType} not available`);
    }

    // Build the attacking squad — temporarily cap unit counts to what was deployed
    const originalCounts = new Map(allAttackerUnits.map(u => [u.type, u.count]));
    if (squadInput && Object.keys(squadInput).length > 0) {
      for (const unit of allAttackerUnits) {
        const requested = squadInput[unit.type] ?? 0;
        if (requested > unit.count) throw new BadRequestException(`Not enough ${unit.type}`);
        unit.count = requested;
      }

      // Minimum squad size: 10 non-hero soldiers, UNLESS Titan is the sole hero
      const soldierCount = allAttackerUnits
        .filter(u => !HERO_TYPES.has(u.type))
        .reduce((s, u) => s + u.count, 0);
      const heroCanSoloAttack = heroType === UnitType.TITAN || heroType === UnitType.GIANT;
      const isSoloHero = heroCanSoloAttack && soldierCount === 0;
      if (!isSoloHero && soldierCount < 10) {
        // Restore counts before throwing
        for (const unit of allAttackerUnits) unit.count = originalCounts.get(unit.type) ?? unit.count;
        throw new BadRequestException('Minimum 10 soldiers required per squad');
      }
    }

    const attackerUnits = allAttackerUnits;
    const report = this.simulate(attacker, defender, attackerUnits, defenderUnits, defenderBuildings, attackerBuildings);
    if (heroType) report.heroType = heroType;
    if (squadInput) report.squadSize = Object.values(squadInput).reduce((s, v) => s + v, 0);
    await this.applyBattleResults(attacker, defender, attackerUnits, defenderUnits, report, originalCounts);

    return report;
  }

  async getTargets(myKingdom: Kingdom) {
    const now = new Date();
    // Show all non-shielded kingdoms — anti-snowball (10x) enforced at attack() time
    return this.kingdomRepo
      .createQueryBuilder('k')
      .leftJoinAndSelect('k.user', 'u')
      .where('k.id != :id', { id: myKingdom.id })
      .andWhere('(k.shield_until IS NULL OR k.shield_until < :now)', { now })
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
      gems:  Math.floor((target.gems  ?? 0) * LOOT_PERCENTAGE),
    };

    // Simulated march time: 30 seconds base + score difference factor
    const scoreDiff = Math.abs((myKingdom?.score ?? 0) - target.score);
    const baseMarch = 30 + Math.floor(scoreDiff / 20);
    const attackBoostActive = myKingdom?.attackSpeedBoostUntil &&
      new Date() < new Date(myKingdom.attackSpeedBoostUntil);
    const marchSeconds = attackBoostActive ? Math.ceil(baseMarch * 0.5) : baseMarch;

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

    let attackPower = attackerUnits.reduce((sum, u) => sum + u.count * (UNIT_STATS[u.type]?.attackPower ?? 0), 0) * arcaneMult;
    let defensePower =
      defenderUnits.reduce((sum, u) => sum + u.count * (UNIT_STATS[u.type]?.defensePower ?? 0), 0) + wallBonus;

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
          gems:  Math.floor((defender.gems  ?? 0) * lootMultiplier),
        }
      : { gold: 0, wood: 0, stone: 0, gems: 0 };

    // Power-ratio-based losses
    // closeness = 1 when perfectly even, approaches 0 when one-sided
    const winPow = attackerWins ? attackPower : defensePower;
    const losPow = attackerWins ? defensePower : attackPower;
    const closeness = losPow / Math.max(winPow, 1); // 0..1

    // Winner: 8% (dominant) → 20% (close fight)
    const winnerLossRate = Math.min(0.20, Math.max(0.08, 0.08 + closeness * 0.12 + this.random(-0.02, 0.02)));
    // Loser: 25% (close fight) → 45% (dominant victory)
    const loserLossRate  = Math.min(0.45, Math.max(0.25, 0.25 + (1 - closeness) * 0.20 + this.random(-0.02, 0.02)));

    return {
      attackerWins,
      attackerPower: Math.round(attackPower),
      defenderPower: Math.round(defensePower),
      loot,
      attackerLosses: this.calculateLosses(attackerUnits, attackerWins ? winnerLossRate : loserLossRate),
      defenderLosses: this.calculateLosses(defenderUnits, attackerWins ? loserLossRate : winnerLossRate),
      attackerWounded: {},
      defenderWounded: {},
    };
  }

  private calculateLosses(units: Unit[], lossRate: number): Record<string, number> {
    const losses: Record<string, number> = {};
    for (const unit of units) {
      if (unit.count > 0) {
        const raw = unit.count * lossRate;
        // For single units (heroes), use round so a 25%+ loss rate shows at least 1 loss
        losses[unit.type] = unit.count === 1 ? Math.round(raw) : Math.floor(raw);
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
    originalCounts?: Map<string, number>,
  ) {
    const goldReceived  = Math.min(attacker.maxGold,  attacker.gold  + report.loot.gold)  - attacker.gold;
    const woodReceived  = Math.min(attacker.maxWood,  attacker.wood  + report.loot.wood)  - attacker.wood;
    const stoneReceived = Math.min(attacker.maxStone, attacker.stone + report.loot.stone) - attacker.stone;
    attacker.gold  += goldReceived;
    attacker.wood  += woodReceived;
    attacker.stone += stoneReceived;
    attacker.gems   = (attacker.gems ?? 0) + (report.loot.gems ?? 0);
    report.loot.gold  = goldReceived;
    report.loot.wood  = woodReceived;
    report.loot.stone = stoneReceived;

    defender.gold  = Math.max(0, defender.gold  - report.loot.gold);
    defender.wood  = Math.max(0, defender.wood  - report.loot.wood);
    defender.stone = Math.max(0, defender.stone - report.loot.stone);
    defender.gems  = Math.max(0, (defender.gems ?? 0) - (report.loot.gems ?? 0));

    // VIP players also loot 2% of defender's USDT — always set field so frontend shows it
    if (report.attackerWins && attacker.isVip) {
      const usdtLoot = parseFloat(((defender.usdtBalance ?? 0) * 0.02).toFixed(6));
      report.loot.usdt = usdtLoot;
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

    this.auditService.log(AuditAction.COMBAT, attacker.id, {
      defenderKingdomId: defender.id,
      defenderName: defender.name,
      won: report.attackerWins,
      loot: report.loot,
      usdtLooted: report.loot?.usdt ?? 0,
      attackerLosses: report.attackerLosses,
      defenderLosses: report.defenderLosses,
    });

    // Notify the DEFENDER's user that they were attacked
    const defenderKingdomFull = await this.kingdomRepo.findOne({ where: { id: defender.id }, relations: ['user'] });
    if (defenderKingdomFull?.user) {
      this.notifService.create(defenderKingdomFull.user.id, 'attacked', {
        attackerName: attacker.name,
        gold: report.loot.gold,
        wood: report.loot.wood,
        won: report.attackerWins,
        telegramId: defenderKingdomFull.user.telegramId,
        language: defenderKingdomFull.user.language,
      }).catch(() => {});
    }

    // 70% of losses go to hospital (wounded), 30% die permanently
    report.attackerWounded = {};
    report.defenderWounded = {};
    for (const unit of attackerUnits) {
      const losses = report.attackerLosses[unit.type] ?? 0;
      const wounded = Math.floor(losses * 0.70);
      const dead = losses - wounded;
      report.attackerWounded[unit.type] = wounded;
      const deployedCount = unit.count;
      const nonDeployed = originalCounts ? (originalCounts.get(unit.type) ?? deployedCount) - deployedCount : 0;
      unit.count = Math.max(0, deployedCount - dead) + nonDeployed;
      unit.woundedCount = (unit.woundedCount || 0) + wounded;
    }
    for (const unit of defenderUnits) {
      const losses = report.defenderLosses[unit.type] ?? 0;
      const wounded = Math.floor(losses * 0.70);
      const dead = losses - wounded;
      report.defenderWounded[unit.type] = wounded;
      unit.count = Math.max(0, unit.count - dead);
      unit.woundedCount = (unit.woundedCount || 0) + wounded;
    }
    await this.unitRepo.save([...attackerUnits, ...defenderUnits]);

    // Building damage — only the loser's buildings get damaged
    const loserKingdomId = report.attackerWins ? defender.id : attacker.id;
    const loserBuildings = await this.buildingRepo.find({ where: { kingdom: { id: loserKingdomId } } });
    const candidates = loserBuildings.filter(b => b.type !== BuildingType.TOWN_HALL && b.level > 1);
    if (candidates.length > 0) {
      const dmgCount = report.attackerWins && report.attackerPower > report.defenderPower * 1.5 ? 2 : 1;
      const shuffled = [...candidates].sort(() => Math.random() - 0.5).slice(0, dmgCount);
      for (const bld of shuffled) {
        bld.level = Math.max(1, bld.level - 1);
        bld.needsRepair = true;
        await this.buildingRepo.save(bld);
        report.buildingDamaged = { type: bld.type, newLevel: bld.level };
      }
    }
  }

  private random(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
}
