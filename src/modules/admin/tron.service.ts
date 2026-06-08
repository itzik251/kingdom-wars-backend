import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const TRONGRID_BASE = 'https://api.trongrid.io';

@Injectable()
export class TronService {
  private readonly logger = new Logger(TronService.name);

  constructor(private config: ConfigService) {}

  private getApiHeaders(): Record<string, string> {
    const apiKey = this.config.get('TRONGRID_API_KEY') || '';
    const h: Record<string, string> = { Accept: 'application/json' };
    if (apiKey) h['TRON-PRO-API-KEY'] = apiKey;
    return h;
  }

  /** Get USDT TRC20 balance via REST (no TronWeb SDK needed) */
  async getUsdtBalance(address: string): Promise<number> {
    if (!address || !this.isValidAddress(address)) return -1;
    try {
      const url = `${TRONGRID_BASE}/v1/accounts/${encodeURIComponent(address)}/tokens?limit=200&type=trc20`;
      const res = await fetch(url, { headers: this.getApiHeaders() });
      const json = await res.json() as any;
      const usdt = (json?.data || []).find((t: any) =>
        t.tokenId === USDT_CONTRACT || t.token_id === USDT_CONTRACT
      );
      if (usdt) {
        return parseFloat((parseFloat(usdt.balance || usdt.amount || '0') / 1_000_000).toFixed(6));
      }
      return 0;
    } catch (e) {
      this.logger.error('getUsdtBalance error', e?.message);
      return 0;
    }
  }

  /** Get native TRX balance via REST */
  async getTrxBalance(address: string): Promise<number> {
    if (!address || !this.isValidAddress(address)) return 0;
    try {
      const url = `${TRONGRID_BASE}/v1/accounts/${encodeURIComponent(address)}`;
      const res = await fetch(url, { headers: this.getApiHeaders() });
      const json = await res.json() as any;
      const sunBalance = json?.data?.[0]?.balance ?? 0;
      return parseFloat((sunBalance / 1_000_000).toFixed(6));
    } catch (e) {
      this.logger.error('getTrxBalance error', e?.message);
      return 0;
    }
  }

  /** Send USDT TRC20 from game wallet to recipient using TronWeb v6 */
  async sendUsdt(toAddress: string, amount: number): Promise<{ txId?: string; error?: string }> {
    const privateKey = this.config.get('GAME_WALLET_PRIVATE_KEY');
    if (!privateKey) return { error: 'GAME_WALLET_PRIVATE_KEY לא מוגדר ב-ENV' };
    if (!this.isValidAddress(toAddress)) return { error: 'כתובת ארנק לא תקינה' };

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('tronweb');
      const TronWebClass = mod.TronWeb ?? mod.default ?? mod;
      const apiKey = this.config.get('TRONGRID_API_KEY') || '';
      const headers = apiKey ? { 'TRON-PRO-API-KEY': apiKey } : undefined;

      // TronWeb v6 new constructor API
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
    } catch (e) {
      this.logger.error('sendUsdt error', e?.message);
      return { error: e?.message || 'שגיאה בשליחה' };
    }
  }

  isValidAddress(address: string): boolean {
    if (!address || typeof address !== 'string') return false;
    // TRC20 addresses start with 'T' and are 34 chars (Base58)
    return /^T[a-zA-Z0-9]{33}$/.test(address.trim());
  }
}
