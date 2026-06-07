import { Repository } from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';
import { QuestService } from '../quest/quest.service';
export declare class AdsService {
    private kingdomRepo;
    private questService;
    constructor(kingdomRepo: Repository<Kingdom>, questService: QuestService);
    claimReward(userId: string, kingdomId: string, rewardType: 'double_production' | 'gems' | 'gold_bonus' | 'wood_bonus' | 'stone_bonus' | 'food_bonus'): Promise<any>;
    getBoostStatus(kingdomId: string): Promise<{
        boostActive: boolean;
        boostUntil: Date;
        adsWatchedToday: number;
        adsRemainingToday: number;
    }>;
}
