import { BuildingService } from './building.service';
import { BuildingType } from './building.entity';
import { KingdomService } from '../kingdom/kingdom.service';
declare class UpgradeDto {
    type: BuildingType;
}
export declare class BuildingController {
    private buildingService;
    private kingdomService;
    constructor(buildingService: BuildingService, kingdomService: KingdomService);
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
}
export {};
