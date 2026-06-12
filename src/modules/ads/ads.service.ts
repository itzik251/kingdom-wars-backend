import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';
import { QuestService } from '../quest/quest.service';

const MAX_ADS_PER_DAY = 30;
const BOOST_DURATION_HOURS = 1;

@Injectable()
export class AdsService {
  private readonly logger = new Logger(AdsService.name);

  constructor(
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
    @InjectDataSource() private dataSource: DataSource,
    private questService: QuestService,
  ) {}

  async verifyAdsgramToken(token: string): Promise<boolean> {
    try {
      const res = await fetch(`https://api.adsgram.ai/adv?token=${encodeURIComponent(token)}`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) return false;
      const data = await res.json();
      return data?.done === true;
    } catch {
      return true; // allow on network error
    }
  }

  async claimReward(
    userId: string,
    kingdomId: string,
    rewardType: string,
    adsgramToken?: string,
  ) {
    // ── Replay protection: token must be unique ───────────────────────────────
    if (adsgramToken && adsgramToken.length > 5) {
      const already = await this.dataSource.query(
        `SELECT 1 FROM ad_reward_tokens WHERE token = $1 LIMIT 1`,
        [adsgramToken],
      ).catch(() => []);
      if (already.length > 0) {
        throw new BadRequestException('TOKEN_ALREADY_USED');
      }
      await this.dataSource.query(
        `INSERT INTO ad_reward_tokens(token, kingdom_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,
        [adsgramToken, kingdomId],
      ).catch(() => {});
    }

    // ── Transaction with pessimistic lock — prevents race conditions ──────────
    return this.dataSource.transaction(async (manager) => {
      const kingdom = await manager.findOne(Kingdom, {
        where: { id: kingdomId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!kingdom) throw new BadRequestException('Kingdom not found');

      const today = new Date().toISOString().split('T')[0];

      // Reset counter on new day
      if (kingdom.adsWatchedDate !== today) {
        kingdom.adsWatchedToday = 0;
        kingdom.adsWatchedDate = today;
      }

      // Check daily limit
      if (kingdom.adsWatchedToday >= MAX_ADS_PER_DAY) {
        throw new BadRequestException('ADS_DAILY_LIMIT');
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
      } else if (rewardType === 'double_attack_speed') {
        const until = new Date(Date.now() + BOOST_DURATION_HOURS * 3_600_000);
        kingdom.attackSpeedBoostUntil = until;
        result = {
          reward: 'double_attack_speed',
          boostUntil: until,
          adsRemainingToday: MAX_ADS_PER_DAY - kingdom.adsWatchedToday,
        };
      } else if (rewardType === 'usdt_bonus') {
        kingdom.usdtBalance = parseFloat(((kingdom.usdtBalance || 0) + 0.001).toFixed(6));
        result = { reward: 'usdt_bonus', usdtAdded: 0.001 };
      } else if (rewardType === 'gems') {
        kingdom.gems += 10;
        result = { reward: 'gems', gemsAdded: 10 };
      } else {
        const resourceBonuses: Record<string, { amount: number; apply: (k: Kingdom, v: number) => void }> = {
          gold_bonus:  { amount: 500, apply: (k, v) => { k.gold  = Math.min(k.maxGold,  k.gold  + v); } },
          wood_bonus:  { amount: 500, apply: (k, v) => { k.wood  = Math.min(k.maxWood,  k.wood  + v); } },
          stone_bonus: { amount: 500, apply: (k, v) => { k.stone = Math.min(k.maxStone, k.stone + v); } },
          food_bonus:  { amount: 500, apply: (k, v) => { k.food  = Math.min(k.maxFood,  k.food  + v); } },
        };
        const bonus = resourceBonuses[rewardType];
        if (!bonus) throw new BadRequestException('Invalid reward type');
        bonus.apply(kingdom, bonus.amount);
        result = { reward: rewardType, amount: bonus.amount };
      }

      await manager.save(Kingdom, kingdom);

      this.logger.log(`Ad reward: kingdom=${kingdomId} type=${rewardType} ads=${kingdom.adsWatchedToday}/${MAX_ADS_PER_DAY}`);

      if (rewardType === 'gold_bonus') {
        this.questService.incrementQuest(kingdomId, 'collect_gold_1000', 500).catch(() => {});
      }

      return result;
    });
  }

  async getBoostStatus(kingdomId: string) {
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    if (!kingdom) {
      return {
        boostActive: false, boostUntil: null,
        attackBoostActive: false, attackBoostUntil: null,
        adsWatchedToday: 0, adsRemainingToday: MAX_ADS_PER_DAY,
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const adsToday = kingdom.adsWatchedDate === today ? kingdom.adsWatchedToday : 0;

    const until = kingdom.productionBoostUntil ? new Date(kingdom.productionBoostUntil) : null;
    const active = !!(until && new Date() < until);

    const attackUntil = kingdom.attackSpeedBoostUntil ? new Date(kingdom.attackSpeedBoostUntil) : null;
    const attackBoostActive = !!(attackUntil && new Date() < attackUntil);

    return {
      boostActive: active,
      boostUntil: active ? until : null,
      attackBoostActive,
      attackBoostUntil: attackBoostActive ? attackUntil : null,
      adsWatchedToday: adsToday,
      adsRemainingToday: MAX_ADS_PER_DAY - adsToday,
    };
  }
}
