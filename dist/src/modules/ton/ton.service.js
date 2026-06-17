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
var TonService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TonService = exports.USDT_JETTON_MASTER = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
exports.USDT_JETTON_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
const TONCENTER_V2 = 'https://toncenter.com/api/v2';
const TONCENTER_V3 = 'https://toncenter.com/api/v3';
let TonService = TonService_1 = class TonService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(TonService_1.name);
    }
    getHeaders() {
        const apiKey = this.config.get('TONCENTER_API_KEY') || '';
        const h = { 'Content-Type': 'application/json' };
        if (apiKey)
            h['X-API-Key'] = apiKey;
        return h;
    }
    async getUsdtBalance(address) {
        if (!address || !this.isValidAddress(address))
            return -1;
        try {
            const url = `${TONCENTER_V3}/jetton/wallets?owner_address=${encodeURIComponent(address)}&jetton_address=${exports.USDT_JETTON_MASTER}&limit=1`;
            const res = await fetch(url, { headers: this.getHeaders() });
            const json = await res.json();
            const wallet = json?.jetton_wallets?.[0];
            if (!wallet)
                return 0;
            return parseFloat((parseInt(wallet.balance || '0') / 1_000_000).toFixed(6));
        }
        catch (e) {
            this.logger.error('getUsdtBalance error', e?.message);
            return 0;
        }
    }
    async getTonBalance(address) {
        if (!address || !this.isValidAddress(address))
            return 0;
        try {
            const url = `${TONCENTER_V2}/getAddressBalance?address=${encodeURIComponent(address)}`;
            const res = await fetch(url, { headers: this.getHeaders() });
            const json = await res.json();
            if (!json.ok)
                return 0;
            return parseFloat((parseInt(json.result || '0') / 1_000_000_000).toFixed(6));
        }
        catch (e) {
            this.logger.error('getTonBalance error', e?.message);
            return 0;
        }
    }
    async verifyUsdtTx(txHash, expectedAmount, toAddress) {
        if (!txHash || txHash.length < 30)
            return false;
        try {
            const url = `${TONCENTER_V3}/transactions?msg_hash=${encodeURIComponent(txHash)}&limit=1`;
            const res = await fetch(url, { headers: this.getHeaders() });
            if (!res.ok)
                return false;
            const json = await res.json();
            const tx = json?.transactions?.[0];
            if (!tx)
                return false;
            const txTime = (tx.now || 0) * 1000;
            if (Date.now() - txTime > 30 * 60 * 1000) {
                this.logger.warn(`verifyUsdtTx: TX too old (${new Date(txTime).toISOString()})`);
                return false;
            }
            const transferUrl = `${TONCENTER_V3}/jetton/transfers?msg_hash=${encodeURIComponent(txHash)}&limit=5`;
            const tRes = await fetch(transferUrl, { headers: this.getHeaders() });
            if (tRes.ok) {
                const tJson = await tRes.json();
                const transfers = tJson?.jetton_transfers || [];
                for (const tr of transfers) {
                    const dest = tr?.destination_address || '';
                    const amount = parseInt(tr?.amount || '0') / 1_000_000;
                    const destNorm = dest.replace(/^EQ/, 'UQ');
                    const toNorm = toAddress.replace(/^EQ/, 'UQ');
                    if (destNorm === toNorm && amount >= expectedAmount * 0.98) {
                        return true;
                    }
                }
                if (transfers.length > 0) {
                    this.logger.warn(`verifyUsdtTx: jetton transfer found but amount/dest mismatch`);
                    return false;
                }
            }
            return true;
        }
        catch (e) {
            this.logger.error('verifyUsdtTx error', e?.message);
            return false;
        }
    }
    async sendUsdt(toAddress, amount) {
        const mnemonic = this.config.get('GAME_WALLET_MNEMONIC');
        const gameAddress = this.config.get('GAME_WALLET_ADDRESS') || '';
        if (!mnemonic)
            return { error: 'GAME_WALLET_MNEMONIC לא מוגדר ב-ENV' };
        if (!this.isValidAddress(toAddress))
            return { error: 'כתובת TON לא תקינה' };
        try {
            const { mnemonicToPrivateKey } = require('@ton/crypto');
            const { TonClient, WalletContractV4, internal, beginCell, Address, toNano } = require('@ton/ton');
            const client = new TonClient({
                endpoint: `${TONCENTER_V2}/jsonRPC`,
                apiKey: this.config.get('TONCENTER_API_KEY') || undefined,
            });
            const words = mnemonic.trim().split(/\s+/);
            const keyPair = await mnemonicToPrivateKey(words);
            const wallet = WalletContractV4.create({ publicKey: keyPair.publicKey, workchain: 0 });
            const contract = client.open(wallet);
            const jettonWalletAddr = await this.getJettonWalletAddress(gameAddress, exports.USDT_JETTON_MASTER);
            if (!jettonWalletAddr)
                return { error: 'לא נמצא ארנק USDT של הארנק הראשי' };
            const amountNano = BigInt(Math.floor(amount * 1_000_000));
            const transferBody = beginCell()
                .storeUint(0xf8a7ea5, 32)
                .storeUint(0, 64)
                .storeCoins(amountNano)
                .storeAddress(Address.parse(toAddress))
                .storeAddress(Address.parse(gameAddress))
                .storeBit(false)
                .storeCoins(toNano('0.01'))
                .storeBit(false)
                .endCell();
            const seqno = await contract.getSeqno();
            await contract.sendTransfer({
                seqno,
                secretKey: keyPair.secretKey,
                messages: [internal({
                        to: jettonWalletAddr,
                        value: toNano('0.05'),
                        bounce: true,
                        body: transferBody,
                    })],
            });
            return { txId: `ton_${Date.now()}` };
        }
        catch (e) {
            this.logger.error('sendUsdt error', e?.message);
            return { error: e?.message || 'שגיאה בשליחת USDT-TON' };
        }
    }
    async getJettonWalletAddress(ownerAddress, jettonMaster) {
        try {
            const url = `${TONCENTER_V3}/jetton/wallets?owner_address=${encodeURIComponent(ownerAddress)}&jetton_address=${jettonMaster}&limit=1`;
            const res = await fetch(url, { headers: this.getHeaders() });
            const json = await res.json();
            return json?.jetton_wallets?.[0]?.address || null;
        }
        catch {
            return null;
        }
    }
    isValidAddress(address) {
        if (!address || typeof address !== 'string')
            return false;
        const a = address.trim();
        if (/^[UE]Q[A-Za-z0-9_-]{46}$/.test(a))
            return true;
        if (/^[0-9a-fA-F]{64}$/.test(a))
            return true;
        return false;
    }
};
exports.TonService = TonService;
exports.TonService = TonService = TonService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TonService);
//# sourceMappingURL=ton.service.js.map