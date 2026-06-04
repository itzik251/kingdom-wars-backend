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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let TelegramService = class TelegramService {
    constructor(config) {
        this.config = config;
        this.token = config.get('TELEGRAM_BOT_TOKEN');
        this.apiBase = `https://api.telegram.org/bot${this.token}`;
    }
    async sendMessage(chatId, text, extra) {
        if (!this.token || this.token === 'dev_token')
            return;
        await fetch(`${this.apiBase}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...extra }),
        });
    }
    async handleUpdate(update) {
        const msg = update.message;
        if (!msg?.text)
            return;
        const chatId = msg.chat.id;
        const text = msg.text;
        // Always use the Railway URL — the correct production webapp URL
        const miniAppUrl = 'https://kingdom-wars-backend-production.up.railway.app';
        // Normalize command: strip @BotName suffix and lowercase
        const cmd = text.split('@')[0].toLowerCase();
        if (cmd.startsWith('/start')) {
            const parts = text.split(' ');
            const param = parts[1] || '';
            await this.sendMessage(chatId, `⚔️ <b>ברוך הבא ל-Kingdom Wars!</b>\n\n` +
                `🏰 בנה ממלכה\n` +
                `⚔️ גייס צבא\n` +
                `🗡️ תקוף שחקנים\n` +
                `🏆 עלה בדירוג\n\n` +
                `לחץ על הכפתור כדי להתחיל!`, {
                reply_markup: {
                    inline_keyboard: [[
                            {
                                text: '🏰 פתח את Kingdom Wars',
                                web_app: { url: param ? `${miniAppUrl}?startapp=${param.replace('ref_', 'ref_')}` : miniAppUrl },
                            },
                        ]],
                },
            });
        }
        else if (cmd === '/help') {
            await this.sendMessage(chatId,
                `⚔️ <b>Kingdom Wars — פקודות</b>\n\n` +
                `/start — התחל לשחק\n` +
                `/kingdom — פתח ממלכה\n` +
                `/leaderboard — דירוג עולמי\n` +
                `/referral — הזמן חברים\n` +
                `/help — הצג עזרה`);
        }
        else if (cmd === '/kingdom') {
            await this.sendMessage(chatId, '🏰 פתח את המשחק כדי לראות את הממלכה שלך:', {
                reply_markup: {
                    inline_keyboard: [[{ text: '🏰 פתח', web_app: { url: miniAppUrl } }]],
                },
            });
        }
        else if (cmd === '/leaderboard') {
            await this.sendMessage(chatId, '🏆 ראה את הדירוג העולמי:', {
                reply_markup: {
                    inline_keyboard: [[{ text: '🏆 דירוג', web_app: { url: miniAppUrl } }]],
                },
            });
        }
        else if (cmd === '/referral') {
            await this.sendMessage(chatId, '🔗 הזמן חברים וקבל פרסים!\nפתח את המשחק לקישור האישי שלך:', {
                reply_markup: {
                    inline_keyboard: [[{ text: '🔗 הזמן חברים', web_app: { url: miniAppUrl } }]],
                },
            });
        }
    }
    async getDebugInfo() {
        const rawUrl = this.config.get('MINI_APP_URL') || '(not set)';
        const menuBtnRes = await fetch(`${this.apiBase}/getChatMenuButton`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) }).then(r => r.json()).catch(() => null);
        const botRes = await fetch(`${this.apiBase}/getMe`).then(r => r.json()).catch(() => null);
        return { MINI_APP_URL: rawUrl, menuButton: menuBtnRes, bot: botRes };
    }
    async setMyCommands() {
        const commands = [
            { command: 'start',       description: '🏰 התחל לשחק' },
            { command: 'kingdom',     description: '🏰 פתח ממלכה' },
            { command: 'leaderboard', description: '🏆 דירוג עולמי' },
            { command: 'referral',    description: '🔗 הזמן חברים' },
            { command: 'help',        description: '❓ עזרה' },
        ];
        const res = await fetch(`${this.apiBase}/setMyCommands`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commands }),
        });
        return res.json();
    }
    async setWebhook(webhookUrl) {
        const res = await fetch(`${this.apiBase}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: webhookUrl, allowed_updates: ['message', 'callback_query'] }),
        });
        const result = await res.json();
        // Also register commands when setting webhook
        await this.setMyCommands().catch(() => {});
        return result;
    }
    async deleteWebhook() {
        const res = await fetch(`${this.apiBase}/deleteWebhook`, { method: 'POST' });
        return res.json();
    }
};
exports.TelegramService = TelegramService;
exports.TelegramService = TelegramService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TelegramService);
//# sourceMappingURL=telegram.service.js.map