import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const CRYPTOBOT_API = 'https://pay.crypt.bot/api';

export interface CryptoBotInvoice {
  invoice_id: number;
  hash: string;
  currency_type: string;
  asset: string;
  amount: string;
  pay_url: string;
  bot_invoice_url: string;
  mini_app_invoice_url: string;
  status: 'active' | 'paid' | 'expired';
  payload?: string;
  paid_at?: string;
}

@Injectable()
export class CryptoBotService {
  private readonly logger = new Logger(CryptoBotService.name);

  constructor(private config: ConfigService) {}

  private getHeaders() {
    return {
      'Crypto-Pay-API-Token': this.config.get('CRYPTO_BOT_TOKEN') || '',
      'Content-Type': 'application/json',
    };
  }

  private async apiCall(method: string, params: Record<string, any> = {}): Promise<any> {
    const res = await fetch(`${CRYPTOBOT_API}/${method}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });
    const json = await res.json() as any;
    if (!json.ok) throw new Error(json.error?.name || `CryptoBot error: ${JSON.stringify(json)}`);
    return json.result;
  }

  /** Create a USDT invoice for VIP purchase */
  async createVipInvoice(userId: string, amountUsdt: number): Promise<CryptoBotInvoice> {
    return this.apiCall('createInvoice', {
      currency_type: 'crypto',
      asset: 'USDT',
      amount: amountUsdt.toFixed(2),
      description: `👑 Kingdom Wars VIP — חודש אחד`,
      payload: `vip:${userId}:${Date.now()}`,
      paid_btn_name: 'callback',
      paid_btn_url: this.config.get('MINI_APP_URL') || 'https://kingdomwars.cloud',
      expires_in: 3600, // 1 hour
    });
  }

  /** Check invoice status by invoice_id */
  async getInvoice(invoiceId: number): Promise<CryptoBotInvoice | null> {
    try {
      const result = await this.apiCall('getInvoices', { invoice_ids: [invoiceId] });
      return result?.items?.[0] || null;
    } catch (e) {
      this.logger.error('getInvoice error', e?.message);
      return null;
    }
  }

  /** Get all paid invoices with a given payload prefix */
  async getPaidInvoicesByPayload(payloadPrefix: string): Promise<CryptoBotInvoice[]> {
    try {
      const result = await this.apiCall('getInvoices', { status: 'paid', count: 100 });
      return (result?.items || []).filter((inv: CryptoBotInvoice) =>
        inv.payload?.startsWith(payloadPrefix)
      );
    } catch (e) {
      this.logger.error('getPaidInvoices error', e?.message);
      return [];
    }
  }

  /**
   * Transfer USDT to a Telegram user via CryptoBot.
   * The recipient must have a @CryptoBot account.
   */
  async transferUsdt(telegramId: string, amount: number, comment?: string): Promise<{ spend_id: string; status: string } | { error: string }> {
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
    } catch (e) {
      this.logger.error('transfer error', e?.message);
      return { error: e?.message || 'שגיאה בהעברה' };
    }
  }

  /** Get CryptoBot app balance */
  async getBalance(): Promise<Record<string, string>> {
    try {
      const result = await fetch(`${CRYPTOBOT_API}/getBalance`, { headers: this.getHeaders() });
      if (!result.ok) {
        this.logger.error('getBalance error', `HTTP ${result.status} ${result.statusText}`);
        return {};
      }
      const json = await result.json() as any;
      const balances: Record<string, string> = {};
      for (const item of json?.result || []) {
        balances[item.currency_code] = item.available;
      }
      return balances;
    } catch (e) {
      this.logger.error('getBalance error', e?.message);
      return {};
    }
  }

  /** Set webhook URL for payment notifications */
  async setWebhook(webhookUrl: string) {
    return this.apiCall('setWebhook', { url: webhookUrl });
  }
}
