import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Unit, UnitType } from '../units/unit.entity';

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
    @InjectRepository(Unit)    private unitRepo: Repository<Unit>,
  ) {}

  private async getActiveReferralCount(userId: string): Promise<number> {
    const result = await this.userRepo
      .createQueryBuilder('u')
      .innerJoin('u.referredBy', 'ref')
      .where('ref.id = :userId', { userId })
      .andWhere('u.lastLogin IS NOT NULL')
      .getCount();
    return result;
  }

  private async getTotalReferralCount(userId: string): Promise<number> {
    // All referred users, even those who haven't played yet (score = 0)
    const result = await this.userRepo
      .createQueryBuilder('u')
      .innerJoin('u.referredBy', 'ref')
      .where('ref.id = :userId', { userId })
      .getCount();
    return result;
  }

  private async autoGrantReferralHeroes(userId: string, referredCount: number) {
    const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: userId } } });
    if (!kingdom) return;
    const granted = kingdom.ragnarHeroGrantedCount ?? 0;
    const shouldGrant = Math.floor(referredCount / 10);
    const toGrant = shouldGrant - granted;
    if (toGrant <= 0) return;

    let ragnar = await this.unitRepo.findOne({
      where: { kingdom: { id: kingdom.id }, type: UnitType.RAGNAR },
    });
    if (!ragnar) {
      ragnar = this.unitRepo.create({ kingdom: { id: kingdom.id } as any, type: UnitType.RAGNAR, count: toGrant, trainingCount: 0, trainingEndsAt: null });
    } else {
      ragnar.count += toGrant;
    }
    await this.unitRepo.save(ragnar);
    kingdom.ragnarHeroGrantedCount = shouldGrant;
    await this.kingdomRepo.save(kingdom);
  }

  async getStats(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const [referredCount, totalReferredCount] = await Promise.all([
      this.getActiveReferralCount(userId),
      this.getTotalReferralCount(userId),
    ]);

    // Auto-grant Ragnar hero at every 10 referrals (no claim needed)
    await this.autoGrantReferralHeroes(userId, referredCount);

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
      referredCount,       // active (score > 0) — used for rewards
      totalReferredCount,  // all referred including inactive — shown in UI
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

    // For each skin earned → add 1 Ragnar hero unit (referral hero unlock)
    if (skins > 0) {
      let ragnar = await this.unitRepo.findOne({
        where: { kingdom: { id: kingdom.id }, type: UnitType.RAGNAR },
      });
      if (!ragnar) {
        ragnar = this.unitRepo.create({
          kingdom: { id: kingdom.id } as any,
          type: UnitType.RAGNAR,
          count: skins,
          trainingCount: 0,
          trainingEndsAt: null,
        });
      } else {
        ragnar.count += skins;
      }
      await this.unitRepo.save(ragnar);
    }

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
