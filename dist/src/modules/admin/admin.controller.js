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
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../user/user.entity");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const config_1 = require("@nestjs/config");
let AdminController = class AdminController {
    constructor(userRepo, kingdomRepo, config) {
        this.userRepo = userRepo;
        this.kingdomRepo = kingdomRepo;
        this.config = config;
    }
    dashboard(res) {
        res.sendFile((0, path_1.join)(__dirname, 'admin-dashboard.html'));
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
        return {
            totalUsers,
            totalKingdoms,
            activeUsers7d: activeUsers,
            newUsersToday: newToday,
            totalGemsInGame: parseInt(gemsResult?.total || '0'),
            topKingdoms: topKingdoms.map(k => ({
                name: k.name,
                score: k.score,
                gems: k.gems,
                gold: k.gold,
                username: k.user?.username || k.user?.firstName,
            })),
        };
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
        const user = await this.userRepo.findOne({ where: { telegramId } });
        if (!user)
            return { error: 'User not found' };
        const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: user.id } } });
        if (!kingdom)
            return { error: 'Kingdom not found' };
        kingdom.gems += body.gems;
        await this.kingdomRepo.save(kingdom);
        return { success: true, newGems: kingdom.gems };
    }
    async listUsers(headers) {
        this.guard(headers);
        const users = await this.userRepo.find({
            order: { createdAt: 'DESC' },
            take: 50,
            relations: [],
        });
        const result = [];
        for (const u of users) {
            const k = await this.kingdomRepo.findOne({ where: { user: { id: u.id } } });
            result.push({
                telegramId: u.telegramId,
                name: u.firstName || u.username,
                language: u.language,
                joined: u.createdAt,
                lastLogin: u.lastLogin,
                termsAccepted: !!u.termsAcceptedAt,
                score: k?.score ?? 0,
                gems: k?.gems ?? 0,
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
        config_1.ConfigService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map