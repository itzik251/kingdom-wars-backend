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
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("./notification.entity");
const config_1 = require("@nestjs/config");
let NotificationService = class NotificationService {
    constructor(notifRepo, config) {
        this.notifRepo = notifRepo;
        this.config = config;
        this.recentSends = new Map();
    }
    async create(userId, type, payload) {
        const notif = this.notifRepo.create({ user: { id: userId }, type, payload });
        await this.notifRepo.save(notif);
        this.sendTelegram(userId, type, payload).catch(() => { });
        return notif;
    }
    async getUnread(userId) {
        return this.notifRepo.find({
            where: { user: { id: userId }, read: false },
            order: { createdAt: 'DESC' },
            take: 20,
        });
    }
    async markRead(userId) {
        await this.notifRepo
            .createQueryBuilder()
            .update()
            .set({ read: true })
            .where('user_id = :userId AND read = 0', { userId })
            .execute();
    }
    async sendTelegram(userId, type, payload) {
        const key = `${userId}:${type}`;
        const lastSent = this.recentSends.get(key) ?? 0;
        if (Date.now() - lastSent < 10_000)
            return;
        this.recentSends.set(key, Date.now());
        const botToken = this.config.get('TELEGRAM_BOT_TOKEN');
        if (!botToken || botToken === 'dev_token')
            return;
        const telegramId = payload.telegramId;
        if (!telegramId)
            return;
        const attackedMsg = payload.won
            ? `⚔️ הממלכה שלך הותקפה ונשדדה!\n👤 ${payload.attackerName}\n💰 ${payload.gold || 0} זהב | 🪵 ${payload.wood || 0} עץ | 🪨 ${payload.stone || 0} אבן${payload.buildingDamaged ? `\n💥 ${payload.buildingDamaged} נפגע!` : ''}`
            : `🛡️ תקיפה נהדפה!\n👤 ${payload.attackerName} ניסה לתקוף אותך ונכשל`;
        const messages = {
            attacked: attackedMsg,
            shield_expired: '🛡️ המגן שלך פג! עכשיו אתה חשוף לתקיפות',
            build_done: `🏗️ ${payload.building} הושלם — רמה ${payload.level}`,
            training_done: `⚔️ אימון הושלם — ${payload.count} ${payload.unit} מוכנים`,
        };
        const text = messages[type] || `📢 ${type}`;
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: telegramId,
                text,
                reply_markup: {
                    inline_keyboard: [[{ text: '🏰 פתח את המשחק', url: `https://t.me/${this.config.get('TELEGRAM_BOT_USERNAME') || 'KingdomWarsBot'}` }]],
                },
            }),
        });
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map