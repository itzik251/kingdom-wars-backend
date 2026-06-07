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
exports.VipController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const vip_service_1 = require("./vip.service");
class ActivateDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ActivateDto.prototype, "tonTxHash", void 0);
let VipController = class VipController {
    constructor(vipService) {
        this.vipService = vipService;
    }
    getStatus(req) {
        return this.vipService.getStatus(req.user.userId);
    }
    activate(req, dto) {
        return this.vipService.activateVip(req.user.userId, dto.tonTxHash);
    }
    purchaseWithUsdt(req) {
        return this.vipService.purchaseWithUsdt(req.user.userId);
    }
    getPaymentInfo() {
        return this.vipService.getPaymentInfo();
    }
    getInvoice() {
        return this.vipService.getPaymentInfo();
    }
};
exports.VipController = VipController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VipController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('activate'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ActivateDto]),
    __metadata("design:returntype", void 0)
], VipController.prototype, "activate", null);
__decorate([
    (0, common_1.Post)('purchase-with-usdt'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VipController.prototype, "purchaseWithUsdt", null);
__decorate([
    (0, common_1.Get)('payment-info'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], VipController.prototype, "getPaymentInfo", null);
__decorate([
    (0, common_1.Get)('invoice'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], VipController.prototype, "getInvoice", null);
exports.VipController = VipController = __decorate([
    (0, common_1.Controller)('vip'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [vip_service_1.VipService])
], VipController);
//# sourceMappingURL=vip.controller.js.map