import { BuildingService } from './building.service';
import { BuildingType } from './building.entity';
import { KingdomService } from '../kingdom/kingdom.service';
import { QuestService } from '../quest/quest.service';
declare class UpgradeDto {
    type: BuildingType;
    buildingId?: string;
}
export declare class BuildingController {
    private buildingService;
    private kingdomService;
    private questService;
    constructor(buildingService: BuildingService, kingdomService: KingdomService, questService: QuestService);
    getCosts(req: any): Promise<{
        type: BuildingType;
        level: number;
        nextLevelCost: {
            gold: number;
            wood: number;
            stone: number;
        };
        buildTimeSeconds: number;
        isUpgrading: boolean;
        upgradeEndsAt: Date;
    }[]>;
    upgrade(req: any, dto: UpgradeDto): Promise<{
        building: import("./building.entity").Building;
        cost: {
            gold: number;
            wood: number;
            stone: number;
        };
        upgradeEndsAt: Date;
        durationSeconds: number;
    }>;
    speedUp(req: any, dto: UpgradeDto): Promise<{
        gemCost: number;
        newLevel: number;
    }>;
    buildNew(req: any, dto: UpgradeDto): Promise<{
        building: import("./building.entity").Building;
        cost: {
            gold: number;
            wood: number;
            stone: number;
        };
    }>;
    repairCost(req: any, buildingId: string): Promise<{
        cost: {
            gold: number;
            wood: number;
            stone: number;
        };
        repairTimeSeconds: number;
    }>;
    repair(req: any, buildingId: string): Promise<{
        building: import("./building.entity").Building;
        cost: {
            gold: number;
            wood: number;
            stone: number;
        };
        repairEndsAt: Date;
        repairTimeSeconds: number;
    }>;
}
export {};
