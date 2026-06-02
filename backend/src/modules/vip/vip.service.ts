import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { VIP_PRICE_TON, VIP_DURATION_DAYS } from '../../constants/game.constants';

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

    return { success: true, expiresAt, durationDays: VIP_DURATION_DAYS };
  }

  isUserVip(userId: string): boolean {
    const expiresAt = vipStore.get(userId);
    return !!(expiresAt && new Date() < expiresAt);
  }
}
