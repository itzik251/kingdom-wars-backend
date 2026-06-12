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
var AntiBotService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AntiBotService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const ACTION_LIMITS = {
    'ads_reward': [10, 60, 15],
    'combat_attack': [20, 60, 8],
    'building_upgrade': [15, 60, 5],
    'units_train': [15, 60, 5],
    'auth_login': [10, 60, 20],
    'default': [60, 60, 2],
};
const TEMP_BAN_SCORE = 50;
const PERM_BAN_SCORE = 200;
const SCORE_DECAY_RATE = 1;
let AntiBotService = AntiBotService_1 = class AntiBotService {
    constructor(dataSource) {
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(AntiBotService_1.name);
        this.windows = new Map();
        this.banCache = new Map();
    }
    async onApplicationBootstrap() {
        await this.initBanTable();
    }
    async initBanTable() {
        await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS antibot_bans (
        user_id    VARCHAR(36) PRIMARY KEY,
        banned_until TIMESTAMPTZ NOT NULL,
        reason     TEXT,
        score      INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `).catch(() => { });
        const bans = await this.dataSource.query(`SELECT user_id, EXTRACT(EPOCH FROM banned_until)*1000 as banned_ms FROM antibot_bans WHERE banned_until > NOW()`).catch(() => []);
        for (const row of bans) {
            this.banCache.set(row.user_id, parseFloat(row.banned_ms));
        }
        this.logger.log(`Loaded ${bans.length} active bans`);
    }
    check(userId, action, ip) {
        const now = Date.now();
        const bannedUntil = this.banCache.get(userId);
        if (bannedUntil && now < bannedUntil) {
            const retryAfter = Math.ceil((bannedUntil - now) / 1000);
            return { allowed: false, reason: 'BANNED', retryAfter };
        }
        if (bannedUntil && now >= bannedUntil) {
            this.banCache.delete(userId);
        }
        if (!this.windows.has(userId))
            this.windows.set(userId, new Map());
        const userMap = this.windows.get(userId);
        if (!userMap.has(action)) {
            userMap.set(action, { timestamps: [], failCount: 0, abuseScore: 0, lastSeen: now });
        }
        const win = userMap.get(action);
        win.lastSeen = now;
        const [maxReq, windowSec, violationScore] = ACTION_LIMITS[action] ?? ACTION_LIMITS['default'];
        const windowMs = windowSec * 1000;
        win.timestamps = win.timestamps.filter(t => now - t < windowMs);
        win.timestamps.push(now);
        if (win.timestamps.length > maxReq) {
            win.abuseScore += violationScore;
            this.logger.warn(`Rate exceeded: user=${userId} action=${action} req=${win.timestamps.length}/${maxReq} score=${win.abuseScore}`);
            this.maybeBan(userId, win);
            const retryAfter = Math.ceil((win.timestamps[0] + windowMs - now) / 1000);
            return { allowed: false, reason: 'RATE_LIMIT', retryAfter };
        }
        if (win.timestamps.length >= 5) {
            const botScore = this.analyzeBotPattern(win.timestamps);
            if (botScore > 0) {
                win.abuseScore += botScore;
                if (botScore >= 5) {
                    this.logger.warn(`Bot pattern: user=${userId} action=${action} patternScore=${botScore} totalScore=${win.abuseScore}`);
                }
                this.maybeBan(userId, win);
            }
        }
        return { allowed: true };
    }
    recordFailure(userId, action, severity = 'low') {
        const scoreMap = { low: 2, medium: 8, high: 25 };
        if (!this.windows.has(userId))
            this.windows.set(userId, new Map());
        const userMap = this.windows.get(userId);
        if (!userMap.has(action)) {
            userMap.set(action, { timestamps: [], failCount: 0, abuseScore: 0, lastSeen: Date.now() });
        }
        const win = userMap.get(action);
        win.failCount++;
        win.abuseScore += scoreMap[severity];
        this.maybeBan(userId, win);
    }
    analyzeBotPattern(timestamps) {
        if (timestamps.length < 3)
            return 0;
        let score = 0;
        const intervals = [];
        for (let i = 1; i < timestamps.length; i++) {
            intervals.push(timestamps[i] - timestamps[i - 1]);
        }
        const tooFast = intervals.filter(i => i < 500).length;
        if (tooFast >= 3)
            score += tooFast * 2;
        if (intervals.length >= 4) {
            const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const variance = intervals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / intervals.length;
            const stdDev = Math.sqrt(variance);
            const cv = stdDev / avg;
            if (cv < 0.1 && intervals.length >= 5 && avg < 5000) {
                score += 10;
            }
        }
        const recentMs = timestamps[timestamps.length - 1] - timestamps[Math.max(0, timestamps.length - 5)];
        if (timestamps.length >= 5 && recentMs < 2000) {
            score += 5;
        }
        return score;
    }
    maybeBan(userId, win) {
        const now = Date.now();
        if (win.abuseScore >= PERM_BAN_SCORE) {
            const duration = 24 * 3600 * 1000;
            const bannedUntil = now + duration;
            this.banCache.set(userId, bannedUntil);
            this.saveBan(userId, bannedUntil, win.abuseScore, '24h auto-ban: abuse score exceeded');
            this.logger.error(`24h BAN: user=${userId} score=${win.abuseScore}`);
        }
        else if (win.abuseScore >= TEMP_BAN_SCORE) {
            const duration = 5 * 60 * 1000;
            const bannedUntil = now + duration;
            this.banCache.set(userId, bannedUntil);
            this.saveBan(userId, bannedUntil, win.abuseScore, '5min auto-ban: abuse score exceeded');
            this.logger.warn(`5min BAN: user=${userId} score=${win.abuseScore}`);
        }
    }
    async saveBan(userId, bannedUntil, score, reason) {
        const dt = new Date(bannedUntil).toISOString();
        await this.dataSource.query(`INSERT INTO antibot_bans(user_id, banned_until, reason, score)
       VALUES($1, $2, $3, $4)
       ON CONFLICT(user_id) DO UPDATE SET banned_until=$2, reason=$3, score=$4, created_at=NOW()`, [userId, dt, reason, score]).catch(() => { });
    }
    async banUser(userId, hours, reason) {
        const bannedUntil = Date.now() + hours * 3600 * 1000;
        this.banCache.set(userId, bannedUntil);
        this.saveBan(userId, bannedUntil, 999, reason);
    }
    async unbanUser(userId) {
        this.banCache.delete(userId);
        this.windows.delete(userId);
        await this.dataSource.query(`DELETE FROM antibot_bans WHERE user_id = $1`, [userId]).catch(() => { });
    }
    async getBanStatus(userId) {
        const bannedUntil = this.banCache.get(userId);
        const win = this.windows.get(userId);
        const totalScore = win
            ? Array.from(win.values()).reduce((s, w) => s + w.abuseScore, 0)
            : 0;
        return {
            isBanned: !!(bannedUntil && Date.now() < bannedUntil),
            bannedUntil: bannedUntil ? new Date(bannedUntil) : null,
            abuseScore: totalScore,
        };
    }
    cleanup() {
        const now = Date.now();
        const staleMs = 10 * 60 * 1000;
        for (const [userId, userMap] of this.windows) {
            for (const [action, win] of userMap) {
                if (win.abuseScore > 0) {
                    win.abuseScore = Math.max(0, win.abuseScore - SCORE_DECAY_RATE);
                }
                if (now - win.lastSeen > staleMs) {
                    userMap.delete(action);
                }
            }
            if (userMap.size === 0) {
                this.windows.delete(userId);
            }
        }
    }
};
exports.AntiBotService = AntiBotService;
__decorate([
    (0, schedule_1.Cron)('* * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AntiBotService.prototype, "cleanup", null);
exports.AntiBotService = AntiBotService = AntiBotService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], AntiBotService);
//# sourceMappingURL=antibot.service.js.map