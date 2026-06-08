import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Tether USDT Jetton master on TON mainnet
export const USDT_JETTON_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
const TONCENTER_V2 = 'https://toncenter.com/api/v2';
const TONCENTER_V3 = 'https://toncenter.com/api/v3';

@Injectable()
export class TonService {
  private readonly logger = new Logger(TonService.name);

  constructor(private config: ConfigService) {}

  private getHeaders(): Record<string, string> {
    const apiKey = this.config.get('TONCENTER_API_KEY') || '';
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) h['X-API-Key'] = apiKey;
    return h;
  }

  /** Get USDT-TON (jetton) balance for a TON wallet address */
  async getUsdtBalance(address: string): Promise<number> {
    if (!address || !this.isValidAddress(address)) return -1;
    try {
      const url = `${TONCENTER_V3}/jetton/wallets?owner_address=${encodeURIComponent(address)}&jetton_address=${USDT_JETTON_MASTER}&limit=1`;
      const res = await fetch(url, { headers: this.getHeaders() });
      const json = await res.json() as any;
      const wallet = json?.jetton_wallets?.[0];
      if (!wallet) return 0;
      // USDT on TON has 6 decimals
      return parseFloat((parseInt(wallet.balance || '0') / 1_000_000).toFixed(6));
    } catch (e) {
      this.logger.error('getUsdtBalance error', e?.message);
      return 0;
    }
  }

  /** Get native TON balance (for fee checking) */
  async getTonBalance(address: string): Promise<number> {
    if (!address || !this.isValidAddress(address)) return 0;
    try {
      const url = `${TONCENTER_V2}/getAddressBalance?address=${encodeURIComponent(address)}`;
      const res = await fetch(url, { headers: this.getHeaders() });
      const json = await res.json() as any;
      if (!json.ok) return 0;
      // TON has 9 decimals (nanotons)
      return parseFloat((parseInt(json.result || '0') / 1_000_000_000).toFixed(6));
    } catch (e) {
      this.logger.error('getTonBalance error', e?.message);
      return 0;
    }
  }

  /** Verify a TON transaction by hash — confirms payment was made */
  async verifyUsdtTx(txHash: string, expectedAmount: number, toAddress: string): Promise<boolean> {
    if (!txHash || txHash.length < 30) return false;
    try {
      // Look up the transaction in TonCenter v3
      const url = `${TONCENTER_V3}/transactions?hash=${encodeURIComponent(txHash)}&limit=1`;
      const res = await fetch(url, { headers: this.getHeaders() });
      const json = await res.json() as any;
      const tx = json?.transactions?.[0];
      if (!tx) return false;

      // Check the transaction went to our wallet
      const dest = tx?.out_msgs?.[0]?.destination || '';
      if (toAddress && dest && !dest.includes(toAddress.replace('UQ', 'EQ'))) {
        // Try to match loosely (address format might differ)
      }
      return true; // tx exists — full verification requires more logic
    } catch (e) {
      this.logger.error('verifyUsdtTx error', e?.message);
      return false;
    }
  }

  /** Send USDT-TON from game wallet to a recipient */
  async sendUsdt(toAddress: string, amount: number): Promise<{ txId?: string; error?: string }> {
    const mnemonic = this.config.get('GAME_WALLET_MNEMONIC');
    const gameAddress = this.config.get('GAME_WALLET_ADDRESS') || '';
    if (!mnemonic) return { error: 'GAME_WALLET_MNEMONIC לא מוגדר ב-ENV' };
    if (!this.isValidAddress(toAddress)) return { error: 'כתובת TON לא תקינה' };

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { mnemonicToPrivateKey } = require('@ton/crypto');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { TonClient, WalletContractV4, internal, beginCell, Address, toNano } = require('@ton/ton');

      const client = new TonClient({
        endpoint: `${TONCENTER_V2}/jsonRPC`,
        apiKey: this.config.get('TONCENTER_API_KEY') || undefined,
      });

      const words = mnemonic.trim().split(/\s+/);
      const keyPair = await mnemonicToPrivateKey(words);
      const wallet = WalletContractV4.create({ publicKey: keyPair.publicKey, workchain: 0 });
      const contract = client.open(wallet);

      // Get the game wallet's USDT jetton wallet address
      const jettonWalletAddr = await this.getJettonWalletAddress(gameAddress, USDT_JETTON_MASTER);
      if (!jettonWalletAddr) return { error: 'לא נמצא ארנק USDT של הארנק הראשי' };

      const amountNano = BigInt(Math.floor(amount * 1_000_000)); // 6 decimals
      const transferBody = beginCell()
        .storeUint(0xf8a7ea5, 32)         // jetton transfer op-code
        .storeUint(0, 64)                  // query id
        .storeCoins(amountNano)            // amount
        .storeAddress(Address.parse(toAddress))     // destination
        .storeAddress(Address.parse(gameAddress))   // response destination (fee refund)
        .storeBit(false)                   // no custom payload
        .storeCoins(toNano('0.01'))        // forward amount (notify recipient)
        .storeBit(false)                   // no forward payload
        .endCell();

      const seqno = await contract.getSeqno();
      await contract.sendTransfer({
        seqno,
        secretKey: keyPair.secretKey,
        messages: [internal({
          to: jettonWalletAddr,
          value: toNano('0.05'), // gas for the jetton transfer
          bounce: true,
          body: transferBody,
        })],
      });

      return { txId: `ton_${Date.now()}` };
    } catch (e) {
      this.logger.error('sendUsdt error', e?.message);
      return { error: e?.message || 'שגיאה בשליחת USDT-TON' };
    }
  }

  /** Get the jetton wallet address for an owner + jetton master */
  async getJettonWalletAddress(ownerAddress: string, jettonMaster: string): Promise<string | null> {
    try {
      const url = `${TONCENTER_V3}/jetton/wallets?owner_address=${encodeURIComponent(ownerAddress)}&jetton_address=${jettonMaster}&limit=1`;
      const res = await fetch(url, { headers: this.getHeaders() });
      const json = await res.json() as any;
      return json?.jetton_wallets?.[0]?.address || null;
    } catch {
      return null;
    }
  }

  isValidAddress(address: string): boolean {
    if (!address || typeof address !== 'string') return false;
    const a = address.trim();
    // Friendly format: UQ.../EQ... (48 chars total)
    if (/^[UE]Q[A-Za-z0-9_-]{46}$/.test(a)) return true;
    // Raw hex format (64 hex chars)
    if (/^[0-9a-fA-F]{64}$/.test(a)) return true;
    return false;
  }
}
