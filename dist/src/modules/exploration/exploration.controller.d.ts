import { ExplorationService } from './exploration.service';
import { KingdomService } from '../kingdom/kingdom.service';
export declare class ExplorationController {
    private readonly explorationService;
    private readonly kingdomService;
    constructor(explorationService: ExplorationService, kingdomService: KingdomService);
    private getKingdomId;
    getMap(req: any): Promise<{
        fogRadius: number;
        academyLevel: number;
        explorerCount: number;
        maxExplorers: number;
        explorerTrainingEndsAt: Date;
        activeMissions: import("./exploration-mission.entity").ExplorationMission[];
        returnedMissions: import("./exploration-mission.entity").ExplorationMission[];
        nodes: {
            id: string;
            x: number;
            y: number;
            type: import("./map-node.entity").MapNodeType;
            resourceType: string;
            amount: number;
            heroType: string;
            discovered: boolean;
            lastRaidedAt: Date;
            raidCooldownDays: number;
            canRaid: boolean;
        }[];
        magic: number;
    }>;
    hireExplorer(req: any): Promise<{
        explorerCount: number;
        maxExplorers: number;
        explorerTrainingEndsAt: Date;
        trainingSecs: number;
    }>;
    sendMission(req: any, body: {
        targetX: number;
        targetY: number;
    }): Promise<{
        mission: import("./exploration-mission.entity").ExplorationMission;
        hoursUntilReturn: number;
    }>;
    raidNode(req: any, nodeId: string): Promise<{
        gained: Record<string, number>;
    }>;
    recruitHero(req: any, nodeId: string): Promise<{
        heroType: string;
        count: number;
    }>;
}
