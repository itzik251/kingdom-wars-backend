"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombatService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const unit_entity_1 = require("../units/unit.entity");
const building_entity_1 = require("../building/building.entity");
const user_entity_1 = require("../user/user.entity");
const economy_service_1 = require("../economy/economy.service");
const notification_service_1 = require("../notifications/notification.service");
const game_constants_1 = require("../../constants/game.constants");
let CombatService = class CombatService {
    constructor(kingdomRepo, unitRepo, buildingRepo, userRepo, economyService, notifService) {
        this.kingdomRepo = kingdomRepo;
        this.unitRepo = unitRepo;
        this.buildingRepo = buildingRepo;
        this.userRepo = userRepo;
        this.economyService = economyService;
        this.notifService = notifService;
    }
    async attack(attackerKingdomId, defenderKingdomId) {
        if (attackerKingdomId === defenderKingdomId) {
            throw new common_1.BadRequestException('Cannot attack yourself');
        }
        const [attacker, defender] = await Promise.all([
            this.kingdomRepo.findOne({ where: { id: attackerKingdomId } }),
            this.kingdomRepo.findOne({ where: { id: defenderKingdomId } }),
        ]);
        if (!attacker || !defender)
            throw new common_1.BadRequestException('Kingdom not found');
        if (defender.isShielded)
            throw new common_1.BadRequestException('Defender is shielded');
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
    async getTargets(myKingdom) {
        const now = new Date();
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
    async getKingdomProfile(myKingdomId, targetKingdomId) {
        const [myKingdom, target, targetUnits, targetBuildings] = await Promise.all([
            this.kingdomRepo.findOne({ where: { id: myKingdomId } }),
            this.kingdomRepo.findOne({ where: { id: targetKingdomId }, relations: ['user'] }),
            this.unitRepo.find({ where: { kingdom: { id: targetKingdomId } } }),
            this.buildingRepo.find({ where: { kingdom: { id: targetKingdomId } } }),
        ]);
        if (!target)
            throw new common_1.BadRequestException('Kingdom not found');
        const myUnits = await this.unitRepo.find({ where: { kingdom: { id: myKingdomId } } });
        const wallLevel = targetBuildings.find(b => b.type === building_entity_1.BuildingType.WALL)?.level ?? 0;
        const myAttackPower = myUnits.reduce((s, u) => s + u.count * (game_constants_1.UNIT_STATS[u.type]?.attackPower ?? 0), 0);
        const defPower = targetUnits.reduce((s, u) => s + u.count * (game_constants_1.UNIT_STATS[u.type]?.defensePower ?? 0), 0) +
            wallLevel * game_constants_1.WALL_DEFENSE_BONUS_PER_LEVEL;
        const lootable = {
            gold: Math.floor(target.gold * game_constants_1.LOOT_PERCENTAGE),
            wood: Math.floor(target.wood * game_constants_1.LOOT_PERCENTAGE),
            stone: Math.floor(target.stone * game_constants_1.LOOT_PERCENTAGE),
        };
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
    simulate(attacker, defender, attackerUnits, defenderUnits, defenderBuildings, attackerBuildings = []) {
        const wallLevel = defenderBuildings.find(b => b.type === building_entity_1.BuildingType.WALL)?.level ?? 0;
        const wallBonus = wallLevel * game_constants_1.WALL_DEFENSE_BONUS_PER_LEVEL;
        const arcaneLevel = attackerBuildings.find(b => b.type === building_entity_1.BuildingType.ARCANE_TOWER)?.level ?? 0;
        const arcaneMult = 1 + arcaneLevel * 0.1;
        let attackPower = attackerUnits.reduce((sum, u) => sum + u.count * game_constants_1.UNIT_STATS[u.type].attackPower, 0) * arcaneMult;
        let defensePower = defenderUnits.reduce((sum, u) => sum + u.count * game_constants_1.UNIT_STATS[u.type].defensePower, 0) + wallBonus;
        attackPower *= this.random(game_constants_1.COMBAT_RANDOM_MIN, game_constants_1.COMBAT_RANDOM_MAX);
        defensePower *= this.random(game_constants_1.COMBAT_RANDOM_MIN, game_constants_1.COMBAT_RANDOM_MAX);
        const attackerWins = attackPower > defensePower;
        let lootMultiplier = game_constants_1.LOOT_PERCENTAGE;
        if (attacker.score > defender.score * game_constants_1.SNOWBALL_SCORE_RATIO) {
            lootMultiplier *= 1 - game_constants_1.SNOWBALL_LOOT_PENALTY;
        }
        const loot = attackerWins
            ? {
                gold: Math.floor(defender.gold * lootMultiplier),
                wood: Math.floor(defender.wood * lootMultiplier),
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
            defenderLosses: this.calculateLosses(defenderUnits, attackerWins ? Math.min(game_constants_1.DEFENDER_LOSS_MAX, ratio) : ratio * 0.1),
        };
    }
    calculateLosses(units, lossRate) {
        const losses = {};
        for (const unit of units) {
            if (unit.count > 0) {
                losses[unit.type] = Math.floor(unit.count * lossRate);
            }
        }
        return losses;
    }
    async applyBattleResults(attacker, defender, attackerUnits, defenderUnits, report) {
        attacker.gold = Math.min(attacker.maxGold, attacker.gold + report.loot.gold);
        attacker.wood = Math.min(attacker.maxWood, attacker.wood + report.loot.wood);
        attacker.stone = Math.min(attacker.maxStone, attacker.stone + report.loot.stone);
        defender.gold = Math.max(0, defender.gold - report.loot.gold);
        defender.wood = Math.max(0, defender.wood - report.loot.wood);
        defender.stone = Math.max(0, defender.stone - report.loot.stone);
        if (report.attackerWins) {
            attacker.score += 10 + Math.floor(report.loot.gold / 100);
            attacker.winStreak = (attacker.winStreak || 0) + 1;
            const streakBonus = Math.min(attacker.winStreak * 0.05, 0.5);
            const bonusGold = Math.floor(report.loot.gold * streakBonus);
            attacker.gold = Math.min(attacker.maxGold, attacker.gold + bonusGold);
            report.winStreak = attacker.winStreak;
            report.streakBonus = bonusGold;
        }
        else {
            attacker.winStreak = 0;
            report.winStreak = 0;
            report.streakBonus = 0;
        }
        defender.shieldUntil = new Date(Date.now() + game_constants_1.POST_ATTACK_SHIELD_HOURS * 3_600_000);
        await this.kingdomRepo.save([attacker, defender]);
        const defenderKingdomFull = await this.kingdomRepo.findOne({ where: { id: defender.id }, relations: ['user'] });
        if (defenderKingdomFull?.user) {
            this.notifService.create(defenderKingdomFull.user.id, 'attacked', {
                attackerName: attacker.name,
                gold: report.loot.gold,
                wood: report.loot.wood,
                won: report.attackerWins,
                telegramId: defenderKingdomFull.user.telegramId,
            }).catch(() => { });
        }
        for (const unit of attackerUnits) {
            const losses = report.attackerLosses[unit.type] ?? 0;
            const actualDead = Math.floor(losses * 0.8);
            const wounded = losses - actualDead;
            unit.count = Math.max(0, unit.count - actualDead);
            unit.woundedCount = (unit.woundedCount || 0) + wounded;
        }
        for (const unit of defenderUnits) {
            const losses = report.defenderLosses[unit.type] ?? 0;
            const actualDead = Math.floor(losses * 0.7);
            const wounded = losses - actualDead;
            unit.count = Math.max(0, unit.count - actualDead);
            unit.woundedCount = (unit.woundedCount || 0) + wounded;
        }
        await this.unitRepo.save([...attackerUnits, ...defenderUnits]);
        if (report.attackerWins && report.attackerPower > report.defenderPower * 2) {
            const defenderBuildings = await this.buildingRepo.find({ where: { kingdom: { id: defender.id } } });
            const candidates = defenderBuildings.filter(b => b.type !== building_entity_1.BuildingType.TOWN_HALL && b.level > 1);
            if (candidates.length > 0) {
                const target = candidates[Math.floor(Math.random() * candidates.length)];
                target.level = Math.max(1, target.level - 1);
                target.needsRepair = true;
                await this.buildingRepo.save(target);
                report.buildingDamaged = { type: target.type, newLevel: target.level };
            }
        }
    }
    random(min, max) {
        return min + Math.random() * (max - min);
    }
};
exports.CombatService = CombatService;
exports.CombatService = CombatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(kingdom_entity_1.Kingdom)),
    __param(1, (0, typeorm_1.InjectRepository)(unit_entity_1.Unit)),
    __param(2, (0, typeorm_1.InjectRepository)(building_entity_1.Building)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        economy_service_1.EconomyService,
        notification_service_1.NotificationService])
], CombatService);
//# sourceMappingURL=combat.service.js.map