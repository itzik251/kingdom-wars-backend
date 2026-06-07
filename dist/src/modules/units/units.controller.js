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
exports.UnitsController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const units_service_1 = require("./units.service");
const unit_entity_1 = require("./unit.entity");
const kingdom_service_1 = require("../kingdom/kingdom.service");
const quest_service_1 = require("../quest/quest.service");
class TrainDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(unit_entity_1.UnitType),
    __metadata("design:type", String)
], TrainDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], TrainDto.prototype, "amount", void 0);
let UnitsController = class UnitsController {
    constructor(unitsService, kingdomService, questService) {
        this.unitsService = unitsService;
        this.kingdomService = kingdomService;
        this.questService = questService;
    }
    async train(req, dto) {
        const myKingdom = await this.kingdomService.getKingdomByUser(req.user.userId);
        const result = await this.unitsService.trainUnits(myKingdom.kingdom.id, dto.type, dto.amount);
        await this.questService.incrementQuest(myKingdom.kingdom.id, 'train_500_soldiers', dto.amount).catch(() => { });
        return result;
    }
};
exports.UnitsController = UnitsController;
__decorate([
    (0, common_1.Post)('train'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, TrainDto]),
    __metadata("design:returntype", Promise)
], UnitsController.prototype, "train", null);
exports.UnitsController = UnitsController = __decorate([
    (0, common_1.Controller)('units'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [units_service_1.UnitsService,
        kingdom_service_1.KingdomService,
        quest_service_1.QuestService])
], UnitsController);
//# sourceMappingURL=units.controller.js.map