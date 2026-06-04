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
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../user/user.entity");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");

let AdminController = class AdminController {
    constructor(userRepo, kingdomRepo) {
        this.userRepo = userRepo;
        this.kingdomRepo = kingdomRepo;
    }
    checkAdmin(req) {
        const key = req.headers['x-admin-key'];
        if (!key || key !== process.env.ADMIN_KEY) throw new common_1.HttpException('Unauthorized', 401);
    }
    async getStats(req) {
        this.checkAdmin(req);
        const now = new Date();
        const today = new Date(now); today.setHours(0,0,0,0);
        const week = new Date(now); week.setDate(week.getDate() - 7);
        const [totalUsers, totalKingdoms, vipUsers] = await Promise.all([
            this.userRepo.count(),
            this.kingdomRepo.count(),
            this.kingdomRepo.count({ where: { vipExpiresAt: (0, typeorm_2.MoreThan)(now) } }),
        ]);
        const activeToday = await this.userRepo.count({ where: { lastLogin: (0, typeorm_2.MoreThan)(today) } });
        const activeWeek = await this.userRepo.count({ where: { lastLogin: (0, typeorm_2.MoreThan)(week) } });
        const topKingdoms = await this.kingdomRepo.find({ order: { score: 'DESC' }, take: 10, relations: ['user'] });
        return {
            totalUsers, totalKingdoms, vipUsers,
            activeToday, activeWeek,
            topKingdoms: topKingdoms.map(k => ({
                name: k.name, score: k.score,
                username: k.user?.username || k.user?.firstName,
                isVip: !!(k.vipExpiresAt && new Date() < new Date(k.vipExpiresAt)),
            })),
        };
    }
    async giveVip(req, userId) {
        this.checkAdmin(req);
        const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: userId } } });
        if (!kingdom) throw new common_1.HttpException('User not found', 404);
        const expires = new Date(); expires.setDate(expires.getDate() + 30);
        kingdom.vipExpiresAt = expires;
        await this.kingdomRepo.save(kingdom);
        return { ok: true, expiresAt: expires };
    }
    async giveGems(req, userId, gems) {
        this.checkAdmin(req);
        const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: userId } } });
        if (!kingdom) throw new common_1.HttpException('User not found', 404);
        kingdom.gems += Number(gems);
        await this.kingdomRepo.save(kingdom);
        return { ok: true, newGems: kingdom.gems };
    }
};
exports.AdminController = AdminController;
__decorate([(0, common_1.Get)('stats'), __param(0, (0, common_1.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", Promise)], AdminController.prototype, "getStats", null);
__decorate([(0, common_1.Post)('vip/:userId'), __param(0, (0, common_1.Request)()), __param(1, (0, common_1.Param)('userId')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String]), __metadata("design:returntype", Promise)], AdminController.prototype, "giveVip", null);
__decorate([(0, common_1.Post)('gems/:userId/:gems'), __param(0, (0, common_1.Request)()), __param(1, (0, common_1.Param)('userId')), __param(2, (0, common_1.Param)('gems')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String, Number]), __metadata("design:returntype", Promise)], AdminController.prototype, "giveGems", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [typeorm_2.Repository, typeorm_2.Repository])
], AdminController);
