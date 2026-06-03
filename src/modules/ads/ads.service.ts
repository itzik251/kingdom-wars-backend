import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';
import { QuestService } from '../quest/quest.service';

const MAX_ADS_PER_DAY = 10;
const BOOST_DURATION_HOURS = 1;

@Injectable()
export class AdsService {
  constructor(
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
    private questService: QuestService,
  ) {}

  async claimReward(userId: string, kingdomId: string, rewardType: 'double_production' | 'gems' | 'gold_bonus' | 'wood_bonus' | 'stone_bonus' | 'food_bonus') {
    const today = new Date().toISOString().split('T')[0];

    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    if (!kingdom) throw new BadRequestException('Kingdom not found');

    // Reset the daily counter when the date rolls over.
    if (kingdom.adsWatchedDate !== today) {
      kingdom.adsWatchedToday = 0;
      kingdom.adsWatchedDate = today;
    }

    if (kingdom.adsWatchedToday >= MAX_ADS_PER_DAY) {
      throw new BadRequestException(`מקסימום ${MAX_ADS_PER_DAY} פרסומות ליום`);
    }

    kingdom.adsWatchedToday += 1;

    let result: any;

    if (rewardType === 'double_production') {
      const until = new Date(Date.now() + BOOST_DURATION_HOURS * 3_600_000);
      kingdom.productionBoostUntil = until;
      result = {
        reward: 'double_production',
        boostUntil: until,
        adsRemainingToday: MAX_ADS_PER_DAY - kingdom.adsWatchedToday,
      };
    } else if (rewardType === 'gems') {
      kingdom.gems += 10;
      result = { reward: 'gems', gemsAdded: 10 };
    } else {
      const resourceBonuses: Record<string, { amount: number; apply: (k: Kingdom, v: number) => void }> = {
        gold_bonus:  { amount: 500, apply: (k, v) => { k.gold  = Math.min(k.maxGold,  k.gold  + v); } },
        wood_bonus:  { amount: 400, apply: (k, v) => { k.wood  = Math.min(k.maxWood,  k.wood  + v); } },
        stone_bonus: { amount: 300, apply: (k, v) => { k.stone = Math.min(k.maxStone, k.stone + v); } },
        food_bonus:  { amount: 200, apply: (k, v) => { k.food  = Math.min(k.maxFood,  k.food  + v); } },
      };
      const bonus = resourceBonuses[rewardType];
      if (!bonus) throw new BadRequestException('Invalid reward type');
      bonus.apply(kingdom, bonus.amount);
      result = { reward: rewardType, amount: bonus.amount };
    }

    // Single save includes the adsWatchedToday update and the reward.
    await this.kingdomRepo.save(kingdom);

    // Track the gold-collection quest when the player claims gold.
    if (rewardType === 'gold_bonus') {
      await this.questService.incrementQuest(kingdomId, 'collect_gold_1000', 500).catch(() => {});
    }

    return result;
  }

  async getBoostStatus(kingdomId: string) {
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    if (!kingdom) {
      return { boostActive: false, boostUntil: null, adsWatchedToday: 0, adsRemainingToday: MAX_ADS_PER_DAY };
    }

    const today = new Date().toISOString().split('T')[0];
    const adsToday = kingdom.adsWatchedDate === today ? kingdom.adsWatchedToday : 0;
    const until = kingdom.productionBoostUntil ? new Date(kingdom.productionBoostUntil) : null;
    const active = !!(until && new Date() < until);

    return {
      boostActive: active,
      boostUntil: active ? until : null,
      adsWatchedToday: adsToday,
      adsRemainingToday: MAX_ADS_PER_DAY - adsToday,
    };
  }
}
