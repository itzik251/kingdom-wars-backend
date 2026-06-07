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
const user_entity_1 = require("../user/user.entity");
const MESSAGES = {
    attacked: {
        en: '⚔️ Your kingdom was attacked! {attackerName} looted {gold} gold',
        he: '⚔️ הממלכה שלך הותקפה! {attackerName} בזז {gold} זהב',
        es: '⚔️ ¡Tu reino fue atacado! {attackerName} saqueó {gold} de oro',
        fr: '⚔️ Votre royaume a été attaqué! {attackerName} a pillé {gold} or',
        de: '⚔️ Dein Königreich wurde angegriffen! {attackerName} plünderte {gold} Gold',
        ru: '⚔️ Ваше королевство атаковано! {attackerName} разграбил {gold} золота',
        pt: '⚔️ Seu reino foi atacado! {attackerName} saqueou {gold} de ouro',
        ar: '⚔️ تعرضت مملكتك للهجوم! {attackerName} نهب {gold} ذهباً',
    },
    shield_expired: {
        en: '🛡️ Your shield has expired! You are now vulnerable to attacks',
        he: '🛡️ המגן שלך פג! עכשיו אתה חשוף לתקיפות',
        es: '🛡️ ¡Tu escudo ha expirado! Ahora eres vulnerable a los ataques',
        fr: '🛡️ Votre bouclier a expiré! Vous êtes maintenant vulnérable aux attaques',
        de: '🛡️ Dein Schild ist abgelaufen! Du bist jetzt anfällig für Angriffe',
        ru: '🛡️ Ваш щит истёк! Вы уязвимы для атак',
        pt: '🛡️ Seu escudo expirou! Agora você está vulnerável a ataques',
        ar: '🛡️ انتهت صلاحية درعك! أنت الآن عرضة للهجمات',
    },
    build_done: {
        en: '🏗️ {building} completed — Level {level}',
        he: '🏗️ {building} הושלם — רמה {level}',
        es: '🏗️ {building} completado — Nivel {level}',
        fr: '🏗️ {building} terminé — Niveau {level}',
        de: '🏗️ {building} abgeschlossen — Stufe {level}',
        ru: '🏗️ {building} завершено — Уровень {level}',
        pt: '🏗️ {building} concluído — Nível {level}',
        ar: '🏗️ اكتمل {building} — المستوى {level}',
    },
    training_done: {
        en: '⚔️ Training complete — {count} {unit} ready for battle',
        he: '⚔️ אימון הושלם — {count} {unit} מוכנים לקרב',
        es: '⚔️ Entrenamiento completado — {count} {unit} listos para la batalla',
        fr: '⚔️ Entraînement terminé — {count} {unit} prêts pour la bataille',
        de: '⚔️ Training abgeschlossen — {count} {unit} bereit für den Kampf',
        ru: '⚔️ Обучение завершено — {count} {unit} готовы к бою',
        pt: '⚔️ Treinamento concluído — {count} {unit} prontos para batalha',
        ar: '⚔️ اكتمل التدريب — {count} {unit} جاهزون للقتال',
    },
};
const OPEN_GAME = {
    en: '🏰 Open Kingdom Wars',
    he: '🏰 פתח את Kingdom Wars',
    es: '🏰 Abrir Kingdom Wars',
    fr: '🏰 Ouvrir Kingdom Wars',
    de: '🏰 Kingdom Wars öffnen',
    ru: '🏰 Открыть Kingdom Wars',
    pt: '🏰 Abrir Kingdom Wars',
    ar: '🏰 افتح Kingdom Wars',
};
function formatMessage(template, vars) {
    return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), template);
}
let NotificationService = class NotificationService {
    constructor(notifRepo, userRepo, config) {
        this.notifRepo = notifRepo;
        this.userRepo = userRepo;
        this.config = config;
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
        const botToken = this.config.get('TELEGRAM_BOT_TOKEN');
        if (!botToken || botToken === 'dev_token')
            return;
        let telegramId = payload.telegramId;
        let lang = payload.language || 'en';
        if (!telegramId) {
            const user = await this.userRepo.findOne({ where: { id: userId } });
            if (!user?.telegramId)
                return;
            telegramId = user.telegramId;
            lang = user.language || 'en';
        }
        const VALID = ['en', 'he', 'es', 'fr', 'de', 'ru', 'pt', 'ar'];
        if (!VALID.includes(lang))
            lang = 'en';
        const msgTemplates = MESSAGES[type];
        if (!msgTemplates)
            return;
        const text = formatMessage(msgTemplates[lang] ?? msgTemplates['en'], payload);
        const botUsername = this.config.get('TELEGRAM_BOT_USERNAME') || 'KingdomWarsBot';
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: telegramId,
                text,
                reply_markup: {
                    inline_keyboard: [[{
                                text: OPEN_GAME[lang] ?? OPEN_GAME['en'],
                                url: `https://t.me/${botUsername}`,
                            }]],
                },
            }),
        });
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map