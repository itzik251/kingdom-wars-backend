import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { TonService } from '../ton/ton.service';
import { VIP_PRICE_USDT_TON, VIP_DURATION_DAYS, PAYMENT_WALLET_ADDRESS } from '../../constants/game.constants';

const vipStore = new Map<string, Date>();

@Injectable()
export class VipService {
  private readonly logger = new Logger(VipService.name);

  constructor(
    @InjectRepository(User)    private userRepo: Repository<User>,
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
    @InjectDataSource()        private dataSource: DataSource,
    private tonService: TonService,
  ) {}

  async getStatus(userId: string) {
    const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: userId } } });
    const dbExpiry = kingdom?.vipExpiresAt;
    const isVip = !!(dbExpiry && new Date() < new Date(dbExpiry));
    if (isVip && dbExpiry) vipStore.set(userId, new Date(dbExpiry));
    return {
      isVip,
      expiresAt: isVip ? dbExpiry : null,
      priceUsdt: VIP_PRICE_USDT_TON,
      currency: 'USDT-TON',
      gameWallet: PAYMENT_WALLET_ADDRESS,
      usdtBalance: parseFloat(((kingdom?.usdtBalance ?? 0)).toFixed(4)),
    };
  }

  /** Activate VIP after user sends USDT-TON to game wallet */
  async activateVip(userId: string, tonTxHash: string) {
    if (!tonTxHash || typeof tonTxHash !== 'string' || tonTxHash.length < 20) {
      throw new BadRequestException('hash טרנזקציה לא תקין');
    }
    // Sanitize
    const cleanHash = tonTxHash.trim().replace(/[^A-Za-z0-9_\-]/g, '');
    if (cleanHash.length < 20) throw new BadRequestException('hash טרנזקציה לא תקין');

    // ── Replay protection: each tx hash can only be used once ────────────────
    const already = await this.dataSource.query(
      `SELECT 1 FROM vip_tx_hashes WHERE tx_hash = $1 LIMIT 1`,
      [cleanHash],
    ).catch(() => []);
    if (already.length > 0) {
      throw new BadRequestException('hash זה כבר שומש — אנא צור קשר עם התמיכה');
    }

    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) {
      const verified = await this.tonService.verifyUsdtTx(
        cleanHash,
        VIP_PRICE_USDT_TON,
        PAYMENT_WALLET_ADDRESS,
      );
      if (!verified) throw new BadRequestException('הטרנזקציה לא נמצאה ב-TON — המתן מספר שניות ונסה שוב');
    }

    // ── Store hash BEFORE giving VIP (prevents race condition) ───────────────
    await this.dataSource.query(
      `INSERT INTO vip_tx_hashes(tx_hash, user_id) VALUES($1, $2) ON CONFLICT DO NOTHING`,
      [cleanHash, userId],
    ).catch(() => {});

    const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: userId } } });
    const expiresAt = new Date(
      Math.max(Date.now(), kingdom?.vipExpiresAt?.getTime() ?? 0) + VIP_DURATION_DAYS * 86_400_000,
    );

    if (kingdom) {
      kingdom.vipExpiresAt = expiresAt;
      await this.kingdomRepo.save(kingdom);
    }
    vipStore.set(userId, expiresAt);
    this.logger.log(`VIP activated: userId=${userId} hash=${cleanHash}`);
    return { success: true, expiresAt, durationDays: VIP_DURATION_DAYS };
  }

  /** Purchase VIP using in-game USDT balance — atomic to prevent double-spend */
  async purchaseWithUsdt(userId: string) {
    // ── Atomic deduct: only succeeds if balance >= price ─────────────────────
    const result = await this.kingdomRepo
      .createQueryBuilder()
      .update()
      .set({ usdtBalance: () => `usdt_balance - ${VIP_PRICE_USDT_TON}` })
      .where('user_id = (SELECT id FROM users WHERE id = :uid) AND usdt_balance >= :price',
        { uid: userId, price: VIP_PRICE_USDT_TON })
      .execute();

    // Fallback: find kingdom and check
    const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: userId } } });
    if (!kingdom) throw new BadRequestException('Kingdom not found');

    if (!result.affected || result.affected === 0) {
      throw new BadRequestException(`נדרש ${VIP_PRICE_USDT_TON} USDT. יתרתך: ${(kingdom.usdtBalance ?? 0).toFixed(4)} USDT`);
    }

    const expiresAt = new Date(
      Math.max(Date.now(), kingdom.vipExpiresAt?.getTime() ?? 0) + VIP_DURATION_DAYS * 86_400_000,
    );
    await this.kingdomRepo.update({ id: kingdom.id }, { vipExpiresAt: expiresAt });
    vipStore.set(userId, expiresAt);
    this.logger.log(`VIP purchased with USDT: userId=${userId}`);
    return { success: true, expiresAt, durationDays: VIP_DURATION_DAYS };
  }

  getPaymentInfo() {
    return {
      walletAddress: PAYMENT_WALLET_ADDRESS,
      amount: VIP_PRICE_USDT_TON,
      currency: 'USDT-TON',
      network: 'TON',
      note: `שלח בדיוק ${VIP_PRICE_USDT_TON} USDT על רשת TON. אחרי השליחה הכנס את hash הטרנזקציה.`,
    };
  }

  isUserVip(userId: string): boolean {
    const expiresAt = vipStore.get(userId);
    return !!(expiresAt && new Date() < expiresAt);
  }
}
