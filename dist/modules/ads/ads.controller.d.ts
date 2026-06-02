import { AdsService } from './ads.service';
import { KingdomService } from '../kingdom/kingdom.service';
declare class RewardDto {
    type: 'double_production' | 'gems';
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
    } | {
        reward: string;
        gemsAdded: number;
        boostUntil?: undefined;
        adsRemainingToday?: undefined;
    }>;
}
export {};
