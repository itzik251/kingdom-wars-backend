import { AdsService } from './ads.service';
import { KingdomService } from '../kingdom/kingdom.service';
declare class RewardDto {
    type: 'double_production' | 'double_attack_speed' | 'usdt_bonus' | 'gems' | 'gold_bonus' | 'wood_bonus' | 'stone_bonus' | 'food_bonus';
    adsgramToken?: string;
}
export declare class AdsController {
    private adsService;
    private kingdomService;
    constructor(adsService: AdsService, kingdomService: KingdomService);
    getStatus(req: any): Promise<{
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
    claimReward(req: any, dto: RewardDto): Promise<any>;
}
export {};
