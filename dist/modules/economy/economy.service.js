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
const user_entity_1 = require("../user/user.entity");
const notification_service_1 = require("../notifications/notification.service");
const notification_entity_1 = require("../notifications/notification.entity");
const game_constants_1 = require("../../constants/game.constants");
const unit_entity_2 = require("../units/unit.entity");
const NOTIF_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const PRODUCER_BUILDINGS = {
    [building_entity_1.BuildingType.GOLD_MINE]: 'gold_mine',
    [building_entity_1.BuildingType.LUMBER_MILL]: 'lumber_mill',
    [building_entity_1.BuildingType.STONE_QUARRY]: 'stone_quarry',
    [building_entity_1.BuildingType.FARM]: 'farm',
};
let EconomyService = class EconomyService {
    constructor(kingdomRepo, buildingRepo, unitRepo, userRepo, notifRepo, notifService) {
        this.kingdomRepo = kingdomRepo;
        this.buildingRepo = buildingRepo;
        this.unitRepo = unitRepo;
        this.userRepo = userRepo;
        this.notifRepo = notifRepo;
        this.notifService = notifService;
    }
    async tickAllKingdoms() {
        const kingdoms = await this.kingdomRepo.find({ relations: ['user'] });
        for (const k of kingdoms) {
            await this.tickKingdom(k.id, k.user?.id, k.user).catch(() => { });
        }
    }
    async tickKingdom(kingdomId, userId, userObj) {
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
        const academy = buildings.find(b => b.type === building_entity_1.BuildingType.ACADEMY && !b.needsRepair);
        const academyBonus = academy ? academy.level * 0.02 : 0;
        const bonus = (1 + weakBonus + boostBonus + vipBonus + academyBonus) * workerProductionBonus;
        const workerSalary = workerCount * 5 * hoursElapsed;
        const explorerCount = kingdom.explorerCount ?? 0;
        const explorerGoldSalary = explorerCount * 10 * hoursElapsed;
        const explorerFoodSalary = explorerCount * 3 * hoursElapsed;
        const HERO_SALARY_INTERVAL_HOURS = 1;
        const heroSalaryTicks = Math.floor(hoursElapsed / HERO_SALARY_INTERVAL_HOURS);
        if (heroSalaryTicks > 0) {
            let gemsNeeded = 0;
            for (const unit of units) {
                if (unit_entity_2.HERO_TYPES.has(unit.type) && unit.count > 0) {
                    gemsNeeded += (unit_entity_2.HERO_SALARY_GEMS[unit.type] ?? 0) * heroSalaryTicks;
                }
            }
            if (gemsNeeded > 0) {
                kingdom.gems = Math.max(0, (kingdom.gems || 0) - gemsNeeded);
            }
        }
        const newFood = kingdom.food + production.food * bonus - upkeep;
        const foodShortfall = Math.max(0, -newFood);
        const storageBoostActive = !!(kingdom.storageBoostUntil && now < new Date(kingdom.storageBoostUntil));
        const sMult = storageBoostActive ? 1.5 : 1;
        kingdom.gold = Math.min(Math.floor(kingdom.maxGold * sMult), Math.max(0, Math.floor(kingdom.gold + production.gold * bonus - workerSalary - explorerGoldSalary)));
        kingdom.wood = Math.min(Math.floor(kingdom.maxWood * sMult), Math.floor(kingdom.wood + production.wood * bonus));
        kingdom.stone = Math.min(Math.floor(kingdom.maxStone * sMult), Math.floor(kingdom.stone + production.stone * bonus));
        kingdom.food = Math.min(Math.floor(kingdom.maxFood * sMult), Math.max(0, Math.floor(newFood - explorerFoodSalary)));
        const ragnar = units.find(u => u.type === 'ragnar' && u.count > 0);
        if (ragnar) {
            kingdom.gems = Math.floor(kingdom.gems + 2 * hoursElapsed);
        }
        const gemMines = buildings.filter(b => b.type === building_entity_1.BuildingType.GEM_FORGE && !b.needsRepair);
        const gemMineRate = gemMines.reduce((sum, b) => sum + Math.floor(5 * Math.pow(1.2, b.level - 1)), 0);
        if (gemMineRate > 0) {
            kingdom.gems = Math.floor((kingdom.gems || 0) + gemMineRate * hoursElapsed);
        }
        kingdom.lastResourceTick = now;
        if (foodShortfall > 0) {
            const desertionRate = Math.min(0.05, foodShortfall * 0.005);
            let desertionChanged = false;
            for (const unit of units) {
                if (unit.count > 0 && !unit_entity_2.HERO_TYPES.has(unit.type)) {
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
        await this.completeRepairs(buildings, now);
        const saved = await this.kingdomRepo.save(kingdom);
        const resolvedUserId = userId ?? (await this.kingdomRepo.findOne({ where: { id: kingdomId }, relations: ['user'] }))?.user?.id;
        if (resolvedUserId) {
            const user = userObj ?? await this.userRepo?.findOne({ where: { id: resolvedUserId } }).catch(() => null);
            const userPayload = user ? { telegramId: user.telegramId, language: user.language || 'en' } : {};
            const hasSoldiers = units.some(u => !unit_entity_2.HERO_TYPES.has(u.type) && u.count > 0);
            if (userId && hasSoldiers && kingdom.food <= 0 && foodShortfall > 0) {
                this.notifService.create(resolvedUserId, 'low_food', { ...userPayload }).catch(() => { });
            }
            const hasHeroes = units.some(u => unit_entity_2.HERO_TYPES.has(u.type) && u.count > 0);
            if (userId && hasHeroes) {
                const hourlyGemsCost = units.reduce((s, u) => unit_entity_2.HERO_TYPES.has(u.type) && u.count > 0 ? s + (unit_entity_2.HERO_SALARY_GEMS[u.type] ?? 0) : s, 0);
                const gemsLeft = kingdom.gems ?? 0;
                const ragnarCount = units.find(u => u.type === 'ragnar' && u.count > 0)?.count ?? 0;
                const gemMineRate = buildings.filter(b => b.type === building_entity_1.BuildingType.GEM_FORGE && !b.needsRepair)
                    .reduce((s, b) => s + Math.floor(5 * Math.pow(1.2, b.level - 1)), 0) + (ragnarCount > 0 ? 2 : 0);
                const isGemsDeficit = hourlyGemsCost > gemMineRate;
                const lastGemsSent = await this.notifRepo.findOne({ where: { user: { id: resolvedUserId }, type: 'low_gems' }, order: { createdAt: 'DESC' } });
                const gemsCooldownOk = !lastGemsSent || Date.now() - new Date(lastGemsSent.createdAt).getTime() > NOTIF_COOLDOWN_MS;
                if (hourlyGemsCost > 0 && gemsLeft < hourlyGemsCost * 12 && gemsCooldownOk) {
                    this.notifService.create(resolvedUserId, 'low_gems', {
                        ...userPayload,
                        gems: gemsLeft,
                        salary: hourlyGemsCost,
                        prod: gemMineRate,
                        deficit: isGemsDeficit,
                    }).catch(() => { });
                }
            }
            if (userId) {
                const hourlyFoodProduction = Math.floor(this.calculateProduction(buildings, 1).food * bonus);
                const hourlyUpkeep = Math.floor(this.calculateUpkeep(units, 1));
                const foodLeft = kingdom.food ?? 0;
                const hoursLeft = hourlyUpkeep > 0 ? foodLeft / hourlyUpkeep : Infinity;
                const isDeficit = hourlyUpkeep > 0 && hourlyFoodProduction < hourlyUpkeep;
                const isLow = hoursLeft < 12;
                const hourlyFoodWithUpgrades = Math.floor(this.calculateProduction(buildings.map(b => b.isUpgrading ? { ...b, isUpgrading: false } : b), 1).food * bonus);
                const wouldBeDeficitWithoutUpgrades = hourlyUpkeep > 0 && hourlyFoodWithUpgrades < hourlyUpkeep;
                const lastProdSent = await this.notifRepo.findOne({ where: { user: { id: resolvedUserId }, type: 'negative_production' }, order: { createdAt: 'DESC' } });
                const prodCooldownOk = !lastProdSent || Date.now() - new Date(lastProdSent.createdAt).getTime() > NOTIF_COOLDOWN_MS;
                if (isDeficit && isLow && wouldBeDeficitWithoutUpgrades && prodCooldownOk) {
                    this.notifService.create(resolvedUserId, 'negative_production', {
                        ...userPayload,
                        food: foodLeft,
                        prod: hourlyFoodProduction,
                        upkeep: hourlyUpkeep,
                    }).catch(() => { });
                }
            }
            if (completedBuildings.length > 0 || completedUnits.length > 0) {
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
                        this.notifService.create(resolvedUserId, 'build_done', { ...userPayload, building: type, level, count }).catch(() => { });
                    }
                }
                if (completedUnits.length > 0) {
                    const grouped = new Map();
                    for (const u of completedUnits)
                        grouped.set(u.type, (grouped.get(u.type) ?? 0) + u.count);
                    for (const [type, count] of grouped) {
                        this.notifService.create(resolvedUserId, 'training_done', { ...userPayload, unit: type, count }).catch(() => { });
                    }
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
            return total + unit.count * (stats?.upkeep ?? 0) * hours;
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
                const STORAGE_BUMP = {
                    [building_entity_1.BuildingType.GOLD_MINE]: { field: 'maxGold', perLevel: 300 },
                    [building_entity_1.BuildingType.LUMBER_MILL]: { field: 'maxWood', perLevel: 250 },
                    [building_entity_1.BuildingType.STONE_QUARRY]: { field: 'maxStone', perLevel: 200 },
                    [building_entity_1.BuildingType.FARM]: { field: 'maxFood', perLevel: 150 },
                };
                if (building.type === building_entity_1.BuildingType.TOWN_HALL) {
                    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
                    if (kingdom) {
                        const mult = 1 + (building.level - 1) * 0.6;
                        kingdom.maxGold = Math.floor(5000 * mult);
                        kingdom.maxWood = Math.floor(4000 * mult);
                        kingdom.maxStone = Math.floor(3000 * mult);
                        kingdom.maxFood = Math.floor(2000 * mult);
                        await this.kingdomRepo.save(kingdom);
                    }
                }
                else if (STORAGE_BUMP[building.type]) {
                    const bump = STORAGE_BUMP[building.type];
                    await this.kingdomRepo.increment({ id: kingdomId }, bump.field, bump.perLevel);
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
    async completeRepairs(buildings, now) {
        for (const building of buildings) {
            if (building.needsRepair && building.repairEndsAt && now >= new Date(building.repairEndsAt)) {
                building.needsRepair = false;
                building.repairEndsAt = null;
                await this.buildingRepo.save(building);
            }
        }
    }
    getProductionRates(buildings, kingdom, units) {
        const rates = this.calculateProduction(buildings, 1);
        const now = new Date();
        const isWeak = kingdom ? kingdom.score < 1000 : false;
        const boostActive = !!(kingdom?.productionBoostUntil && now < new Date(kingdom.productionBoostUntil));
        const weakBonus = isWeak ? game_constants_1.WEAK_PLAYER_RESOURCE_BONUS : 0;
        const boostBonus = boostActive ? 1 : 0;
        const vipBonus = kingdom?.isVip ? 0.5 : 0;
        const workerCount = kingdom?.workers || 0;
        const workerProductionBonus = 1 + workerCount * 0.04;
        const academyInRates = buildings.find((b) => b.type === building_entity_1.BuildingType.ACADEMY && !b.needsRepair);
        const academyBonusInRates = academyInRates ? academyInRates.level * 0.02 : 0;
        const bonus = (1 + weakBonus + boostBonus + vipBonus + academyBonusInRates) * workerProductionBonus;
        const workerSalary = workerCount * 5;
        const gemMinesForRate = buildings.filter(b => b.type === building_entity_1.BuildingType.GEM_FORGE && !b.needsRepair);
        const gemMineRate = gemMinesForRate.reduce((s, b) => s + Math.floor(5 * Math.pow(1.2, b.level - 1)), 0);
        const unitsArr = units ?? [];
        const ragnarCount = unitsArr.find(u => u.type === 'ragnar')?.count ?? 0;
        const gemsPerHour = gemMineRate + ragnarCount * 2;
        const gemsSalaryPerHour = unitsArr.reduce((s, u) => s + u.count * (unit_entity_2.HERO_SALARY_GEMS[u.type] ?? 0), 0);
        return {
            gold: Math.floor(rates.gold * bonus - workerSalary),
            wood: Math.floor(rates.wood * bonus),
            stone: Math.floor(rates.stone * bonus),
            food: Math.floor(rates.food * bonus),
            gems: gemsPerHour,
            gemsSalary: gemsSalaryPerHour,
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
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => notification_service_1.NotificationService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notification_service_1.NotificationService])
], EconomyService);
//# sourceMappingURL=economy.service.js.map