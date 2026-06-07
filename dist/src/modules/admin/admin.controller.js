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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const fs_1 = require("fs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../user/user.entity");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const config_1 = require("@nestjs/config");
const notification_service_1 = require("../notifications/notification.service");
const tron_service_1 = require("./tron.service");
const game_constants_1 = require("../../constants/game.constants");
const WALLET_CFG_PATH = (0, path_1.resolve)(process.cwd(), 'wallet_config.json');
let AdminController = class AdminController {
    constructor(userRepo, kingdomRepo, config, notifService, tronService) {
        this.userRepo = userRepo;
        this.kingdomRepo = kingdomRepo;
        this.config = config;
        this.notifService = notifService;
        this.tronService = tronService;
    }
    dashboard(res) {
        res.sendFile((0, path_1.join)(__dirname, 'admin-dashboard.html'));
    }
    getWalletConfig() {
        try {
            if ((0, fs_1.existsSync)(WALLET_CFG_PATH)) {
                return JSON.parse((0, fs_1.readFileSync)(WALLET_CFG_PATH, 'utf-8'));
            }
        }
        catch { }
        return { address: this.config.get('GAME_WALLET_ADDRESS') || '' };
    }
    guard(headers) {
        const secret = this.config.get('ADMIN_SECRET') || 'kw_admin_2026';
        if (headers['x-admin-secret'] !== secret)
            throw new common_1.UnauthorizedException('Forbidden');
    }
    async stats(headers) {
        this.guard(headers);
        const [totalUsers, totalKingdoms] = await Promise.all([
            this.userRepo.count(),
            this.kingdomRepo.count(),
        ]);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
        const activeUsers = await this.userRepo
            .createQueryBuilder('u')
            .where('u.last_login > :d', { d: sevenDaysAgo })
            .getCount();
        const topKingdoms = await this.kingdomRepo.find({
            order: { score: 'DESC' },
            take: 10,
            relations: ['user'],
        });
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const newToday = await this.userRepo
            .createQueryBuilder('u')
            .where('u.created_at > :d', { d: todayStart })
            .getCount();
        const gemsResult = await this.kingdomRepo
            .createQueryBuilder('k')
            .select('SUM(k.gems)', 'total')
            .getRawOne();
        const usdtResult = await this.kingdomRepo
            .createQueryBuilder('k')
            .select('SUM(k.usdt_balance)', 'total')
            .getRawOne();
        const now = new Date();
        const vipCount = await this.kingdomRepo
            .createQueryBuilder('k')
            .where('k.vip_expires_at > :now', { now })
            .getCount();
        const walletCfg = this.getWalletConfig();
        return {
            totalUsers,
            totalKingdoms,
            activeUsers7d: activeUsers,
            newUsersToday: newToday,
            totalGemsInGame: parseInt(gemsResult?.total || '0'),
            totalUsdtInGame: parseFloat(usdtResult?.total || '0').toFixed(4),
            vipCount,
            gameWalletAddress: walletCfg.address,
            topKingdoms: topKingdoms.map(k => ({
                name: k.name,
                score: k.score,
                gems: k.gems,
                gold: k.gold,
                usdtBalance: (k.usdtBalance ?? 0).toFixed(4),
                username: k.user?.username || k.user?.firstName,
            })),
        };
    }
    async deleteUser(headers, telegramId) {
        this.guard(headers);
        const user = await this.userRepo.findOne({ where: { telegramId } });
        if (!user)
            return { error: 'User not found' };
        const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: user.id } } });
        if (kingdom)
            await this.kingdomRepo.remove(kingdom);
        await this.userRepo.remove(user);
        return { deleted: true, telegramId };
    }
    async banUser(headers, telegramId) {
        this.guard(headers);
        const user = await this.userRepo.findOne({ where: { telegramId } });
        if (!user)
            return { error: 'User not found' };
        await this.userRepo.update({ telegramId }, { referralCode: 'BANNED_' + telegramId.slice(-4) });
        return { banned: true, telegramId };
    }
    async giveGems(headers, telegramId, body) {
        this.guard(headers);
        return this.giveResource(telegramId, 'gems', body.gems);
    }
    async takeResource(telegramId, type, amount, headers) {
        if (headers)
            this.guard(headers);
        const user = await this.userRepo.findOne({ where: { telegramId } });
        if (!user)
            return { error: 'User not found' };
        const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: user.id } } });
        if (!kingdom)
            return { error: 'Kingdom not found' };
        if (type === 'gems')
            kingdom.gems = Math.max(0, (kingdom.gems || 0) - amount);
        else if (type === 'gold')
            kingdom.gold = Math.max(0, (kingdom.gold || 0) - amount);
        else if (type === 'wood')
            kingdom.wood = Math.max(0, (kingdom.wood || 0) - amount);
        else if (type === 'stone')
            kingdom.stone = Math.max(0, (kingdom.stone || 0) - amount);
        else if (type === 'food')
            kingdom.food = Math.max(0, (kingdom.food || 0) - amount);
        else if (type === 'usdt')
            kingdom.usdtBalance = Math.max(0, parseFloat(((kingdom.usdtBalance || 0) - amount).toFixed(6)));
        await this.kingdomRepo.save(kingdom);
        return { success: true, type, amount };
    }
    async giveResource(telegramId, type, amount, headers) {
        if (headers)
            this.guard(headers);
        const user = await this.userRepo.findOne({ where: { telegramId } });
        if (!user)
            return { error: 'User not found' };
        const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: user.id } } });
        if (!kingdom)
            return { error: 'Kingdom not found' };
        const resourceLabels = {
            gems: '💎 Gems', gold: '💰 זהב', wood: '🪵 עץ',
            stone: '🪨 אבן', food: '🌾 אוכל', usdt: '💵 USDT', vip: '👑 VIP',
        };
        if (type === 'vip') {
            const days = amount || game_constants_1.VIP_DURATION_DAYS;
            const expiresAt = new Date(Math.max(Date.now(), kingdom.vipExpiresAt?.getTime() ?? 0) + days * 86_400_000);
            kingdom.vipExpiresAt = expiresAt;
            await this.kingdomRepo.save(kingdom);
            await this.notifService.create(user.id, 'admin_gift', {
                type: 'vip', amount: days, label: `👑 VIP ל-${days} ימים`,
                language: user.language,
            }).catch(() => { });
            return { success: true, type: 'vip', vipUntil: expiresAt };
        }
        if (type === 'gems') {
            kingdom.gems = Math.max(0, (kingdom.gems || 0) + amount);
        }
        else if (type === 'gold') {
            kingdom.gold = Math.min(kingdom.maxGold, Math.max(0, (kingdom.gold || 0) + amount));
        }
        else if (type === 'wood') {
            kingdom.wood = Math.min(kingdom.maxWood, Math.max(0, (kingdom.wood || 0) + amount));
        }
        else if (type === 'stone') {
            kingdom.stone = Math.min(kingdom.maxStone, Math.max(0, (kingdom.stone || 0) + amount));
        }
        else if (type === 'food') {
            kingdom.food = Math.min(kingdom.maxFood, Math.max(0, (kingdom.food || 0) + amount));
        }
        else if (type === 'usdt') {
            kingdom.usdtBalance = parseFloat(((kingdom.usdtBalance || 0) + amount).toFixed(6));
        }
        await this.kingdomRepo.save(kingdom);
        await this.notifService.create(user.id, 'admin_gift', {
            type, amount, label: `${resourceLabels[type] || type} ×${amount}`,
            language: user.language,
        }).catch(() => { });
        return { success: true, type, amount };
    }
    getWallet(headers) {
        this.guard(headers);
        return this.getWalletConfig();
    }
    updateWallet(headers, body) {
        this.guard(headers);
        const cfg = { address: body.address?.trim() || '' };
        try {
            (0, fs_1.writeFileSync)(WALLET_CFG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
        }
        catch { }
        return { success: true, ...cfg };
    }
    async getWalletBalance(headers) {
        this.guard(headers);
        const cfg = this.getWalletConfig();
        if (!cfg.address)
            return { error: 'לא הוגדרה כתובת ארנק' };
        const [usdtBalance, trxBalance] = await Promise.all([
            this.tronService.getUsdtBalance(cfg.address),
            this.tronService.getTrxBalance(cfg.address),
        ]);
        return { address: cfg.address, usdtBalance, trxBalance };
    }
    async getPendingWithdrawals(headers) {
        this.guard(headers);
        const kingdoms = await this.kingdomRepo
            .createQueryBuilder('k')
            .leftJoinAndSelect('k.user', 'u')
            .where('k.withdrawal_status = :s', { s: 'pending' })
            .orderBy('k.created_at', 'DESC')
            .getMany();
        return kingdoms.map(k => ({
            kingdomId: k.id,
            kingdomName: k.name,
            telegramId: k.user?.telegramId,
            username: k.user?.username || k.user?.firstName,
            amount: k.withdrawalPending,
            wallet: k.withdrawalWallet,
        }));
    }
    async approveWithdrawal(headers, kingdomId) {
        this.guard(headers);
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId }, relations: ['user'] });
        if (!kingdom)
            return { error: 'Not found' };
        if (kingdom.withdrawalStatus !== 'pending')
            return { error: 'Not pending' };
        const amount = kingdom.withdrawalPending;
        const wallet = kingdom.withdrawalWallet;
        const txResult = await this.tronService.sendUsdt(wallet, amount);
        if (txResult.error) {
            return { error: txResult.error, hint: 'ודא שמפתח GAME_WALLET_PRIVATE_KEY מוגדר ושיש מספיק TRX לעמלות' };
        }
        kingdom.usdtBalance = Math.max(0, (kingdom.usdtBalance ?? 0) - amount);
        kingdom.withdrawalPending = 0;
        kingdom.withdrawalStatus = 'approved';
        kingdom.withdrawalWallet = null;
        await this.kingdomRepo.save(kingdom);
        if (kingdom.user) {
            await this.notifService.create(kingdom.user.id, 'withdrawal_approved', {
                amount: amount.toFixed(4),
                language: kingdom.user.language,
            }).catch(() => { });
        }
        return { success: true, amount, wallet, txId: txResult.txId };
    }
    async rejectWithdrawal(headers, kingdomId, body) {
        this.guard(headers);
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId }, relations: ['user'] });
        if (!kingdom)
            return { error: 'Not found' };
        kingdom.withdrawalPending = 0;
        kingdom.withdrawalStatus = 'rejected';
        kingdom.withdrawalWallet = null;
        await this.kingdomRepo.save(kingdom);
        if (kingdom.user) {
            await this.notifService.create(kingdom.user.id, 'withdrawal_rejected', {
                reason: body.reason ? ': ' + body.reason : '',
                language: kingdom.user.language,
            }).catch(() => { });
        }
        return { success: true };
    }
    async giveVip(headers, telegramId, body) {
        this.guard(headers);
        return this.giveResource(telegramId, 'vip', body.days || game_constants_1.VIP_DURATION_DAYS);
    }
    async listUsers(headers) {
        this.guard(headers);
        const users = await this.userRepo.find({
            order: { createdAt: 'DESC' },
            take: 100,
        });
        const result = [];
        for (const u of users) {
            const k = await this.kingdomRepo.findOne({ where: { user: { id: u.id } } });
            const referredUsers = await this.userRepo.find({ where: { referredBy: { id: u.id } } });
            let activeReferrals = 0;
            for (const ru of referredUsers) {
                const rk = await this.kingdomRepo.findOne({ where: { user: { id: ru.id } } });
                if (rk && rk.score > 0)
                    activeReferrals++;
            }
            result.push({
                telegramId: u.telegramId,
                name: u.firstName || u.username,
                username: u.username || '',
                language: u.language,
                joined: u.createdAt,
                lastLogin: u.lastLogin,
                termsAccepted: !!u.termsAcceptedAt,
                kingdomName: k?.name ?? '—',
                score: k?.score ?? 0,
                gems: k?.gems ?? 0,
                gold: k?.gold ?? 0,
                wood: k?.wood ?? 0,
                stone: k?.stone ?? 0,
                food: k?.food ?? 0,
                usdtBalance: (k?.usdtBalance ?? 0).toFixed(4),
                isVip: !!(k?.vipExpiresAt && new Date() < new Date(k.vipExpiresAt)),
                vipUntil: k?.vipExpiresAt ?? null,
                referralsTotal: referredUsers.length,
                referralsActive: activeReferrals,
            });
        }
        return result;
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Headers)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "stats", null);
__decorate([
    (0, common_1.Post)('delete/:telegramId'),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Param)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Post)('ban/:telegramId'),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Param)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "banUser", null);
