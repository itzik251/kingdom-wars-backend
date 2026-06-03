import { AdsService } from './ads.service';
import { KingdomService } from '../kingdom/kingdom.service';
declare class RewardDto {
    type: 'double_production' | 'gems' | 'gold_bonus' | 'wood_bonus' | 'stone_bonus' | 'food_bonus';
}
export declare class AdsController {
    private adsService;
    private kingdomService;
    constructor(adsService: AdsService, kingdomService: KingdomService);
    getStatus(req: any): Promise<{
        boostActive: boolean;
        boostUntil: Date;
        adsWatchedToday: number;
        adsRemainingToday: number;
    }>;
    claimReward(req: any, dto: RewardDto): Promise<any>;
}
export {};
