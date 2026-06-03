import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quest, QuestPeriod } from './quest.entity';
import { Kingdom } from '../kingdom/kingdom.entity';

const DAILY_QUESTS = [
  { key: 'collect_gold_1000',   target: 1000,  rewardGems: 10 },
  { key: 'upgrade_building',    target: 1,     rewardGems: 15 },
  { key: 'perform_attack',      target: 1,     rewardGems: 20 },
];

const WEEKLY_QUESTS = [
  { key: 'train_500_soldiers',  target: 500,   rewardGems: 100 },
  { key: 'win_20_battles',      target: 20,    rewardGems: 200 },
];

@Injectable()
export class QuestService {
  constructor(
    @InjectRepository(Quest) private questRepo: Repository<Quest>,
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
  ) {}

  async getDailyQuests(kingdomId: string) {
    const today = new Date().toISOString().split('T')[0];
    return this.ensureQuests(kingdomId, DAILY_QUESTS, QuestPeriod.DAILY, today);
  }

  async getWeeklyQuests(kingdomId: string) {
    const weekStart = this.getWeekStart();
    return this.ensureQuests(kingdomId, WEEKLY_QUESTS, QuestPeriod.WEEKLY, weekStart);
  }

  async incrementQuest(kingdomId: string, questKey: string, amount = 1) {
    // A quest key may belong to the daily set (periodDate = today) or the
    // weekly set (periodDate = weekStart). Make sure the rows exist for the
    // current period, then increment whichever one matches this key.
    const today = new Date().toISOString().split('T')[0];
    const weekStart = this.getWeekStart();
    const isWeekly = WEEKLY_QUESTS.some(q => q.key === questKey);
    const periodDate = isWeekly ? weekStart : today;

    if (isWeekly) {
      await this.ensureQuests(kingdomId, WEEKLY_QUESTS, QuestPeriod.WEEKLY, weekStart);
    } else {
      await this.ensureQuests(kingdomId, DAILY_QUESTS, QuestPeriod.DAILY, today);
    }

    const quest = await this.questRepo.findOne({
      where: { kingdom: { id: kingdomId }, questKey, periodDate },
    });
    if (!quest || quest.completed) return;

    quest.progress = Math.min(quest.target, quest.progress + amount);
    if (quest.progress >= quest.target) quest.completed = true;
    await this.questRepo.save(quest);
  }

  async claimReward(kingdomId: string, questId: string) {
    const quest = await this.questRepo.findOne({ where: { id: questId, kingdom: { id: kingdomId } } });
    if (!quest?.completed || quest.rewardClaimed) return null;

    const questDef = [...DAILY_QUESTS, ...WEEKLY_QUESTS].find(q => q.key === quest.questKey);
    if (!questDef) return null;

    quest.rewardClaimed = true;
    await this.questRepo.save(quest);

    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    kingdom.gems += questDef.rewardGems;
    await this.kingdomRepo.save(kingdom);

    return { gemsRewarded: questDef.rewardGems };
  }

  private async ensureQuests(kingdomId: string, defs: any[], period: QuestPeriod, periodDate: string) {
    const existing = await this.questRepo.find({
      where: { kingdom: { id: kingdomId }, period, periodDate },
    });

    const toCreate = defs.filter(d => !existing.find(e => e.questKey === d.key));
    if (toCreate.length > 0) {
      await this.questRepo.save(
        toCreate.map(d =>
          this.questRepo.create({
            kingdom: { id: kingdomId } as any,
            questKey: d.key,
            period,
            target: d.target,
            periodDate,
          }),
        ),
      );
    }

    return this.questRepo.find({
      where: { kingdom: { id: kingdomId }, period, periodDate },
    });
  }

  private getWeekStart(): string {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
  }
}
