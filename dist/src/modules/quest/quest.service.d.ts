import { Repository } from 'typeorm';
import { Quest } from './quest.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
export declare class QuestService {
    private questRepo;
    private kingdomRepo;
    constructor(questRepo: Repository<Quest>, kingdomRepo: Repository<Kingdom>);
    getDailyQuests(kingdomId: string): Promise<Quest[]>;
    getWeeklyQuests(kingdomId: string): Promise<Quest[]>;
    incrementQuest(kingdomId: string, questKey: string, amount?: number): Promise<void>;
    claimReward(kingdomId: string, questId: string): Promise<{
        gemsRewarded: number;
    }>;
    private ensureQuests;
    private getWeekStart;
}
