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
exports.KingdomController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const kingdom_service_1 = require("./kingdom.service");
let KingdomController = class KingdomController {
    constructor(kingdomService) {
        this.kingdomService = kingdomService;
    }
    getMyKingdom(req) {
        return this.kingdomService.getKingdomByUser(req.user.userId);
    }
    async buyShield(req) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.kingdomService.buyShield(kingdom.id);
    }
    async expandStorage(req) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.kingdomService.expandStorage(kingdom.id);
    }
    async hireWorker(req) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.kingdomService.hireWorker(kingdom.id);
    }
    async fireWorker(req) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.kingdomService.fireWorker(kingdom.id);
    }
    async renameKingdom(req, body) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.kingdomService.renameKingdom(kingdom.id, body.name);
    }
    async getUsdtBalance(req) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.kingdomService.getWithdrawalStatus(kingdom.id);
    }
    async requestWithdrawal(req, body) {
        const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
        return this.kingdomService.requestWithdrawal(kingdom.id, body.walletAddress);
    }
    withdrawUsdt() {
        throw new common_1.BadRequestException('נא להשתמש בטופס המשיכה החדש עם כתובת ארנק');
    }
};
exports.KingdomController = KingdomController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KingdomController.prototype, "getMyKingdom", null);
__decorate([
    (0, common_1.Post)('shield'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KingdomController.prototype, "buyShield", null);
__decorate([
    (0, common_1.Post)('expand-storage'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KingdomController.prototype, "expandStorage", null);
__decorate([
    (0, common_1.Post)('hire-worker'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KingdomController.prototype, "hireWorker", null);
__decorate([
    (0, common_1.Post)('fire-worker'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KingdomController.prototype, "fireWorker", null);
__decorate([
    (0, common_1.Post)('rename'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], KingdomController.prototype, "renameKingdom", null);
__decorate([
    (0, common_1.Get)('usdt-balance'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KingdomController.prototype, "getUsdtBalance", null);
__decorate([
    (0, common_1.Post)('request-withdrawal'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], KingdomController.prototype, "requestWithdrawal", null);
__decorate([
    (0, common_1.Post)('withdraw-usdt'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], KingdomController.prototype, "withdrawUsdt", null);
exports.KingdomController = KingdomController = __decorate([
    (0, common_1.Controller)('kingdom'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [kingdom_service_1.KingdomService])
], KingdomController);
//# sourceMappingURL=kingdom.controller.js.map