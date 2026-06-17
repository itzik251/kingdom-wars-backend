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
const audit_service_1 = require("../audit/audit.service");
const audit_log_entity_1 = require("../audit/audit-log.entity");
let BuildingService = class BuildingService {
    constructor(buildingRepo, kingdomRepo, dataSource, auditService) {
        this.buildingRepo = buildingRepo;
        this.kingdomRepo = kingdomRepo;
        this.dataSource = dataSource;
        this.auditService = auditService;
    }
    async upgradeBuilding(kingdomId, buildingType, isVip = false, buildingId) {
        return this.dataSource.transaction(async (manager) => {
            const [building, kingdom] = await Promise.all([
                buildingId
                    ? manager.findOne(building_entity_1.Building, { where: { id: buildingId, kingdom: { id: kingdomId } } })
                    : manager.findOne(building_entity_1.Building, { where: { kingdom: { id: kingdomId }, type: buildingType } }),
                manager.findOne(kingdom_entity_1.Kingdom, { where: { id: kingdomId } }),
            ]);
            if (!building)
                throw new common_1.BadRequestException('BUILDING_NOT_FOUND');
            if (building.isUpgrading)
                throw new common_1.BadRequestException('ALREADY_UPGRADING');
            if (building.level >= game_constants_1.MAX_BUILDING_LEVEL)
                throw new common_1.BadRequestException('BUILDING_MAX_LEVEL');
            const cost = this.getUpgradeCost(building.type, building.level);
            if (kingdom.gold < cost.gold)
                throw new common_1.BadRequestException('NOT_ENOUGH_GOLD');
            if (kingdom.wood < cost.wood)
                throw new common_1.BadRequestException('NOT_ENOUGH_WOOD');
            if (kingdom.stone < cost.stone)
                throw new common_1.BadRequestException('NOT_ENOUGH_STONE');
            const deductResult = await manager
                .createQueryBuilder()
                .update(kingdom_entity_1.Kingdom)
                .set({
                gold: () => `gold - ${cost.gold}`,
                wood: () => `wood - ${cost.wood}`,
                stone: () => `stone - ${cost.stone}`,
            })
                .where('id = :id AND gold >= :g AND wood >= :w AND stone >= :s', {
                id: kingdomId, g: cost.gold, w: cost.wood, s: cost.stone,
            })
                .execute();
            if (!deductResult.affected || deductResult.affected === 0) {
                throw new common_1.BadRequestException('NOT_ENOUGH_RESOURCES');
            }
            let buildTime = this.getBuildTime(building.type, building.level);
            if (isVip)
                buildTime = Math.floor(buildTime * (1 - game_constants_1.VIP_BUILD_TIME_REDUCTION));
            building.upgradeEndsAt = new Date(Date.now() + buildTime * 1000);
            await manager.save(building_entity_1.Building, building);
            this.auditService.log(audit_log_entity_1.AuditAction.UPGRADE, kingdomId, {
                type: building.type,
                buildingId: building.id,
                fromLevel: building.level,
                toLevel: building.level + 1,
                cost,
                upgradeEndsAt: building.upgradeEndsAt,
                isVip,
            });
            return {
                building,
                cost,
                upgradeEndsAt: building.upgradeEndsAt,
                durationSeconds: buildTime,
            };
        });
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
            throw new common_1.BadRequestException('NOT_ENOUGH_GEMS');
        kingdom.gems -= gemCost;
        building.level += 1;
        building.upgradeEndsAt = null;
        await Promise.all([this.kingdomRepo.save(kingdom), this.buildingRepo.save(building)]);
        if (building.type === building_entity_1.BuildingType.TOWN_HALL) {
            const mult = 1 + (building.level - 1) * 3.2;
            await this.kingdomRepo.update({ id: kingdomId }, {
                maxGold: Math.floor(5000 * mult),
                maxWood: Math.floor(4000 * mult),
                maxStone: Math.floor(3000 * mult),
                maxFood: Math.floor(2000 * mult),
            });
        }
        else {
            const STORAGE_BUMP = {
                [building_entity_1.BuildingType.GOLD_MINE]: { field: 'maxGold', perLevel: 300 },
                [building_entity_1.BuildingType.LUMBER_MILL]: { field: 'maxWood', perLevel: 250 },
                [building_entity_1.BuildingType.STONE_QUARRY]: { field: 'maxStone', perLevel: 200 },
                [building_entity_1.BuildingType.FARM]: { field: 'maxFood', perLevel: 150 },
            };
            const bump = STORAGE_BUMP[building.type];
            if (bump)
                await this.kingdomRepo.increment({ id: kingdomId }, bump.field, bump.perLevel);
        }
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
        if (existing.length >= 6)
            throw new common_1.BadRequestException('Maximum 6 of this building');
        if (buildingType === building_entity_1.BuildingType.ARCANE_TOWER && !kingdom.isVip) {
            throw new common_1.BadRequestException('VIP_REQUIRED');
        }
        const mult = Math.pow(2, existing.length);
        const cost = {
            gold: Math.floor(baseCost.gold * mult),
            wood: Math.floor(baseCost.wood * mult),
            stone: Math.floor(baseCost.stone * mult),
        };
        if (kingdom.gold < cost.gold)
            throw new common_1.BadRequestException('NOT_ENOUGH_GOLD');
        if (kingdom.wood < cost.wood)
            throw new common_1.BadRequestException('NOT_ENOUGH_WOOD');
        if (kingdom.stone < cost.stone)
            throw new common_1.BadRequestException('NOT_ENOUGH_STONE');
        kingdom.gold -= cost.gold;
        kingdom.wood -= cost.wood;
        kingdom.stone -= cost.stone;
        await this.kingdomRepo.save(kingdom);
        const slot = existing.length;
        const building = this.buildingRepo.create({ kingdom: { id: kingdomId }, type: buildingType, level: 1, slot });
        await this.buildingRepo.save(building);
        return { building, cost };
    }
    getRepairCost(type, level) {
        const upgradeCost = this.getUpgradeCost(type, level);
        const repairTime = Math.floor(this.getBuildTime(type, level) * 0.4);
        return {
            cost: {
                gold: Math.floor(upgradeCost.gold * 0.5),
                wood: Math.floor(upgradeCost.wood * 0.5),
                stone: Math.floor(upgradeCost.stone * 0.5),
            },
            repairTimeSeconds: repairTime,
        };
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
        if (building.isRepairing)
            throw new common_1.BadRequestException('Already repairing');
        const { cost, repairTimeSeconds } = this.getRepairCost(building.type, building.level);
        if (kingdom.gold < cost.gold)
            throw new common_1.BadRequestException('NOT_ENOUGH_GOLD');
        if (kingdom.wood < cost.wood)
            throw new common_1.BadRequestException('NOT_ENOUGH_WOOD');
        if (kingdom.stone < cost.stone)
            throw new common_1.BadRequestException('NOT_ENOUGH_STONE');
        kingdom.gold -= cost.gold;
        kingdom.wood -= cost.wood;
        kingdom.stone -= cost.stone;
        building.repairEndsAt = new Date(Date.now() + repairTimeSeconds * 1000);
        await Promise.all([this.kingdomRepo.save(kingdom), this.buildingRepo.save(building)]);
        return { building, cost, repairEndsAt: building.repairEndsAt, repairTimeSeconds };
    }
    async completeRepairs(kingdomId) {
        const now = new Date();
        const buildings = await this.buildingRepo.find({ where: { kingdom: { id: kingdomId } } });
        const toFix = buildings.filter(b => b.needsRepair && b.repairEndsAt && now >= new Date(b.repairEndsAt));
        for (const b of toFix) {
            b.needsRepair = false;
            b.repairEndsAt = null;
            await this.buildingRepo.save(b);
        }
    }
    async moveBuilding(kingdomId, buildingId, gridX, gridY) {
        const building = await this.buildingRepo.findOne({ where: { id: buildingId, kingdom: { id: kingdomId } } });
        if (!building)
            throw new common_1.BadRequestException('Building not found');
        if (gridX < 0 || gridX > 15 || gridY < 0 || gridY > 15)
            throw new common_1.BadRequestException('Invalid position');
        building.gridX = gridX;
        building.gridY = gridY;
        await this.buildingRepo.save(building);
        return { id: building.id, gridX, gridY };
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
    __param(2, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        audit_service_1.AuditService])
], BuildingService);
//# sourceMappingURL=building.service.js.map