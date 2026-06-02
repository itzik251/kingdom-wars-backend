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
exports.EconomyService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const building_entity_1 = require("../building/building.entity");
const unit_entity_1 = require("../units/unit.entity");
const game_constants_1 = require("../../constants/game.constants");
const PRODUCER_BUILDINGS = {
    [building_entity_1.BuildingType.GOLD_MINE]: 'gold_mine',
    [building_entity_1.BuildingType.LUMBER_MILL]: 'lumber_mill',
    [building_entity_1.BuildingType.STONE_QUARRY]: 'stone_quarry',
    [building_entity_1.BuildingType.FARM]: 'farm',
};
let EconomyService = class EconomyService {
    constructor(kingdomRepo, buildingRepo, unitRepo) {
        this.kingdomRepo = kingdomRepo;
        this.buildingRepo = buildingRepo;
        this.unitRepo = unitRepo;
    }
    async tickAllKingdoms() {
        const kingdoms = await this.kingdomRepo.find();
        await Promise.all(kingdoms.map(k => this.tickKingdom(k.id).catch(() => { })));
    }
    async tickKingdom(kingdomId) {
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        const buildings = await this.buildingRepo.find({ where: { kingdom: { id: kingdomId } } });
        const units = await this.unitRepo.find({ where: { kingdom: { id: kingdomId } } });
        const now = new Date();
        const lastTick = kingdom.lastResourceTick ? new Date(kingdom.lastResourceTick) : now;
        const hoursElapsed = (now.getTime() - lastTick.getTime()) / 3_600_000;
        if (hoursElapsed < 0.016)
            return kingdom;
        const production = this.calculateProduction(buildings, hoursElapsed);
        const upkeep = this.calculateUpkeep(units, hoursElapsed);
        const isWeak = kingdom.score < 1000;
        const bonus = isWeak ? 1 + game_constants_1.WEAK_PLAYER_RESOURCE_BONUS : 1;
        kingdom.gold = Math.min(kingdom.maxGold, Math.floor(kingdom.gold + production.gold * bonus));
        kingdom.wood = Math.min(kingdom.maxWood, Math.floor(kingdom.wood + production.wood * bonus));
        kingdom.stone = Math.min(kingdom.maxStone, Math.floor(kingdom.stone + production.stone * bonus));
        kingdom.food = Math.min(kingdom.maxFood, Math.max(0, Math.floor(kingdom.food + production.food * bonus - upkeep)));
        kingdom.lastResourceTick = now;
        await this.completeBuildingUpgrades(kingdomId, buildings, now);
        await this.completeUnitTraining(kingdomId, units, now);
        return this.kingdomRepo.save(kingdom);
    }
    calculateProduction(buildings, hours) {
        const result = { gold: 0, wood: 0, stone: 0, food: 0 };
        for (const building of buildings) {
            const key = PRODUCER_BUILDINGS[building.type];
            if (!key || building.isUpgrading)
                continue;
            const baseRate = game_constants_1.BASE_PRODUCTION[key];
            const rate = baseRate * Math.pow(game_constants_1.PRODUCTION_MULTIPLIER, building.level - 1);
            const RESOURCE_MAP = {
                gold_mine: 'gold', lumber_mill: 'wood', stone_quarry: 'stone', farm: 'food',
            };
            const resource = RESOURCE_MAP[key];
            if (resource)
                result[resource] += rate * hours;
        }
        return result;
    }
    calculateUpkeep(units, hours) {
        return units.reduce((total, unit) => {
            const stats = game_constants_1.UNIT_STATS[unit.type];
            return total + unit.count * stats.upkeep * hours;
        }, 0);
    }
    async completeBuildingUpgrades(kingdomId, buildings, now) {
        for (const building of buildings) {
            if (building.upgradeEndsAt && now >= building.upgradeEndsAt) {
                building.level += 1;
                building.upgradeEndsAt = null;
                await this.buildingRepo.save(building);
            }
        }
    }
    async completeUnitTraining(kingdomId, units, now) {
        for (const unit of units) {
            if (unit.trainingEndsAt && now >= unit.trainingEndsAt) {
                unit.count += unit.trainingCount;
                unit.trainingCount = 0;
                unit.trainingEndsAt = null;
                await this.unitRepo.save(unit);
            }
        }
    }
    getProductionRates(buildings) {
        return this.calculateProduction(buildings, 1);
    }
};
exports.EconomyService = EconomyService;
__decorate([
    (0, schedule_1.Cron)('*/5 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EconomyService.prototype, "tickAllKingdoms", null);
exports.EconomyService = EconomyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(kingdom_entity_1.Kingdom)),
    __param(1, (0, typeorm_1.InjectRepository)(building_entity_1.Building)),
    __param(2, (0, typeorm_1.InjectRepository)(unit_entity_1.Unit)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], EconomyService);
//# sourceMappingURL=economy.service.js.map