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
exports.ExplorationController = void 0;
const common_1 = require("@nestjs/common");
const exploration_service_1 = require("./exploration.service");
const kingdom_service_1 = require("../kingdom/kingdom.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let ExplorationController = class ExplorationController {
    constructor(explorationService, kingdomService) {
        this.explorationService = explorationService;
        this.kingdomService = kingdomService;
    }
    async getKingdomId(req) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return kingdom.id;
    }
    async getMap(req) {
        return this.explorationService.getMap(await this.getKingdomId(req));
    }
    async hireExplorer(req) {
        return this.explorationService.hireExplorer(await this.getKingdomId(req));
    }
    async sendMission(req, body) {
        return this.explorationService.sendMission(await this.getKingdomId(req), body.targetX, body.targetY);
    }
    async raidNode(req, nodeId) {
        return this.explorationService.raidNode(await this.getKingdomId(req), nodeId);
    }
    async recruitHero(req, nodeId) {
        return this.explorationService.recruitHero(await this.getKingdomId(req), nodeId);
    }
    async clearCompleted(req) {
        return this.explorationService.clearCompletedMissions(await this.getKingdomId(req));
    }
};
exports.ExplorationController = ExplorationController;
__decorate([
    (0, common_1.Get)('map'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExplorationController.prototype, "getMap", null);
__decorate([
    (0, common_1.Post)('hire-explorer'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExplorationController.prototype, "hireExplorer", null);
__decorate([
    (0, common_1.Post)('mission'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ExplorationController.prototype, "sendMission", null);
__decorate([
    (0, common_1.Post)('raid/:nodeId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('nodeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ExplorationController.prototype, "raidNode", null);
__decorate([
    (0, common_1.Post)('recruit/:nodeId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('nodeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ExplorationController.prototype, "recruitHero", null);
__decorate([
    (0, common_1.Delete)('missions/completed'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExplorationController.prototype, "clearCompleted", null);
exports.ExplorationController = ExplorationController = __decorate([
    (0, common_1.Controller)('exploration'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [exploration_service_1.ExplorationService,
        kingdom_service_1.KingdomService])
], ExplorationController);
//# sourceMappingURL=exploration.controller.js.map