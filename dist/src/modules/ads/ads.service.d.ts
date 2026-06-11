import { Repository, DataSource } from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';
import { QuestService } from '../quest/quest.service';
export declare class AdsService {
    private kingdomRepo;
    private dataSource;
    private questService;
    private readonly logger;
    constructor(kingdomRepo: Repository<Kingdom>, dataSource: DataSource, questService: QuestService);
    verifyAdsgramToken(token: string): Promise<boolean>;
    claimReward(userId: string, kingdomId: string, rewardType: string, adsgramToken?: string): Promise<any>;
    getBoostStatus(kingdomId: string): Promise<{
        boostActive: boolean;
        boostUntil: Date;
        attackBoostActive: boolean;
        attackBoostUntil: Date;
        adsWatchedToday: number;
        adsRemainingToday: number;
    }>;
}
