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
const ton_service_1 = require("../ton/ton.service");
const cryptobot_service_1 = require("../cryptobot/cryptobot.service");
const antibot_service_1 = require("../antibot/antibot.service");
const game_constants_1 = require("../../constants/game.constants");
const WALLET_CFG_PATH = (0, path_1.resolve)(process.cwd(), 'wallet_config.json');
let AdminController = class AdminController {
    constructor(userRepo, kingdomRepo, config, notifService, tonService, cryptoBotService, antiBotService) {
        this.userRepo = userRepo;
        this.kingdomRepo = kingdomRepo;
        this.config = config;
        this.notifService = notifService;
        this.tonService = tonService;
        this.cryptoBotService = cryptoBotService;
        this.antiBotService = antiBotService;
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
        const secret = this.config.get('ADMIN_SECRET');
        if (!secret)
            throw new common_1.UnauthorizedException('Admin access not configured');
        const provided = headers['x-admin-secret'] || '';
        const crypto = require('crypto');
        const secretBuf = Buffer.from(secret);
        const providedBuf = Buffer.from(provided.padEnd(secret.length, '\0').slice(0, Math.max(secret.length, provided.length)));
        if (secretBuf.length !== providedBuf.length || !crypto.timingSafeEqual(secretBuf, providedBuf)) {
            throw new common_1.UnauthorizedException('Forbidden');
        }
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
        return this.giveResource(telegramId, 'gems', body.gems, headers);
    }
    async takeResource(telegramId, type, amount, headers) {
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
            kingdom.usdtBalance = parseFloat(Math.max(0, (kingdom.usdtBalance || 0) + amount).toFixed(6));
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
        const cryptoBalance = await this.cryptoBotService.getBalance();
        const result = {
            usdtBalance: parseFloat(cryptoBalance['USDT'] || '0'),
            tonBalance: parseFloat(cryptoBalance['TON'] || '0'),
            source: 'CryptoBot',
            network: 'TON/CryptoBot',
        };
        const cfg = this.getWalletConfig();
        if (cfg.address && this.tonService.isValidAddress(cfg.address)) {
            const [chainUsdt, chainTon] = await Promise.all([
                this.tonService.getUsdtBalance(cfg.address),
                this.tonService.getTonBalance(cfg.address),
            ]);
            result.chainAddress = cfg.address;
            result.chainUsdtBalance = chainUsdt;
            result.chainTonBalance = chainTon;
        }
        return result;
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
        if (kingdom.withdrawalStatus !== 'pending' && kingdom.withdrawalStatus !== 'processing')
            return { error: 'Not pending' };
        if (kingdom.withdrawalStatus === 'processing')
            return { error: 'Already being processed' };
        const amount = kingdom.withdrawalPending;
        const wallet = kingdom.withdrawalWallet;
        kingdom.withdrawalStatus = 'processing';
        await this.kingdomRepo.save(kingdom);
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
        return { success: true, amount, wallet, note: `שלח ידנית ${amount} USDT-TON ל: ${wallet}` };
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
        return this.giveResource(telegramId, 'vip', body.days || game_constants_1.VIP_DURATION_DAYS, headers);
    }
    async removeVip(headers, telegramId) {
        this.guard(headers);
        const user = await this.userRepo.findOne({ where: { telegramId } });
        if (!user)
            return { error: 'User not found' };
        const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: user.id } } });
        if (!kingdom)
            return { error: 'Kingdom not found' };
        kingdom.vipExpiresAt = null;
        await this.kingdomRepo.save(kingdom);
        return { success: true };
    }
    async listUsers(headers) {
        this.guard(headers);
        const users = await this.userRepo.find({ order: { createdAt: 'DESC' }, take: 100 });
        const userIds = users.map(u => u.id);
        const kingdoms = userIds.length
            ? await this.kingdomRepo
                .createQueryBuilder('k')
                .select(['k', 'u.id'])
                .innerJoin('k.user', 'u')
                .where('u.id IN (:...ids)', { ids: userIds })
                .getMany()
            : [];
        const kingdomMap = new Map(kingdoms.map(k => [k.user?.id, k]));
        const totalRefRows = userIds.length
            ? await this.userRepo
                .createQueryBuilder('u')
                .select('u.referredBy', 'referrerId')
                .addSelect('COUNT(*)', 'cnt')
                .where('u.referredBy IN (:...ids)', { ids: userIds })
                .groupBy('u.referredBy')
                .getRawMany()
            : [];
        const totalRefMap = new Map(totalRefRows.map((r) => [r.referrerId, parseInt(r.cnt)]));
        const activeRefRows = userIds.length
            ? await this.kingdomRepo
                .createQueryBuilder('k')
                .innerJoin('k.user', 'u')
                .select('u.referredBy', 'referrerId')
                .addSelect('COUNT(*)', 'cnt')
                .where('u.referredBy IN (:...ids)', { ids: userIds })
                .andWhere('k.score > 0')
                .groupBy('u.referredBy')
                .getRawMany()
            : [];
        const activeRefMap = new Map(activeRefRows.map((r) => [r.referrerId, parseInt(r.cnt)]));
        const now = new Date();
        return users.map(u => {
            const k = kingdomMap.get(u.id);
            return {
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
                isVip: !!(k?.vipExpiresAt && now < new Date(k.vipExpiresAt)),
                vipUntil: k?.vipExpiresAt ?? null,
                referralsTotal: totalRefMap.get(u.id) ?? 0,
                referralsActive: activeRefMap.get(u.id) ?? 0,
            };
        });
    }
    async getUserReferrals(headers, telegramId) {
        this.guard(headers);
        const referrer = await this.userRepo.findOne({ where: { telegramId } });
        if (!referrer)
            return [];
        const referred = await this.userRepo.find({ where: { referredBy: { id: referrer.id } }, order: { createdAt: 'DESC' } });
        if (!referred.length)
            return [];
        const kingdomRows = await this.kingdomRepo
            .createQueryBuilder('k')
            .innerJoin('k.user', 'u')
            .select('u.id', 'userId')
            .addSelect('k.score', 'score')
            .where('u.id IN (:...ids)', { ids: referred.map(u => u.id) })
            .getRawMany();
        const scoreMap = new Map(kingdomRows.map((r) => [r.userId, Number(r.score ?? 0)]));
        return referred.map(u => {
            const score = scoreMap.get(u.id) ?? 0;
            return {
                telegramId: u.telegramId,
                username: u.username || u.firstName,
                joinedAt: u.createdAt,
                score,
                active: score > 0,
            };
        });
    }
    async getAntiBotStatus(headers, telegramId) {
        this.guard(headers);
        const user = await this.userRepo.findOne({ where: { telegramId } });
        if (!user)
            return { error: 'User not found' };
        return this.antiBotService.getBanStatus(user.id);
    }
    async antiBotBan(headers, telegramId, body) {
        this.guard(headers);
        const user = await this.userRepo.findOne({ where: { telegramId } });
        if (!user)
            return { error: 'User not found' };
        const hours = body.hours ?? 24;
        await this.antiBotService.banUser(user.id, hours, body.reason || 'admin manual ban');
        return { success: true, bannedFor: `${hours}h`, userId: user.id };
    }
    async antiBotUnban(headers, telegramId) {
        this.guard(headers);
        const user = await this.userRepo.findOne({ where: { telegramId } });
        if (!user)
            return { error: 'User not found' };
        await this.antiBotService.unbanUser(user.id);
        return { success: true };
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
    (0, common_1.Post)('remove-vip/:telegramId'),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Param)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "removeVip", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Headers)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Get)('users/:telegramId/referrals'),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Param)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserReferrals", null);
__decorate([
    (0, common_1.Get)('antibot/status/:telegramId'),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Param)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAntiBotStatus", null);
__decorate([
    (0, common_1.Post)('antibot/ban/:telegramId'),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Param)('telegramId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "antiBotBan", null);
__decorate([
    (0, common_1.Post)('antibot/unban/:telegramId'),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Param)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "antiBotUnban", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(kingdom_entity_1.Kingdom)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        notification_service_1.NotificationService,
        ton_service_1.TonService,
        cryptobot_service_1.CryptoBotService,
        antibot_service_1.AntiBotService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map