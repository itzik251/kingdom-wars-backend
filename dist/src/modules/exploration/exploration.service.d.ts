import { Repository } from 'typeorm';
import { MapNode, MapNodeType } from './map-node.entity';
import { ExplorationMission } from './exploration-mission.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Building } from '../building/building.entity';
import { Unit } from '../units/unit.entity';
import { NotificationService } from '../notifications/notification.service';
export declare function fogRadius(explorerCount: number, academyLevel: number): number;
export declare function generateKingdomMap(kingdomId: string): Omit<MapNode, 'id' | 'discovered' | 'discoveredAt' | 'lastRaidedAt'>[];
export declare class ExplorationService {
    private nodeRepo;
    private missionRepo;
    private kingdomRepo;
    private buildingRepo;
    private unitRepo;
    private notificationService;
    constructor(nodeRepo: Repository<MapNode>, missionRepo: Repository<ExplorationMission>, kingdomRepo: Repository<Kingdom>, buildingRepo: Repository<Building>, unitRepo: Repository<Unit>, notificationService: NotificationService);
    resetMap(kingdomId: string): Promise<void>;
    private ensureMap;
    getMap(kingdomId: string): Promise<{
        fogRadius: number;
        academyLevel: number;
        explorerCount: number;
        maxExplorers: number;
        explorerTrainingEndsAt: Date;
        activeMissions: ExplorationMission[];
        returnedMissions: ExplorationMission[];
        nodes: {
            id: string;
            x: number;
            y: number;
            type: MapNodeType;
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
    hireExplorer(kingdomId: string): Promise<{
        explorerCount: number;
        maxExplorers: number;
        explorerTrainingEndsAt: Date;
        trainingSecs: number;
    }>;
    sendMission(kingdomId: string, targetX: number, targetY: number): Promise<{
        mission: ExplorationMission;
        hoursUntilReturn: number;
    }>;
    completeMissions(): Promise<void>;
    private discoveryChance;
    private processMissionReturn;
    raidNode(kingdomId: string, nodeId: string): Promise<{
        gained: Record<string, number>;
    }>;
    recruitHero(kingdomId: string, nodeId: string): Promise<{
        heroType: string;
        count: number;
    }>;
    private canRaid;
}
