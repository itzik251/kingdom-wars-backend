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
exports.LeaderboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
let LeaderboardService = class LeaderboardService {
    constructor(kingdomRepo) {
        this.kingdomRepo = kingdomRepo;
    }
    async getWeeklyTop(limit = 20) {
        const rows = await this.kingdomRepo
            .createQueryBuilder('k')
            .leftJoinAndSelect('k.user', 'u')
            .select(['k.id', 'k.name', 'k.score', 'k.winStreak', 'u.username', 'u.firstName'])
            .where('k.win_streak > 0')
            .orderBy('k.win_streak', 'DESC')
            .addOrderBy('k.score', 'DESC')
            .limit(limit)
            .getMany();
        const now = new Date();
        const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
        const resetDate = new Date(now);
        resetDate.setDate(now.getDate() + daysUntilMonday);
        resetDate.setHours(0, 0, 0, 0);
        return {
            resetAt: resetDate,
            entries: rows.map((k, i) => ({
                rank: i + 1,
                kingdomName: k.name,
                username: k.user?.username || k.user?.firstName,
                winStreak: k.winStreak,
                score: k.score,
            })),
        };
    }
    async getTop(limit = 50) {
        const rows = await this.kingdomRepo
            .createQueryBuilder('k')
            .leftJoinAndSelect('k.user', 'u')
            .select([
            'k.id', 'k.name', 'k.score', 'k.shieldUntil', 'k.usdtBalance', 'k.gameBalance',
            'u.username', 'u.firstName', 'u.avatarUrl',
        ])
            .orderBy('k.score', 'DESC')
            .limit(limit)
            .getMany();
        const now = new Date();
        return rows.map((k, i) => ({
            id: k.id,
            rank: i + 1,
            kingdomName: k.name,
            username: k.user?.username || k.user?.firstName || null,
            avatarUrl: k.user?.avatarUrl || null,
            score: k.score,
            isShielded: !!(k.shieldUntil && now < new Date(k.shieldUntil)),
            shieldUntil: k.shieldUntil || null,
            usdtBalance: k.usdtBalance ?? 0,
            gameBalance: k.gameBalance ?? 0,
        }));
    }
};
exports.LeaderboardService = LeaderboardService;
exports.LeaderboardService = LeaderboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(kingdom_entity_1.Kingdom)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], LeaderboardService);
//# sourceMappingURL=leaderboard.service.js.map