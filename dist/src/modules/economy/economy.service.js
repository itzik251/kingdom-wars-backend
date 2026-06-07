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
const notification_service_1 = require("../notifications/notification.service");
const game_constants_1 = require("../../constants/game.constants");
const PRODUCER_BUILDINGS = {
    [building_entity_1.BuildingType.GOLD_MINE]: 'gold_mine',
    [building_entity_1.BuildingType.LUMBER_MILL]: 'lumber_mill',
    [building_entity_1.BuildingType.STONE_QUARRY]: 'stone_quarry',
    [building_entity_1.BuildingType.FARM]: 'farm',
};
let EconomyService = class EconomyService {
    constructor(kingdomRepo, buildingRepo, unitRepo, notifService) {
        this.kingdomRepo = kingdomRepo;
        this.buildingRepo = buildingRepo;
        this.unitRepo = unitRepo;
        this.notifService = notifService;
    }
    async tickAllKingdoms() {
        const kingdoms = await this.kingdomRepo.find({ relations: ['user'] });
        await Promise.all(kingdoms.map(k => this.tickKingdom(k.id, k.user?.id).catch(() => { })));
    }
    async tickKingdom(kingdomId, userId) {
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        const buildings = await this.buildingRepo.find({ where: { kingdom: { id: kingdomId } } });
        const units = await this.unitRepo.find({ where: { kingdom: { id: kingdomId } } });
        const now = new Date();
        if (!kingdom.lastResourceTick) {
            kingdom.lastResourceTick = now;
            await this.kingdomRepo.save(kingdom);
            return kingdom;
        }
        const lastTick = new Date(kingdom.lastResourceTick);
        const hoursElapsed = (now.getTime() - lastTick.getTime()) / 3_600_000;
        if (hoursElapsed < 0.016)
            return kingdom;
        const production = this.calculateProduction(buildings, hoursElapsed);
        const upkeep = this.calculateUpkeep(units, hoursElapsed);
        const isWeak = kingdom.score < 1000;
        const weakBonus = isWeak ? game_constants_1.WEAK_PLAYER_RESOURCE_BONUS : 0;
        const boostActive = kingdom.productionBoostUntil && now < new Date(kingdom.productionBoostUntil);
        const boostBonus = boostActive ? 1 : 0;
        const vipBonus = kingdom.isVip ? 0.5 : 0;
        const workerCount = kingdom.workers || 0;
        const workerProductionBonus = 1 + workerCount * 0.04;
        const bonus = (1 + weakBonus + boostBonus + vipBonus) * workerProductionBonus;
        const workerSalary = workerCount * 5 * hoursElapsed;
        const newFood = kingdom.food + production.food * bonus - upkeep;
        const foodShortfall = Math.max(0, -newFood);
        kingdom.gold = Math.min(kingdom.maxGold, Math.max(0, Math.floor(kingdom.gold + production.gold * bonus - workerSalary)));
        kingdom.wood = Math.min(kingdom.maxWood, Math.floor(kingdom.wood + production.wood * bonus));
        kingdom.stone = Math.min(kingdom.maxStone, Math.floor(kingdom.stone + production.stone * bonus));
        kingdom.food = Math.min(kingdom.maxFood, Math.max(0, Math.floor(newFood)));
        kingdom.lastResourceTick = now;
        if (foodShortfall > 0) {
            const desertionRate = Math.min(0.05, foodShortfall * 0.005);
            let desertionChanged = false;
            for (const unit of units) {
                if (unit.count > 0) {
                    const lost = Math.max(1, Math.floor(unit.count * desertionRate));
                    unit.count = Math.max(0, unit.count - lost);
                    desertionChanged = true;
                }
            }
            if (desertionChanged) {
                await this.unitRepo.save(units.filter(u => u.count >= 0));
            }
        }
        const hospital = buildings.find(b => b.type === building_entity_1.BuildingType.HOSPITAL);
        const healRate = 5 + (hospital ? hospital.level * 10 : 0);
        let woundedChanged = false;
        for (const unit of units) {
            if ((unit.woundedCount || 0) > 0) {
                const healed = Math.min(unit.woundedCount, Math.floor(healRate * hoursElapsed));
                if (healed > 0) {
                    unit.woundedCount -= healed;
                    unit.count += healed;
                    woundedChanged = true;
                }
            }
        }
        if (woundedChanged) {
            await this.unitRepo.save(units.filter(u => u.woundedCount >= 0));
        }
        const completedBuildings = await this.completeBuildingUpgrades(kingdomId, buildings, now);
        const completedUnits = await this.completeUnitTraining(kingdomId, units, now);
        const saved = await this.kingdomRepo.save(kingdom);
        const resolvedUserId = userId ?? (await this.kingdomRepo.findOne({ where: { id: kingdomId }, relations: ['user'] }))?.user?.id;
        if (resolvedUserId) {
            if (completedBuildings.length > 0) {
                const grouped = new Map();
                for (const b of completedBuildings) {
                    const existing = grouped.get(b.type);
                    if (existing)
                        existing.count++;
                    else
                        grouped.set(b.type, { count: 1, level: b.level });
                }
                for (const [type, { count, level }] of grouped) {
                    this.notifService.create(resolvedUserId, 'build_done', { building: type, level, count }).catch(() => { });
                }
            }
            if (completedUnits.length > 0) {
                const grouped = new Map();
                for (const u of completedUnits)
                    grouped.set(u.type, (grouped.get(u.type) ?? 0) + u.count);
                for (const [type, count] of grouped) {
                    this.notifService.create(resolvedUserId, 'training_done', { unit: type, count }).catch(() => { });
                }
            }
        }
        saved.__completedBuildings = completedBuildings;
        saved.__completedUnits = completedUnits;
        return saved;
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
        const completed = [];
        for (const building of buildings) {
            if (building.upgradeEndsAt && now >= new Date(building.upgradeEndsAt)) {
                building.level += 1;
                building.upgradeEndsAt = null;
                await this.buildingRepo.save(building);
                completed.push({ type: building.type, level: building.level });
                if (building.type === building_entity_1.BuildingType.TOWN_HALL) {
                    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
                    if (kingdom) {
                        const mult = 1 + (building.level - 1) * 0.3;
                        kingdom.maxGold = Math.floor(5000 * mult);
                        kingdom.maxWood = Math.floor(4000 * mult);
                        kingdom.maxStone = Math.floor(3000 * mult);
                        kingdom.maxFood = Math.floor(2000 * mult);
                        await this.kingdomRepo.save(kingdom);
                    }
                }
            }
        }
        return completed;
    }
    async completeUnitTraining(kingdomId, units, now) {
        const completed = [];
        for (const unit of units) {
            if (unit.trainingEndsAt && now >= new Date(unit.trainingEndsAt) && unit.trainingCount > 0) {
                completed.push({ type: unit.type, count: unit.trainingCount });
                unit.count += unit.trainingCount;
                unit.trainingCount = 0;
                unit.trainingEndsAt = null;
                await this.unitRepo.save(unit);
            }
        }
        return completed;
    }
    getProductionRates(buildings, kingdom) {
        const rates = this.calculateProduction(buildings, 1);
        const now = new Date();
        const isWeak = kingdom ? kingdom.score < 1000 : false;
        const boostActive = !!(kingdom?.productionBoostUntil && now < new Date(kingdom.productionBoostUntil));
        const weakBonus = isWeak ? game_constants_1.WEAK_PLAYER_RESOURCE_BONUS : 0;
        const boostBonus = boostActive ? 1 : 0;
        const workerCount = kingdom?.workers || 0;
        const workerProductionBonus = 1 + workerCount * 0.04;
        const bonus = (1 + weakBonus + boostBonus) * workerProductionBonus;
        const workerSalary = workerCount * 5;
        return {
            gold: Math.floor(rates.gold * bonus - workerSalary),
            wood: Math.floor(rates.wood * bonus),
            stone: Math.floor(rates.stone * bonus),
            food: Math.floor(rates.food * bonus),
        };
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
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => notification_service_1.NotificationService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notification_service_1.NotificationService])
], EconomyService);
//# sourceMappingURL=economy.service.js.map