__decorate([
    (0, common_1.Post)('give-gems/:telegramId'),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Param)('telegramId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "giveGems", null);
__decorate([
    (0, common_1.Post)('take-resource/:telegramId'),
    __param(0, (0, common_1.Param)('telegramId')),
    __param(1, (0, common_1.Body)('type')),
    __param(2, (0, common_1.Body)('amount')),
    __param(3, (0, common_1.Headers)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "takeResource", null);
__decorate([
    (0, common_1.Post)('give-resource/:telegramId'),
    __param(0, (0, common_1.Param)('telegramId')),
    __param(1, (0, common_1.Body)('type')),
    __param(2, (0, common_1.Body)('amount')),
    __param(3, (0, common_1.Headers)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "giveResource", null);
__decorate([
    (0, common_1.Get)('wallet'),
    __param(0, (0, common_1.Headers)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getWallet", null);
__decorate([
    (0, common_1.Post)('wallet'),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateWallet", null);
__decorate([
    (0, common_1.Get)('wallet/balance'),
    __param(0, (0, common_1.Headers)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getWalletBalance", null);
__decorate([
    (0, common_1.Get)('withdrawals'),
    __param(0, (0, common_1.Headers)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingWithdrawals", null);
__decorate([
    (0, common_1.Post)('withdrawals/:kingdomId/approve'),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Param)('kingdomId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveWithdrawal", null);
__decorate([
    (0, common_1.Post)('withdrawals/:kingdomId/reject'),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Param)('kingdomId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectWithdrawal", null);
__decorate([
    (0, common_1.Post)('give-vip/:telegramId'),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Param)('telegramId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "giveVip", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Headers)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listUsers", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(kingdom_entity_1.Kingdom)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        notification_service_1.NotificationService,
        tron_service_1.TronService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map