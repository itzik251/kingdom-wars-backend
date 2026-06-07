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
const BUILDING_NAMES = {
    town_hall: { en: 'Town Hall', he: 'עירייה', es: 'Ayuntamiento', fr: 'Hôtel de ville', de: 'Rathaus', ru: 'Ратуша', pt: 'Prefeitura', ar: 'بيت المدينة' },
    gold_mine: { en: 'Gold Mine', he: 'מכרה זהב', es: 'Mina de oro', fr: 'Mine d\'or', de: 'Goldmine', ru: 'Золотая шахта', pt: 'Mina de ouro', ar: 'منجم الذهب' },
    lumber_mill: { en: 'Lumber Mill', he: 'נגרייה', es: 'Aserradero', fr: 'Scierie', de: 'Sägemühle', ru: 'Лесопилка', pt: 'Serraria', ar: 'مطحنة الخشب' },
    stone_quarry: { en: 'Stone Quarry', he: 'מחצבה', es: 'Cantera', fr: 'Carrière', de: 'Steinbruch', ru: 'Каменоломня', pt: 'Pedreira', ar: 'محجر الحجارة' },
    farm: { en: 'Farm', he: 'חווה', es: 'Granja', fr: 'Ferme', de: 'Bauernhof', ru: 'Ферма', pt: 'Fazenda', ar: 'مزرعة' },
    barracks: { en: 'Barracks', he: 'בסיס צבאי', es: 'Cuartel', fr: 'Caserne', de: 'Kaserne', ru: 'Казарма', pt: 'Quartel', ar: 'ثكنة' },
    academy: { en: 'Academy', he: 'אקדמיה', es: 'Academia', fr: 'Académie', de: 'Akademie', ru: 'Академия', pt: 'Academia', ar: 'الأكاديمية' },
    wall: { en: 'Wall', he: 'חומה', es: 'Muralla', fr: 'Rempart', de: 'Mauer', ru: 'Стена', pt: 'Muralha', ar: 'سور' },
    watch_tower: { en: 'Watch Tower', he: 'מגדל שמירה', es: 'Torre vigía', fr: 'Tour de guet', de: 'Wachturm', ru: 'Сторожевая башня', pt: 'Torre de guarda', ar: 'برج المراقبة' },
    hospital: { en: 'Hospital', he: 'בית חולים', es: 'Hospital', fr: 'Hôpital', de: 'Krankenhaus', ru: 'Больница', pt: 'Hospital', ar: 'مستشفى' },
    arcane_tower: { en: 'Arcane Tower', he: 'מגדל ארקני', es: 'Torre arcana', fr: 'Tour arcanique', de: 'Arkaner Turm', ru: 'Аркановая башня', pt: 'Torre arcana', ar: 'برج السحر' },
};
const UNIT_NAMES = {
    spearman: { en: 'Spearmen', he: 'חניתנים', es: 'Lanceros', fr: 'Lanciers', de: 'Speerträger', ru: 'Копейщики', pt: 'Lanceiros', ar: 'رماة الرماح' },
    archer: { en: 'Archers', he: 'קשתים', es: 'Arqueros', fr: 'Archers', de: 'Bogenschützen', ru: 'Лучники', pt: 'Arqueiros', ar: 'رماة' },
    swordsman: { en: 'Swordsmen', he: 'חרבנים', es: 'Espadachines', fr: 'Épéistes', de: 'Schwertkämpfer', ru: 'Мечники', pt: 'Espadachins', ar: 'السيافون' },
    cavalry: { en: 'Cavalry', he: 'פרשים', es: 'Caballería', fr: 'Cavalerie', de: 'Kavallerie', ru: 'Кавалерия', pt: 'Cavalaria', ar: 'الفرسان' },
    catapult: { en: 'Catapults', he: 'קטפולטות', es: 'Catapultas', fr: 'Catapultes', de: 'Katapulte', ru: 'Катапульты', pt: 'Catapultas', ar: 'المنجنيق' },
    elite_guard: { en: 'Elite Guards', he: 'שומרי עילית', es: 'Guardias élite', fr: 'Gardes d\'élite', de: 'Elitegarden', ru: 'Элитная стража', pt: 'Guardas de elite', ar: 'الحرس النخبوي' },
    paladin: { en: 'Paladins', he: 'פלדינים', es: 'Paladines', fr: 'Paladins', de: 'Paladine', ru: 'Паладины', pt: 'Paladinos', ar: 'الفرسان المقدسون' },
    dragon_rider: { en: 'Dragon Riders', he: 'רוכבי דרקון', es: 'Jinetes dragón', fr: 'Cavaliers dragons', de: 'Drachenreiter', ru: 'Всадники дракона', pt: 'Cavaleiros dragão', ar: 'راكبو التنانين' },
};
function translateBuilding(type, lang) {
    return BUILDING_NAMES[type]?.[lang] ?? BUILDING_NAMES[type]?.['en'] ?? type;
}
function translateUnit(type, lang) {
    return UNIT_NAMES[type]?.[lang] ?? UNIT_NAMES[type]?.['en'] ?? type;
}
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
        en: '🏗️ {building} ×{count} completed — Level {level}',
        he: '🏗️ {building} ×{count} הושלם — רמה {level}',
        es: '🏗️ {building} ×{count} completado — Nivel {level}',
        fr: '🏗️ {building} ×{count} terminé — Niveau {level}',
        de: '🏗️ {building} ×{count} abgeschlossen — Stufe {level}',
        ru: '🏗️ {building} ×{count} завершено — Уровень {level}',
        pt: '🏗️ {building} ×{count} concluído — Nível {level}',
        ar: '🏗️ اكتمل {building} ×{count} — المستوى {level}',
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
    admin_gift: {
        en: '🎁 You received a gift from the admin: {label}!',
        he: '🎁 קיבלת מתנה מהאדמין: {label}!',
        es: '🎁 ¡Recibiste un regalo del admin: {label}!',
        fr: '🎁 Vous avez reçu un cadeau de l\'admin: {label}!',
        de: '🎁 Du hast ein Geschenk vom Admin erhalten: {label}!',
        ru: '🎁 Вы получили подарок от администратора: {label}!',
        pt: '🎁 Você recebeu um presente do admin: {label}!',
        ar: '🎁 تلقيت هدية من الإدارة: {label}!',
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
    let result = Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), template);
    result = result.replace(' ×1', '');
    return result;
}
let NotificationService = class NotificationService {
    constructor(notifRepo, userRepo, config) {
        this.notifRepo = notifRepo;
        this.userRepo = userRepo;
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
        const translatedPayload = {
            ...payload,
            building: payload.building ? translateBuilding(payload.building, lang) : undefined,
            unit: payload.unit ? translateUnit(payload.unit, lang) : undefined,
        };
        const text = formatMessage(msgTemplates[lang] ?? msgTemplates['en'], translatedPayload);
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