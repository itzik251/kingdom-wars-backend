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
exports.QuestController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const quest_service_1 = require("./quest.service");
const kingdom_service_1 = require("../kingdom/kingdom.service");
let QuestController = class QuestController {
    constructor(questService, kingdomService) {
        this.questService = questService;
        this.kingdomService = kingdomService;
    }
    async daily(req) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.questService.getDailyQuests(kingdom.id);
    }
    async weekly(req) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.questService.getWeeklyQuests(kingdom.id);
    }
    async claim(req, questId) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.questService.claimReward(kingdom.id, questId);
    }
};
exports.QuestController = QuestController;
__decorate([
    (0, common_1.Get)('daily'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuestController.prototype, "daily", null);
__decorate([
    (0, common_1.Get)('weekly'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuestController.prototype, "weekly", null);
__decorate([
    (0, common_1.Post)(':id/claim'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], QuestController.prototype, "claim", null);
exports.QuestController = QuestController = __decorate([
    (0, common_1.Controller)('quests'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [quest_service_1.QuestService,
        kingdom_service_1.KingdomService])
], QuestController);
//# sourceMappingURL=quest.controller.js.map