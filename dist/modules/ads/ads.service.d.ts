import { Repository } from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';
export declare class AdsService {
    private kingdomRepo;
    constructor(kingdomRepo: Repository<Kingdom>);
    claimReward(userId: string, kingdomId: string, rewardType: 'double_production' | 'gems'): Promise<{
        reward: string;
        boostUntil: Date;
        adsRemainingToday: number;
        gemsAdded?: undefined;
    } | {
        reward: string;
        gemsAdded: number;
        boostUntil?: undefined;
        adsRemainingToday?: undefined;
    }>;
    getBoostStatus(userId: string): {
        boostActive: boolean;
        boostUntil: Date;
        adsWatchedToday: number;
        adsRemainingToday: number;
    };
    hasActiveBoost(userId: string): boolean;
}
