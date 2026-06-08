import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';

/**
 * Recurring referral rewards:
 * - Every 1 referral  → 100 gems
 * - Every 5 referrals → extra 200 gems bonus
 * - Every 10 referrals→ rare skin
 * - Every 20 referrals→ 30 days VIP
 *
 * Example: 100 referrals → 100×100 + 20×200 gems + 10 skins + 5 months VIP
 */

function calcRewards(from: number, to: number) {
  let gems = 0;
  let skins = 0;
  let vipDays = 0;

  for (let i = from + 1; i <= to; i++) {
    gems += 100;                              // every referral
    if (i % 5 === 0)  gems += 200;           // bonus every 5
    if (i % 10 === 0) skins++;               // skin every 10
    if (i % 20 === 0) vipDays += 30;         // VIP month every 20
  }
  return { gems, skins, vipDays };
}

@Injectable()
export class ReferralService {
  constructor(
    @InjectRepository(User)    private userRepo: Repository<User>,
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
  ) {}

  private async getActiveReferralCount(userId: string): Promise<number> {
    const result = await this.kingdomRepo
      .createQueryBuilder('k')
      .innerJoin('k.user', 'u')
      .innerJoin('u.referredBy', 'ref')
      .where('ref.id = :userId', { userId })
      .andWhere('k.score > 0')
      .getCount();
    return result;
  }

  async getStats(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const referredCount = await this.getActiveReferralCount(userId);
    const claimedCount = user.referralClaimedCount ?? 0;

    // Pending rewards since last claim
    const pending = calcRewards(claimedCount, referredCount);

    // Next milestones
    const nextPerReferral = referredCount + 1;
    const nextBonus5  = Math.ceil((referredCount + 1) / 5) * 5;
    const nextSkin    = Math.ceil((referredCount + 1) / 10) * 10;
    const nextVip     = Math.ceil((referredCount + 1) / 20) * 20;

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'KingdomWarsBot';
    const link = `https://t.me/${botUsername}?start=ref_${user.referralCode}`;

    return {
      referralCode: user.referralCode,
      link,
      referredCount,
      claimedCount,
      pendingRewards: pending,
      hasPending: pending.gems > 0 || pending.skins > 0 || pending.vipDays > 0,
      nextMilestones: {
        gems100At: nextPerReferral,
        bonus200At: nextBonus5,
        skinAt: nextSkin,
        vipAt: nextVip,
      },
      // Legacy milestones field — empty (new system)
      milestones: [],
    };
  }

  async claimRewards(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const referredCount = await this.getActiveReferralCount(userId);
    const claimedCount = user.referralClaimedCount ?? 0;

    if (referredCount <= claimedCount) {
      return { claimed: false, reason: 'no_pending' };
    }

    const { gems, skins, vipDays } = calcRewards(claimedCount, referredCount);

    // Atomic update — only succeeds if claimedCount hasn't changed since we read it (prevents double-claim)
    const updateResult = await this.userRepo
      .createQueryBuilder()
      .update()
      .set({ referralClaimedCount: referredCount })
      .where('id = :id AND referral_claimed_count = :expected', { id: userId, expected: claimedCount })
      .execute();

    if (!updateResult.affected || updateResult.affected === 0) {
      return { claimed: false, reason: 'concurrent_claim' };
    }

    const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: userId } } });
    if (!kingdom) return { claimed: false, reason: 'no_kingdom' };

    if (gems > 0) {
      kingdom.gems += gems;
    }

    if (vipDays > 0) {
      const expiresAt = new Date(
        Math.max(Date.now(), kingdom.vipExpiresAt?.getTime() ?? 0) + vipDays * 86_400_000
      );
      kingdom.vipExpiresAt = expiresAt;
    }

    await this.kingdomRepo.save(kingdom);

    return {
      claimed: true,
      gems,
      skins,
      vipDays,
      newClaimedCount: referredCount,
    };
  }

  /** Legacy endpoint — kept for backward compat, redirects to claimRewards */
  async claimMilestone(userId: string, _milestoneCount: number) {
    return this.claimRewards(userId);
  }
}
