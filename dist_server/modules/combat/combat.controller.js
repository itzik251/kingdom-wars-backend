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
exports.CombatController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const antibot_guard_1 = require("../antibot/antibot.guard");
const combat_service_1 = require("./combat.service");
const kingdom_service_1 = require("../kingdom/kingdom.service");
const quest_service_1 = require("../quest/quest.service");
class AttackDto {
}
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AttackDto.prototype, "defenderKingdomId", void 0);
let CombatController = class CombatController {
    constructor(combatService, kingdomService, questService) {
        this.combatService = combatService;
        this.kingdomService = kingdomService;
        this.questService = questService;
    }
    async attack(req, dto) {
        const myKingdom = await this.kingdomService.getKingdomByUser(req.user.userId);
        const report = await this.combatService.attack(myKingdom.kingdom.id, dto.defenderKingdomId, dto.heroType, dto.squad);
        const kid = myKingdom.kingdom.id;
        await Promise.all([
            this.questService.incrementQuest(kid, 'perform_attack', 1),
            report.loot?.gold > 0
                ? this.questService.incrementQuest(kid, 'collect_gold_1000', report.loot.gold)
                : Promise.resolve(),
            report.attackerWins
                ? this.questService.incrementQuest(kid, 'win_20_battles', 1)
                : Promise.resolve(),
        ]).catch(() => { });
        return report;
    }
    async getTargets(req) {
        const myKingdom = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.combatService.getTargets(myKingdom.kingdom);
    }
    async getProfile(req, targetId) {
        const myKingdom = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.combatService.getKingdomProfile(myKingdom.kingdom.id, targetId);
    }
};
exports.CombatController = CombatController;
__decorate([
    (0, common_1.Post)('attack'),
    (0, common_1.UseGuards)(antibot_guard_1.AntiBotGuard),
    (0, antibot_guard_1.AntiBotAction)('combat_attack'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, AttackDto]),
    __metadata("design:returntype", Promise)
], CombatController.prototype, "attack", null);
__decorate([
    (0, common_1.Get)('targets'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CombatController.prototype, "getTargets", null);
__decorate([
    (0, common_1.Get)('profile/:kingdomId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('kingdomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CombatController.prototype, "getProfile", null);
exports.CombatController = CombatController = __decorate([
    (0, common_1.Controller)('combat'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [combat_service_1.CombatService,
        kingdom_service_1.KingdomService,
        quest_service_1.QuestService])
], CombatController);
//# sourceMappingURL=combat.controller.js.map