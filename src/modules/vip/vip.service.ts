import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { TonService } from '../ton/ton.service';
import { VIP_PRICE_USDT_TON, VIP_DURATION_DAYS, PAYMENT_WALLET_ADDRESS } from '../../constants/game.constants';

const vipStore = new Map<string, Date>();

@Injectable()
export class VipService {
  constructor(
    @InjectRepository(User)    private userRepo: Repository<User>,
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
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
    if (!tonTxHash || tonTxHash.length < 20) {
      throw new BadRequestException('hash טרנזקציה לא תקין');
    }

    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) {
      const verified = await this.tonService.verifyUsdtTx(
        tonTxHash,
        VIP_PRICE_USDT_TON,
        PAYMENT_WALLET_ADDRESS,
      );
      if (!verified) throw new BadRequestException('הטרנזקציה לא נמצאה ב-TON — המתן מספר שניות ונסה שוב');
    }

    const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: userId } } });
    const expiresAt = new Date(
      Math.max(Date.now(), kingdom?.vipExpiresAt?.getTime() ?? 0) + VIP_DURATION_DAYS * 86_400_000,
    );

    if (kingdom) {
      kingdom.vipExpiresAt = expiresAt;
      await this.kingdomRepo.save(kingdom);
    }
    vipStore.set(userId, expiresAt);
    return { success: true, expiresAt, durationDays: VIP_DURATION_DAYS };
  }

  /** Purchase VIP using in-game USDT balance */
  async purchaseWithUsdt(userId: string) {
    const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: userId } } });
    if (!kingdom) throw new BadRequestException('Kingdom not found');
    if ((kingdom.usdtBalance ?? 0) < VIP_PRICE_USDT_TON) {
      throw new BadRequestException(`נדרש ${VIP_PRICE_USDT_TON} USDT. יתרתך: ${(kingdom.usdtBalance ?? 0).toFixed(4)} USDT`);
    }

    // Atomic deduct to prevent double-spend
    const result = await this.kingdomRepo
      .createQueryBuilder()
      .update()
      .set({ usdtBalance: () => `usdt_balance - ${VIP_PRICE_USDT_TON}` })
      .where('id = :id AND usdt_balance >= :price', { id: kingdom.id, price: VIP_PRICE_USDT_TON })
      .execute();

    if (!result.affected || result.affected === 0) {
      throw new BadRequestException(`נדרש ${VIP_PRICE_USDT_TON} USDT. יתרתך: ${(kingdom.usdtBalance ?? 0).toFixed(4)} USDT`);
    }

    const expiresAt = new Date(
      Math.max(Date.now(), kingdom.vipExpiresAt?.getTime() ?? 0) + VIP_DURATION_DAYS * 86_400_000,
    );
    await this.kingdomRepo.update({ id: kingdom.id }, { vipExpiresAt: expiresAt });
    vipStore.set(userId, expiresAt);
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
