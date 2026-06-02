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
const combat_service_1 = require("./combat.service");
const kingdom_service_1 = require("../kingdom/kingdom.service");
class AttackDto {
}
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AttackDto.prototype, "defenderKingdomId", void 0);
let CombatController = class CombatController {
    constructor(combatService, kingdomService) {
        this.combatService = combatService;
        this.kingdomService = kingdomService;
    }
    async attack(req, dto) {
        const myKingdom = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.combatService.attack(myKingdom.kingdom.id, dto.defenderKingdomId);
    }
    async getTargets(req) {
        const myKingdom = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.combatService.getTargets(myKingdom.kingdom);
    }
};
exports.CombatController = CombatController;
__decorate([
    (0, common_1.Post)('attack'),
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
exports.CombatController = CombatController = __decorate([
    (0, common_1.Controller)('combat'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [combat_service_1.CombatService,
        kingdom_service_1.KingdomService])
], CombatController);
//# sourceMappingURL=combat.controller.js.map