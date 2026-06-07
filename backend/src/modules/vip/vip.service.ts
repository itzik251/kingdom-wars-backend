import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { VIP_PRICE_TON, VIP_DURATION_DAYS, VIP_PRICE_USDT, PAYMENT_WALLET_ADDRESS } from '../../constants/game.constants';

// Simple in-memory VIP store (upgrade to DB table for production)
const vipStore = new Map<string, Date>();

@Injectable()
export class VipService {
  constructor(
    @InjectRepository(User)    private userRepo: Repository<User>,
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
  ) {}

  async getStatus(userId: string) {
    const expiresAt = vipStore.get(userId);
    const isVip = expiresAt && new Date() < expiresAt;
    return { isVip: !!isVip, expiresAt: isVip ? expiresAt : null, priceToN: VIP_PRICE_TON };
  }

  // Called after TON payment is verified on-chain
  // In production: verify tx hash via TonCenter API
  async activateVip(userId: string, tonTxHash: string) {
    if (!tonTxHash || tonTxHash.length < 10) {
      throw new BadRequestException('Invalid transaction hash');
    }

    // TODO: verify tx on-chain via https://toncenter.com/api/v2/getTransaction
    // For now: accept any hash in dev, verify in prod

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + VIP_DURATION_DAYS);
    vipStore.set(userId, expiresAt);

    // Persist on the kingdom so combat/building/unit VIP gates work off the entity.
    const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: userId } } });
    if (kingdom) {
      kingdom.vipExpiresAt = expiresAt;
      await this.kingdomRepo.save(kingdom);
    }

    return { success: true, expiresAt, durationDays: VIP_DURATION_DAYS };
  }

  async purchaseWithUsdt(userId: string) {
    const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: userId } } });
    if (!kingdom) throw new BadRequestException('Kingdom not found');
    if ((kingdom.usdtBalance ?? 0) < VIP_PRICE_USDT) {
      throw new BadRequestException(`נדרש ${VIP_PRICE_USDT} USDT. יתרתך: ${(kingdom.usdtBalance ?? 0).toFixed(4)} USDT`);
    }
    kingdom.usdtBalance = parseFloat(((kingdom.usdtBalance ?? 0) - VIP_PRICE_USDT).toFixed(6));
    const expiresAt = new Date(Math.max(Date.now(), kingdom.vipExpiresAt?.getTime() ?? 0) + VIP_DURATION_DAYS * 86_400_000);
    kingdom.vipExpiresAt = expiresAt;
    await this.kingdomRepo.save(kingdom);
    vipStore.set(userId, expiresAt);
    return { success: true, expiresAt, durationDays: VIP_DURATION_DAYS };
  }

  getPaymentInfo() {
    return {
      walletAddress: PAYMENT_WALLET_ADDRESS,
      amount: VIP_PRICE_USDT,
      currency: 'USDT (TRC20)',
      note: 'שלח בדיוק את הסכום. לאחר שליחה הכנס את hash הטרנזקציה.',
    };
  }

  isUserVip(userId: string): boolean {
    const expiresAt = vipStore.get(userId);
    return !!(expiresAt && new Date() < expiresAt);
  }
}
