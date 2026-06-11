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
var VipService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VipService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../user/user.entity");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const ton_service_1 = require("../ton/ton.service");
const game_constants_1 = require("../../constants/game.constants");
const vipStore = new Map();
let VipService = VipService_1 = class VipService {
    constructor(userRepo, kingdomRepo, dataSource, tonService) {
        this.userRepo = userRepo;
        this.kingdomRepo = kingdomRepo;
        this.dataSource = dataSource;
        this.tonService = tonService;
        this.logger = new common_1.Logger(VipService_1.name);
    }
    async getStatus(userId) {
        const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: userId } } });
        const dbExpiry = kingdom?.vipExpiresAt;
        const isVip = !!(dbExpiry && new Date() < new Date(dbExpiry));
        if (isVip && dbExpiry)
            vipStore.set(userId, new Date(dbExpiry));
        return {
            isVip,
            expiresAt: isVip ? dbExpiry : null,
            priceUsdt: game_constants_1.VIP_PRICE_USDT_TON,
            currency: 'USDT-TON',
            gameWallet: game_constants_1.PAYMENT_WALLET_ADDRESS,
            usdtBalance: parseFloat(((kingdom?.usdtBalance ?? 0)).toFixed(4)),
        };
    }
    async activateVip(userId, tonTxHash) {
        if (!tonTxHash || typeof tonTxHash !== 'string' || tonTxHash.length < 20) {
            throw new common_1.BadRequestException('hash טרנזקציה לא תקין');
        }
        const cleanHash = tonTxHash.trim().replace(/[^A-Za-z0-9_\-]/g, '');
        if (cleanHash.length < 20)
            throw new common_1.BadRequestException('hash טרנזקציה לא תקין');
        const already = await this.dataSource.query(`SELECT 1 FROM vip_tx_hashes WHERE tx_hash = $1 LIMIT 1`, [cleanHash]).catch(() => []);
        if (already.length > 0) {
            throw new common_1.BadRequestException('hash זה כבר שומש — אנא צור קשר עם התמיכה');
        }
        const isProd = process.env.NODE_ENV === 'production';
        if (isProd) {
            const verified = await this.tonService.verifyUsdtTx(cleanHash, game_constants_1.VIP_PRICE_USDT_TON, game_constants_1.PAYMENT_WALLET_ADDRESS);
            if (!verified)
                throw new common_1.BadRequestException('הטרנזקציה לא נמצאה ב-TON — המתן מספר שניות ונסה שוב');
        }
        await this.dataSource.query(`INSERT INTO vip_tx_hashes(tx_hash, user_id) VALUES($1, $2) ON CONFLICT DO NOTHING`, [cleanHash, userId]).catch(() => { });
        const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: userId } } });
        const expiresAt = new Date(Math.max(Date.now(), kingdom?.vipExpiresAt?.getTime() ?? 0) + game_constants_1.VIP_DURATION_DAYS * 86_400_000);
        if (kingdom) {
            kingdom.vipExpiresAt = expiresAt;
            await this.kingdomRepo.save(kingdom);
        }
        vipStore.set(userId, expiresAt);
        this.logger.log(`VIP activated: userId=${userId} hash=${cleanHash}`);
        return { success: true, expiresAt, durationDays: game_constants_1.VIP_DURATION_DAYS };
    }
    async purchaseWithUsdt(userId) {
        const result = await this.kingdomRepo
            .createQueryBuilder()
            .update()
            .set({ usdtBalance: () => `usdt_balance - ${game_constants_1.VIP_PRICE_USDT_TON}` })
            .where('user_id = (SELECT id FROM users WHERE id = :uid) AND usdt_balance >= :price', { uid: userId, price: game_constants_1.VIP_PRICE_USDT_TON })
            .execute();
        const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: userId } } });
        if (!kingdom)
            throw new common_1.BadRequestException('Kingdom not found');
        if (!result.affected || result.affected === 0) {
            throw new common_1.BadRequestException(`נדרש ${game_constants_1.VIP_PRICE_USDT_TON} USDT. יתרתך: ${(kingdom.usdtBalance ?? 0).toFixed(4)} USDT`);
        }
        const expiresAt = new Date(Math.max(Date.now(), kingdom.vipExpiresAt?.getTime() ?? 0) + game_constants_1.VIP_DURATION_DAYS * 86_400_000);
        await this.kingdomRepo.update({ id: kingdom.id }, { vipExpiresAt: expiresAt });
        vipStore.set(userId, expiresAt);
        this.logger.log(`VIP purchased with USDT: userId=${userId}`);
        return { success: true, expiresAt, durationDays: game_constants_1.VIP_DURATION_DAYS };
    }
    getPaymentInfo() {
        return {
            walletAddress: game_constants_1.PAYMENT_WALLET_ADDRESS,
            amount: game_constants_1.VIP_PRICE_USDT_TON,
            currency: 'USDT-TON',
            network: 'TON',
            note: `שלח בדיוק ${game_constants_1.VIP_PRICE_USDT_TON} USDT על רשת TON. אחרי השליחה הכנס את hash הטרנזקציה.`,
        };
    }
    isUserVip(userId) {
        const expiresAt = vipStore.get(userId);
        return !!(expiresAt && new Date() < expiresAt);
    }
};
exports.VipService = VipService;
exports.VipService = VipService = VipService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(kingdom_entity_1.Kingdom)),
    __param(2, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        ton_service_1.TonService])
], VipService);
//# sourceMappingURL=vip.service.js.map