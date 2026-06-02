import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';

const MILESTONES = [
  { count: 1,  gems: 100,  label: '1 חבר'  },
  { count: 5,  gems: 500,  label: '5 חברים' },
  { count: 10, gems: 0,    label: '10 חברים', skin: 'rare_skin'  },
  { count: 50, gems: 0,    label: '50 חברים', hero: 'ragnar'     },
];

@Injectable()
export class ReferralService {
  constructor(
    @InjectRepository(User)    private userRepo: Repository<User>,
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
  ) {}

  async getStats(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const referredCount = await this.userRepo.count({ where: { referredBy: { id: userId } } });

    const milestones = MILESTONES.map(m => ({
      ...m,
      reached: referredCount >= m.count,
    }));

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'KingdomWarsBot';
    const link = `https://t.me/${botUsername}?start=ref_${user.referralCode}`;

    return {
      referralCode: user.referralCode,
      link,
      referredCount,
      milestones,
    };
  }

  async claimMilestone(userId: string, milestoneCount: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const referredCount = await this.userRepo.count({ where: { referredBy: { id: userId } } });

    const milestone = MILESTONES.find(m => m.count === milestoneCount);
    if (!milestone) return { error: 'milestone not found' };
    if (referredCount < milestone.count) return { error: 'not reached yet' };

    const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: userId } } });
    if (!kingdom) return { error: 'kingdom not found' };

    if (milestone.gems > 0) {
      kingdom.gems += milestone.gems;
      await this.kingdomRepo.save(kingdom);
    }

    return { claimed: true, gems: milestone.gems, skin: milestone.skin, hero: milestone.hero };
  }
}
