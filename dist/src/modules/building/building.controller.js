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
exports.BuildingController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const building_service_1 = require("./building.service");
const building_entity_1 = require("./building.entity");
const kingdom_service_1 = require("../kingdom/kingdom.service");
const quest_service_1 = require("../quest/quest.service");
class UpgradeDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(building_entity_1.BuildingType),
    __metadata("design:type", String)
], UpgradeDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpgradeDto.prototype, "buildingId", void 0);
let BuildingController = class BuildingController {
    constructor(buildingService, kingdomService, questService) {
        this.buildingService = buildingService;
        this.kingdomService = kingdomService;
        this.questService = questService;
    }
    async getCosts(req) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.buildingService.getAllUpgradeCosts(kingdom.id);
    }
    async upgrade(req, dto) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        const result = await this.buildingService.upgradeBuilding(kingdom.id, dto.type, false, dto.buildingId);
        await this.questService.incrementQuest(kingdom.id, 'upgrade_building', 1).catch(() => { });
        return result;
    }
    async speedUp(req, dto) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.buildingService.speedUpUpgrade(kingdom.id, dto.type, dto.buildingId);
    }
    async buildNew(req, dto) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.buildingService.buildNew(kingdom.id, dto.type);
    }
    async repairCost(req, buildingId) {
        const { buildings } = await this.kingdomService.getKingdomByUser(req.user.userId);
        const building = buildings.find((b) => b.id === buildingId);
        if (!building)
            return { cost: { gold: 0, wood: 0, stone: 0 }, repairTimeSeconds: 0 };
        return this.buildingService.getRepairCost(building.type, building.level);
    }
    async repair(req, buildingId) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.buildingService.repairBuilding(kingdom.id, buildingId);
    }
};
exports.BuildingController = BuildingController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BuildingController.prototype, "getCosts", null);
__decorate([
    (0, common_1.Post)('upgrade'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, UpgradeDto]),
    __metadata("design:returntype", Promise)
], BuildingController.prototype, "upgrade", null);
__decorate([
    (0, common_1.Post)('speedup'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, UpgradeDto]),
    __metadata("design:returntype", Promise)
], BuildingController.prototype, "speedUp", null);
__decorate([
    (0, common_1.Post)('build'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, UpgradeDto]),
    __metadata("design:returntype", Promise)
], BuildingController.prototype, "buildNew", null);
__decorate([
    (0, common_1.Get)('repair-cost/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BuildingController.prototype, "repairCost", null);
__decorate([
    (0, common_1.Post)('repair/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BuildingController.prototype, "repair", null);
exports.BuildingController = BuildingController = __decorate([
    (0, common_1.Controller)('buildings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [building_service_1.BuildingService,
        kingdom_service_1.KingdomService,
        quest_service_1.QuestService])
], BuildingController);
//# sourceMappingURL=building.controller.js.map