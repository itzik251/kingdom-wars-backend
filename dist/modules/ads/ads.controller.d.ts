import { AdsService } from './ads.service';
import { KingdomService } from '../kingdom/kingdom.service';
declare class RewardDto {
    type: 'double_production' | 'gems' | 'gold_bonus' | 'wood_bonus' | 'stone_bonus' | 'food_bonus';
}
export declare class AdsController {
    private adsService;
    private kingdomService;
    constructor(adsService: AdsService, kingdomService: KingdomService);
    getStatus(req: any): {
        boostActive: boolean;
        boostUntil: Date;
        adsWatchedToday: number;
        adsRemainingToday: number;
    };
    claimReward(req: any, dto: RewardDto): Promise<{
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
}
export {};
