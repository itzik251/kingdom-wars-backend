import { Repository } from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';
export declare class AdsService {
    private kingdomRepo;
    constructor(kingdomRepo: Repository<Kingdom>);
    claimReward(userId: string, kingdomId: string, rewardType: 'double_production' | 'gems' | 'gold_bonus' | 'wood_bonus' | 'stone_bonus' | 'food_bonus'): Promise<{
        reward: string;
        boostUntil: Date;
        adsRemainingToday: number;
        gemsAdded?: undefined;
        amount?: undefined;
    } | {
        reward: string;
        gemsAdded: number;
        boostUntil?: undefined;
        adsRemainingToday?: undefined;
        amount?: undefined;
    } | {
        reward: "gold_bonus" | "wood_bonus" | "stone_bonus" | "food_bonus";
        amount: number;
        boostUntil?: undefined;
        adsRemainingToday?: undefined;
        gemsAdded?: undefined;
    }>;
    getBoostStatus(userId: string): {
        boostActive: boolean;
        boostUntil: Date;
        adsWatchedToday: number;
        adsRemainingToday: number;
    };
    hasActiveBoost(userId: string): boolean;
}
