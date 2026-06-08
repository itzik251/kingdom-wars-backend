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
var CryptoBotController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoBotController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const cryptobot_service_1 = require("./cryptobot.service");
const vip_service_1 = require("../vip/vip.service");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const game_constants_1 = require("../../constants/game.constants");
const config_1 = require("@nestjs/config");
let CryptoBotController = CryptoBotController_1 = class CryptoBotController {
    constructor(cryptoBotService, vipService, config, kingdomRepo) {
        this.cryptoBotService = cryptoBotService;
        this.vipService = vipService;
        this.config = config;
        this.kingdomRepo = kingdomRepo;
        this.logger = new common_1.Logger(CryptoBotController_1.name);
    }
    async createVipInvoice(req) {
        const invoice = await this.cryptoBotService.createVipInvoice(req.user.userId, 5);
        return {
            invoiceId: invoice.invoice_id,
            payUrl: invoice.mini_app_invoice_url || invoice.bot_invoice_url || invoice.pay_url,
            amount: '5 USDT',
            expiresIn: 3600,
        };
    }
    async checkVipPayment(req, body) {
        const invoice = await this.cryptoBotService.getInvoice(body.invoiceId);
        if (!invoice)
            return { paid: false, reason: 'invoice_not_found' };
        if (invoice.status !== 'paid')
            return { paid: false, status: invoice.status };
        const payloadUserId = invoice.payload?.split(':')?.[1];
        if (payloadUserId !== req.user.userId) {
            return { paid: false, reason: 'user_mismatch' };
        }
        const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: req.user.userId } } });
        if (!kingdom)
            return { paid: false, reason: 'kingdom_not_found' };
        const expiresAt = new Date(Math.max(Date.now(), kingdom.vipExpiresAt?.getTime() ?? 0) + game_constants_1.VIP_DURATION_DAYS * 86_400_000);
        await this.kingdomRepo.update({ id: kingdom.id }, { vipExpiresAt: expiresAt });
        return { paid: true, vipActivated: true, expiresAt };
    }
    async handleWebhook(body, headers) {
        this.logger.log('CryptoBot webhook received: ' + JSON.stringify(body));
        if (body?.update_type === 'invoice_paid') {
            const invoice = body.payload;
            const payload = invoice?.payload || '';
            if (payload.startsWith('vip:')) {
                const userId = payload.split(':')?.[1];
                if (!userId)
                    return { ok: true };
                const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: userId } } });
                if (!kingdom)
                    return { ok: true };
                const expiresAt = new Date(Math.max(Date.now(), kingdom.vipExpiresAt?.getTime() ?? 0) + game_constants_1.VIP_DURATION_DAYS * 86_400_000);
                await this.kingdomRepo.update({ id: kingdom.id }, { vipExpiresAt: expiresAt });
                this.logger.log(`VIP activated for userId=${userId} via webhook`);
            }
        }
        return { ok: true };
    }
};
exports.CryptoBotController = CryptoBotController;
__decorate([
    (0, common_1.Post)('create-vip-invoice'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CryptoBotController.prototype, "createVipInvoice", null);
__decorate([
    (0, common_1.Post)('check-vip-payment'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CryptoBotController.prototype, "checkVipPayment", null);
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CryptoBotController.prototype, "handleWebhook", null);
exports.CryptoBotController = CryptoBotController = CryptoBotController_1 = __decorate([
    (0, common_1.Controller)('cryptobot'),
    __param(3, (0, typeorm_1.InjectRepository)(kingdom_entity_1.Kingdom)),
    __metadata("design:paramtypes", [cryptobot_service_1.CryptoBotService,
        vip_service_1.VipService,
        config_1.ConfigService,
        typeorm_2.Repository])
], CryptoBotController);
//# sourceMappingURL=cryptobot.controller.js.map