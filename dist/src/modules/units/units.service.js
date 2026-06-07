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
exports.UnitsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const unit_entity_1 = require("./unit.entity");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const building_entity_1 = require("../building/building.entity");
const game_constants_1 = require("../../constants/game.constants");
let UnitsService = class UnitsService {
    constructor(unitRepo, kingdomRepo, buildingRepo) {
        this.unitRepo = unitRepo;
        this.kingdomRepo = kingdomRepo;
        this.buildingRepo = buildingRepo;
    }
    async trainUnits(kingdomId, unitType, amount) {
        const [unit, kingdom, barracks] = await Promise.all([
            this.unitRepo.findOne({ where: { kingdom: { id: kingdomId }, type: unitType } }),
            this.kingdomRepo.findOne({ where: { id: kingdomId } }),
            this.buildingRepo.findOne({ where: { kingdom: { id: kingdomId }, type: building_entity_1.BuildingType.BARRACKS } }),
        ]);
        if (!barracks)
            throw new common_1.BadRequestException('No Barracks');
        const stats = game_constants_1.UNIT_STATS[unitType];
        if (barracks.level < stats.requiredBarracksLevel) {
            throw new common_1.BadRequestException(`נדרש בסיס צבאי ברמה ${stats.requiredBarracksLevel}`);
        }
        const isVip = kingdom.vipExpiresAt && new Date() < new Date(kingdom.vipExpiresAt);
        if (stats.requiresVip && !isVip) {
            throw new common_1.BadRequestException('נדרש VIP פעיל');
        }
        let unitRow = unit;
        if (!unitRow) {
            unitRow = this.unitRepo.create({
                kingdom: { id: kingdomId },
                type: unitType,
                count: 0,
                trainingCount: 0,
                trainingEndsAt: null,
            });
        }
        if (stats.requiresVip) {
            const totalGems = (stats.gemsCost ?? 0) * amount;
            if (kingdom.gems < totalGems)
                throw new common_1.BadRequestException('Not enough gems');
            kingdom.gems -= totalGems;
        }
        else {
            const totalGold = stats.goldCost * amount;
            if (kingdom.gold < totalGold)
                throw new common_1.BadRequestException('Not enough gold');
            kingdom.gold -= totalGold;
        }
        await this.kingdomRepo.save(kingdom);
        const trainingSeconds = stats.trainingTime * amount;
        if (unitRow.trainingEndsAt && new Date() < unitRow.trainingEndsAt) {
            unitRow.trainingCount += amount;
            unitRow.trainingEndsAt = new Date(unitRow.trainingEndsAt.getTime() + trainingSeconds * 1000);
        }
        else {
            unitRow.trainingCount = amount;
            unitRow.trainingEndsAt = new Date(Date.now() + trainingSeconds * 1000);
        }
        await this.unitRepo.save(unitRow);
        return { unit: unitRow, trainingEndsAt: unitRow.trainingEndsAt, durationSeconds: trainingSeconds };
    }
    getAvailableUnits(barracksLevel) {
        return Object.entries(game_constants_1.UNIT_STATS)
            .filter(([, stats]) => barracksLevel >= stats.requiredBarracksLevel)
            .map(([type, stats]) => ({ type, ...stats }));
    }
};
exports.UnitsService = UnitsService;
exports.UnitsService = UnitsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(unit_entity_1.Unit)),
    __param(1, (0, typeorm_1.InjectRepository)(kingdom_entity_1.Kingdom)),
    __param(2, (0, typeorm_1.InjectRepository)(building_entity_1.Building)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], UnitsService);
//# sourceMappingURL=units.service.js.map