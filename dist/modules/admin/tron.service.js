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
var TronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TronService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const TRONGRID_BASE = 'https://api.trongrid.io';
let TronService = TronService_1 = class TronService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(TronService_1.name);
    }
    getApiHeaders() {
        const apiKey = this.config.get('TRONGRID_API_KEY') || '';
        const h = { Accept: 'application/json' };
        if (apiKey)
            h['TRON-PRO-API-KEY'] = apiKey;
        return h;
    }
    async getUsdtBalance(address) {
        if (!address || !this.isValidAddress(address))
            return -1;
        try {
            const url = `${TRONGRID_BASE}/v1/accounts/${encodeURIComponent(address)}/tokens?limit=200&type=trc20`;
            const res = await fetch(url, { headers: this.getApiHeaders() });
            const json = await res.json();
            const usdt = (json?.data || []).find((t) => t.tokenId === USDT_CONTRACT || t.token_id === USDT_CONTRACT);
            if (usdt) {
                return parseFloat((parseFloat(usdt.balance || usdt.amount || '0') / 1_000_000).toFixed(6));
            }
            return 0;
        }
        catch (e) {
            this.logger.error('getUsdtBalance error', e?.message);
            return 0;
        }
    }
    async getTrxBalance(address) {
        if (!address || !this.isValidAddress(address))
            return 0;
        try {
            const url = `${TRONGRID_BASE}/v1/accounts/${encodeURIComponent(address)}`;
            const res = await fetch(url, { headers: this.getApiHeaders() });
            const json = await res.json();
            const sunBalance = json?.data?.[0]?.balance ?? 0;
            return parseFloat((sunBalance / 1_000_000).toFixed(6));
        }
        catch (e) {
            this.logger.error('getTrxBalance error', e?.message);
            return 0;
        }
    }
    async sendUsdt(toAddress, amount) {
        const privateKey = this.config.get('GAME_WALLET_PRIVATE_KEY');
        if (!privateKey)
            return { error: 'GAME_WALLET_PRIVATE_KEY לא מוגדר ב-ENV' };
        if (!this.isValidAddress(toAddress))
            return { error: 'כתובת ארנק לא תקינה' };
        try {
            const mod = require('tronweb');
            const TronWebClass = mod.TronWeb ?? mod.default ?? mod;
            const apiKey = this.config.get('TRONGRID_API_KEY') || '';
            const headers = apiKey ? { 'TRON-PRO-API-KEY': apiKey } : undefined;
            const tronWeb = new TronWebClass({
                fullHost: TRONGRID_BASE,
                ...(headers ? { headers } : {}),
                privateKey,
            });
            const amountSun = Math.floor(amount * 1_000_000);
            const contract = await tronWeb.contract().at(USDT_CONTRACT);
            const result = await contract.transfer(toAddress, amountSun).send({
                feeLimit: 10_000_000,
                callValue: 0,
                shouldPollResponse: false,
            });
            return { txId: result };
        }
        catch (e) {
            this.logger.error('sendUsdt error', e?.message);
            return { error: e?.message || 'שגיאה בשליחה' };
        }
    }
    isValidAddress(address) {
        if (!address || typeof address !== 'string')
            return false;
        return /^T[a-zA-Z0-9]{33}$/.test(address.trim());
    }
};
exports.TronService = TronService;
exports.TronService = TronService = TronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TronService);
//# sourceMappingURL=tron.service.js.map