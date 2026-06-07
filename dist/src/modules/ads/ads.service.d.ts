import { Repository } from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';
import { QuestService } from '../quest/quest.service';
export declare class AdsService {
    private kingdomRepo;
    private questService;
    constructor(kingdomRepo: Repository<Kingdom>, questService: QuestService);
    verifyAdsgramToken(token: string): Promise<boolean>;
    claimReward(userId: string, kingdomId: string, rewardType: 'double_production' | 'double_attack_speed' | 'usdt_bonus' | 'gems' | 'gold_bonus' | 'wood_bonus' | 'stone_bonus' | 'food_bonus'): Promise<any>;
    getBoostStatus(kingdomId: string): Promise<{
        boostActive: boolean;
        boostUntil: any;
        adsWatchedToday: number;
        adsRemainingToday: number;
        attackBoostActive?: undefined;
        attackBoostUntil?: undefined;
    } | {
        boostActive: boolean;
        boostUntil: Date;
        attackBoostActive: boolean;
        attackBoostUntil: Date;
        adsWatchedToday: number;
        adsRemainingToday: number;
    }>;
}
