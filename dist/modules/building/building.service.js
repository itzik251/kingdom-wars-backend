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
exports.BuildingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const building_entity_1 = require("./building.entity");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const game_constants_1 = require("../../constants/game.constants");
let BuildingService = class BuildingService {
    constructor(buildingRepo, kingdomRepo) {
        this.buildingRepo = buildingRepo;
        this.kingdomRepo = kingdomRepo;
    }
    async upgradeBuilding(kingdomId, buildingType, isVip = false, buildingId) {
        const [building, kingdom] = await Promise.all([
            buildingId
                ? this.buildingRepo.findOne({ where: { id: buildingId, kingdom: { id: kingdomId } } })
                : this.buildingRepo.findOne({ where: { kingdom: { id: kingdomId }, type: buildingType } }),
            this.kingdomRepo.findOne({ where: { id: kingdomId } }),
        ]);
        if (!building)
            throw new common_1.BadRequestException('Building not found');
        if (building.isUpgrading)
            throw new common_1.BadRequestException('Building already upgrading');
        if (building.level >= game_constants_1.MAX_BUILDING_LEVEL)
            throw new common_1.BadRequestException('Building at max level');
        const cost = this.getUpgradeCost(building.type, building.level);
        if (kingdom.gold < cost.gold)
            throw new common_1.BadRequestException('Not enough gold');
        if (kingdom.wood < cost.wood)
            throw new common_1.BadRequestException('Not enough wood');
        if (kingdom.stone < cost.stone)
            throw new common_1.BadRequestException('Not enough stone');
        // Double-check building is still not upgrading (race condition guard)
        const freshBuilding = await this.buildingRepo.findOne({ where: { id: building.id } });
        if (freshBuilding?.upgradeEndsAt && new Date() < new Date(freshBuilding.upgradeEndsAt))
            throw new common_1.BadRequestException('Building already upgrading');
        kingdom.gold -= cost.gold;
        kingdom.wood -= cost.wood;
        kingdom.stone -= cost.stone;
        await this.kingdomRepo.save(kingdom);
        let buildTime = this.getBuildTime(building.type, building.level);
        if (isVip)
            buildTime = Math.floor(buildTime * (1 - game_constants_1.VIP_BUILD_TIME_REDUCTION));
        building.upgradeEndsAt = new Date(Date.now() + buildTime * 1000);
        await this.buildingRepo.save(building);
        return {
            building,
            cost,
            upgradeEndsAt: building.upgradeEndsAt,
            durationSeconds: buildTime,
        };
    }
    async speedUpUpgrade(kingdomId, buildingType, buildingId) {
        const [building, kingdom] = await Promise.all([
            buildingId
                ? this.buildingRepo.findOne({ where: { id: buildingId, kingdom: { id: kingdomId } } })
                : this.buildingRepo.findOne({ where: { kingdom: { id: kingdomId }, type: buildingType } }),
            this.kingdomRepo.findOne({ where: { id: kingdomId } }),
        ]);
        if (!building?.upgradeEndsAt || new Date() > new Date(building.upgradeEndsAt))
            throw new common_1.BadRequestException('Building is not upgrading');
        const secsLeft = Math.max(0, (new Date(building.upgradeEndsAt).getTime() - Date.now()) / 1000);
        const gemCost = Math.max(1, Math.ceil(secsLeft / 60));
        if (kingdom.gems < gemCost)
            throw new common_1.BadRequestException(`Need ${gemCost} gems`);
        kingdom.gems -= gemCost;
        building.level += 1;
        building.upgradeEndsAt = null;
        await Promise.all([this.kingdomRepo.save(kingdom), this.buildingRepo.save(building)]);
        return { gemCost, newLevel: building.level };
    }
    getUpgradeCost(type, currentLevel) {
        const base = game_constants_1.BUILDING_BASE_COSTS[type];
        const mult = Math.pow(game_constants_1.UPGRADE_COST_MULTIPLIER, currentLevel);
        return {
            gold: Math.floor(base.gold * mult),
            wood: Math.floor(base.wood * mult),
            stone: Math.floor(base.stone * mult),
        };
    }
    getBuildTime(type, currentLevel) {
        const base = game_constants_1.BUILDING_BASE_TIMES[type];
        return Math.floor(base * Math.pow(game_constants_1.BUILD_TIME_MULTIPLIER, currentLevel));
    }
    async buildNew(kingdomId, buildingType) {
        const baseCost = game_constants_1.BUILDING_BASE_COSTS[buildingType];
        if (!baseCost)
            throw new common_1.BadRequestException('Invalid building type');
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        const MULTI_ALLOWED = [
            building_entity_1.BuildingType.GOLD_MINE, building_entity_1.BuildingType.LUMBER_MILL, building_entity_1.BuildingType.STONE_QUARRY, building_entity_1.BuildingType.FARM,
        ];
        const existing = await this.buildingRepo.find({ where: { kingdom: { id: kingdomId }, type: buildingType } });
        if (existing.length > 0 && !MULTI_ALLOWED.includes(buildingType)) {
            throw new common_1.BadRequestException('Building already exists');
        }
        if (existing.length >= 3)
            throw new common_1.BadRequestException('Maximum 3 of this building');
        if (buildingType === building_entity_1.BuildingType.ARCANE_TOWER && !kingdom.isVip) {
            throw new common_1.BadRequestException('VIP required');
        }
        const mult = Math.pow(2, existing.length);
        const cost = {
            gold: Math.floor(baseCost.gold * mult),
            wood: Math.floor(baseCost.wood * mult),
            stone: Math.floor(baseCost.stone * mult),
        };
        if (kingdom.gold < cost.gold)
            throw new common_1.BadRequestException('Not enough gold');
        if (kingdom.wood < cost.wood)
            throw new common_1.BadRequestException('Not enough wood');
        if (kingdom.stone < cost.stone)
            throw new common_1.BadRequestException('Not enough stone');
        kingdom.gold -= cost.gold;
        kingdom.wood -= cost.wood;
        kingdom.stone -= cost.stone;
        await this.kingdomRepo.save(kingdom);
        const slot = existing.length;
        const building = this.buildingRepo.create({ kingdom: { id: kingdomId }, type: buildingType, level: 1, slot });
        await this.buildingRepo.save(building);
        return { building, cost };
    }
    async repairBuilding(kingdomId, buildingId) {
        const [building, kingdom] = await Promise.all([
            this.buildingRepo.findOne({ where: { id: buildingId, kingdom: { id: kingdomId } } }),
            this.kingdomRepo.findOne({ where: { id: kingdomId } }),
        ]);
        if (!building)
            throw new common_1.BadRequestException('Building not found');
        if (!building.needsRepair)
            throw new common_1.BadRequestException('Building does not need repair');
        const baseCost = this.getUpgradeCost(building.type, building.level);
        const cost = { gold: Math.floor(baseCost.gold * 0.5), wood: Math.floor(baseCost.wood * 0.5), stone: Math.floor(baseCost.stone * 0.5) };
        if (kingdom.gold < cost.gold)
            throw new common_1.BadRequestException('Not enough gold');
        if (kingdom.wood < cost.wood)
            throw new common_1.BadRequestException('Not enough wood');
        if (kingdom.stone < cost.stone)
            throw new common_1.BadRequestException('Not enough stone');
        kingdom.gold -= cost.gold;
        kingdom.wood -= cost.wood;
        kingdom.stone -= cost.stone;
        building.needsRepair = false;
        await Promise.all([this.kingdomRepo.save(kingdom), this.buildingRepo.save(building)]);
        return { building, cost };
    }
    async getAllUpgradeCosts(kingdomId) {
        const buildings = await this.buildingRepo.find({ where: { kingdom: { id: kingdomId } } });
        return buildings.map(b => ({
            type: b.type,
            level: b.level,
            nextLevelCost: this.getUpgradeCost(b.type, b.level),
            buildTimeSeconds: this.getBuildTime(b.type, b.level),
            isUpgrading: b.isUpgrading,
            upgradeEndsAt: b.upgradeEndsAt,
        }));
    }
};
exports.BuildingService = BuildingService;
exports.BuildingService = BuildingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(building_entity_1.Building)),
    __param(1, (0, typeorm_1.InjectRepository)(kingdom_entity_1.Kingdom)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], BuildingService);
//# sourceMappingURL=building.service.js.map