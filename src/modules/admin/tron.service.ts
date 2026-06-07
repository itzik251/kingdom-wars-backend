import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// USDT TRC20 contract on mainnet
const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const TRON_FULL_NODE = 'https://api.trongrid.io';
const TRON_API_KEY   = ''; // Optional TronGrid API key — set TRONGRID_API_KEY in env

@Injectable()
export class TronService {
  private readonly logger = new Logger(TronService.name);

  constructor(private config: ConfigService) {}

  private getTronWeb(withKey = false) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const TronWeb = require('tronweb');
    const privateKey = withKey ? this.config.get('GAME_WALLET_PRIVATE_KEY') : undefined;
    const apiKey = this.config.get('TRONGRID_API_KEY') || TRON_API_KEY;
    const headers = apiKey ? { 'TRON-PRO-API-KEY': apiKey } : {};
    return new TronWeb(
      TRON_FULL_NODE,
      TRON_FULL_NODE,
      TRON_FULL_NODE,
      privateKey,
      headers,
    );
  }

  /** Get USDT TRC20 balance for any address */
  async getUsdtBalance(address: string): Promise<number> {
    try {
      const tronWeb = this.getTronWeb();
      if (!tronWeb.isAddress(address)) return -1;
      const contract = await tronWeb.contract().at(USDT_CONTRACT);
      const balanceRaw = await contract.balanceOf(address).call();
      // balanceRaw is a BigNumber with 6 decimals (USDT)
      const rawStr = balanceRaw?.toString?.() ?? balanceRaw;
      const balance = parseFloat(rawStr) / 1_000_000;
      return parseFloat(balance.toFixed(6));
    } catch (e) {
      this.logger.error('getUsdtBalance error', e?.message);
      // Fallback: use TronGrid REST API
      return this.getUsdtBalanceRest(address);
    }
  }

  /** Fallback: TronGrid REST API for USDT balance */
  private async getUsdtBalanceRest(address: string): Promise<number> {
    try {
      const apiKey = this.config.get('TRONGRID_API_KEY') || '';
      const headers: any = { Accept: 'application/json' };
      if (apiKey) headers['TRON-PRO-API-KEY'] = apiKey;
      const url = `https://api.trongrid.io/v1/accounts/${address}/tokens?limit=200&type=trc20`;
      const res = await fetch(url, { headers });
      const json = await res.json() as any;
      const usdt = (json?.data || []).find((t: any) =>
        t.tokenId === USDT_CONTRACT || t.token_id === USDT_CONTRACT
      );
      if (usdt) {
        return parseFloat((parseFloat(usdt.balance || usdt.amount || '0') / 1_000_000).toFixed(6));
      }
      return 0;
    } catch (e) {
      this.logger.error('getUsdtBalanceRest error', e?.message);
      return 0;
    }
  }

  /** Send USDT TRC20 from game wallet to recipient */
  async sendUsdt(toAddress: string, amount: number): Promise<{ txId?: string; error?: string }> {
    const privateKey = this.config.get('GAME_WALLET_PRIVATE_KEY');
    if (!privateKey) return { error: 'GAME_WALLET_PRIVATE_KEY לא מוגדר ב-ENV' };

    try {
      const tronWeb = this.getTronWeb(true);
      if (!tronWeb.isAddress(toAddress)) return { error: 'כתובת ארנק לא תקינה' };

      const amountSun = Math.floor(amount * 1_000_000); // USDT 6 decimals
      const contract = await tronWeb.contract().at(USDT_CONTRACT);
      const result = await contract.transfer(toAddress, amountSun).send({
        feeLimit: 10_000_000, // 10 TRX fee limit
        callValue: 0,
        shouldPollResponse: false,
      });
      return { txId: result };
    } catch (e) {
      this.logger.error('sendUsdt error', e?.message);
      return { error: e?.message || 'שגיאה בשליחה' };
    }
  }

  /** Get native TRX balance (for fee checking) */
  async getTrxBalance(address: string): Promise<number> {
    try {
      const tronWeb = this.getTronWeb();
      const balance = await tronWeb.trx.getBalance(address);
      return parseFloat(tronWeb.fromSun(balance));
    } catch {
      return 0;
    }
  }

  isValidAddress(address: string): boolean {
    try {
      const TronWeb = require('tronweb');
      return TronWeb.isAddress(address);
    } catch { return false; }
  }
}
