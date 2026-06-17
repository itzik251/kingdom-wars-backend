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
exports.AllianceController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const alliance_service_1 = require("./alliance.service");
const kingdom_service_1 = require("../kingdom/kingdom.service");
class CreateAllianceDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(64),
    __metadata("design:type", String)
], CreateAllianceDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(6),
    __metadata("design:type", String)
], CreateAllianceDto.prototype, "tag", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateAllianceDto.prototype, "description", void 0);
class JoinAllianceDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], JoinAllianceDto.prototype, "allianceId", void 0);
class KickDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], KickDto.prototype, "targetKingdomId", void 0);
class TransferDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferDto.prototype, "targetKingdomId", void 0);
let AllianceController = class AllianceController {
    constructor(allianceService, kingdomService) {
        this.allianceService = allianceService;
        this.kingdomService = kingdomService;
    }
    list() {
        return this.allianceService.listAlliances();
    }
    async getMine(req) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.allianceService.getMyAlliance(kingdom.id);
    }
    async create(req, dto) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.allianceService.create(kingdom.id, dto.name, dto.tag, dto.description);
    }
    async join(req, dto) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.allianceService.join(kingdom.id, dto.allianceId);
    }
    async leave(req) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.allianceService.leave(kingdom.id);
    }
    async kick(req, dto) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.allianceService.kick(kingdom.id, dto.targetKingdomId);
    }
    async transfer(req, dto) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.allianceService.transferLeadership(kingdom.id, dto.targetKingdomId);
    }
    async promote(req, targetKingdomId) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.allianceService.promote(kingdom.id, targetKingdomId);
    }
    async disband(req) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.allianceService.disband(kingdom.id);
    }
};
exports.AllianceController = AllianceController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AllianceController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('mine'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "getMine", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateAllianceDto]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('join'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, JoinAllianceDto]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "join", null);
__decorate([
    (0, common_1.Delete)('leave'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "leave", null);
__decorate([
    (0, common_1.Post)('kick'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, KickDto]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "kick", null);
__decorate([
    (0, common_1.Post)('transfer-leadership'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, TransferDto]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "transfer", null);
__decorate([
    (0, common_1.Post)('promote/:kingdomId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('kingdomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "promote", null);
__decorate([
    (0, common_1.Delete)('disband'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AllianceController.prototype, "disband", null);
exports.AllianceController = AllianceController = __decorate([
    (0, common_1.Controller)('alliances'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [alliance_service_1.AllianceService,
        kingdom_service_1.KingdomService])
], AllianceController);
//# sourceMappingURL=alliance.controller.js.map