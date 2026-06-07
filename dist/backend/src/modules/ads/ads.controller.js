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
exports.AdsController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const ads_service_1 = require("./ads.service");
const kingdom_service_1 = require("../kingdom/kingdom.service");
class RewardDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(['double_production', 'double_attack_speed', 'usdt_bonus', 'gems', 'gold_bonus', 'wood_bonus', 'stone_bonus', 'food_bonus']),
    __metadata("design:type", String)
], RewardDto.prototype, "type", void 0);
let AdsController = class AdsController {
    constructor(adsService, kingdomService) {
        this.adsService = adsService;
        this.kingdomService = kingdomService;
    }
    async getStatus(req) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.adsService.getBoostStatus(kingdom.id);
    }
    async claimReward(req, dto) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.adsService.claimReward(req.user.userId, kingdom.id, dto.type);
    }
};
exports.AdsController = AdsController;
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdsController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('reward'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, RewardDto]),
    __metadata("design:returntype", Promise)
], AdsController.prototype, "claimReward", null);
exports.AdsController = AdsController = __decorate([
    (0, common_1.Controller)('ads'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [ads_service_1.AdsService,
        kingdom_service_1.KingdomService])
], AdsController);
//# sourceMappingURL=ads.controller.js.map