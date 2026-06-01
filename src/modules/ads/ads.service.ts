import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';

// Boost state: userId → expiresAt
const boostStore = new Map<string, Date>();
// Cooldown: userId → lastAdAt (max 5 ads/day)
const adCooldown = new Map<string, { count: number; date: string }>();

const MAX_ADS_PER_DAY = 5;
const BOOST_DURATION_HOURS = 1;

@Injectable()
export class AdsService {
  constructor(@InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>) {}

  async claimReward(userId: string, kingdomId: string, rewardType: 'double_production' | 'gems') {
    const today = new Date().toISOString().split('T')[0];
    const cooldown = adCooldown.get(userId);

    if (cooldown?.date === today && cooldown.count >= MAX_ADS_PER_DAY) {
      throw new BadRequestException(`מקסימום ${MAX_ADS_PER_DAY} פרסומות ליום`);
    }

    // Update cooldown
    adCooldown.set(userId, {
      date: today,
      count: (cooldown?.date === today ? cooldown.count : 0) + 1,
    });

    if (rewardType === 'double_production') {
      const until = new Date(Date.now() + BOOST_DURATION_HOURS * 3_600_000);
      boostStore.set(userId, until);
      return { reward: 'double_production', boostUntil: until, adsRemainingToday: MAX_ADS_PER_DAY - (adCooldown.get(userId)?.count || 0) };
    }

    if (rewardType === 'gems') {
      const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
      kingdom.gems += 10;
      await this.kingdomRepo.save(kingdom);
      return { reward: 'gems', gemsAdded: 10 };
    }
  }

  getBoostStatus(userId: string) {
    const until = boostStore.get(userId);
    const active = until && new Date() < until;
    const today = new Date().toISOString().split('T')[0];
    const cooldown = adCooldown.get(userId);
    return {
      boostActive: !!active,
      boostUntil: active ? until : null,
      adsWatchedToday: cooldown?.date === today ? cooldown.count : 0,
      adsRemainingToday: MAX_ADS_PER_DAY - (cooldown?.date === today ? cooldown.count : 0),
    };
  }

  hasActiveBoost(userId: string): boolean {
    const until = boostStore.get(userId);
    return !!(until && new Date() < until);
  }
}
