import { QuestService } from './quest.service';
import { KingdomService } from '../kingdom/kingdom.service';
export declare class QuestController {
    private questService;
    private kingdomService;
    constructor(questService: QuestService, kingdomService: KingdomService);
    daily(req: any): Promise<import("./quest.entity").Quest[]>;
    weekly(req: any): Promise<import("./quest.entity").Quest[]>;
    claim(req: any, questId: string): Promise<{
        gemsRewarded: number;
    }>;
}
