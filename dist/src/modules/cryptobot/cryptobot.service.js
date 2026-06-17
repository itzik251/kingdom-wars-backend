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
var CryptoBotService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoBotService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const CRYPTOBOT_API = 'https://pay.crypt.bot/api';
let CryptoBotService = CryptoBotService_1 = class CryptoBotService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(CryptoBotService_1.name);
    }
    getHeaders() {
        return {
            'Crypto-Pay-API-Token': this.config.get('CRYPTO_BOT_TOKEN') || '',
            'Content-Type': 'application/json',
        };
    }
    async apiCall(method, params = {}) {
        const res = await fetch(`${CRYPTOBOT_API}/${method}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(params),
        });
        const json = await res.json();
        if (!json.ok)
            throw new Error(json.error?.name || `CryptoBot error: ${JSON.stringify(json)}`);
        return json.result;
    }
    async createVipInvoice(userId, amountUsdt) {
        return this.apiCall('createInvoice', {
            currency_type: 'crypto',
            asset: 'USDT',
            amount: amountUsdt.toFixed(2),
            description: `👑 Kingdom Wars VIP — חודש אחד`,
            payload: `vip:${userId}:${Date.now()}`,
            paid_btn_name: 'callback',
            paid_btn_url: this.config.get('MINI_APP_URL') || 'https://kingdomwars.cloud',
            expires_in: 3600,
        });
    }
    async getInvoice(invoiceId) {
        try {
            const result = await this.apiCall('getInvoices', { invoice_ids: [invoiceId] });
            return result?.items?.[0] || null;
        }
        catch (e) {
            this.logger.error('getInvoice error', e?.message);
            return null;
        }
    }
    async getPaidInvoicesByPayload(payloadPrefix) {
        try {
            const result = await this.apiCall('getInvoices', { status: 'paid', count: 100 });
            return (result?.items || []).filter((inv) => inv.payload?.startsWith(payloadPrefix));
        }
        catch (e) {
            this.logger.error('getPaidInvoices error', e?.message);
            return [];
        }
    }
    async transferUsdt(telegramId, amount, comment) {
        try {
            const spendId = `withdrawal_${telegramId}_${Date.now()}`;
            const result = await this.apiCall('transfer', {
                user_id: Number(telegramId),
                asset: 'USDT',
                amount: amount.toFixed(6),
                spend_id: spendId,
                comment: comment || `Kingdom Wars — משיכת USDT`,
            });
            return { spend_id: spendId, status: result?.status || 'sent' };
        }
        catch (e) {
            this.logger.error('transfer error', e?.message);
            return { error: e?.message || 'שגיאה בהעברה' };
        }
    }
    async getBalance() {
        try {
            const result = await fetch(`${CRYPTOBOT_API}/getBalance`, { headers: this.getHeaders() });
            if (!result.ok) {
                this.logger.error('getBalance error', `HTTP ${result.status} ${result.statusText}`);
                return {};
            }
            const json = await result.json();
            const balances = {};
            for (const item of json?.result || []) {
                balances[item.currency_code] = item.available;
            }
            return balances;
        }
        catch (e) {
            this.logger.error('getBalance error', e?.message);
            return {};
        }
    }
    async setWebhook(webhookUrl) {
        return this.apiCall('setWebhook', { url: webhookUrl });
    }
};
exports.CryptoBotService = CryptoBotService;
exports.CryptoBotService = CryptoBotService = CryptoBotService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CryptoBotService);
//# sourceMappingURL=cryptobot.service.js.map