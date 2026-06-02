import { Repository } from 'typeorm';
import { Building, BuildingType } from './building.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
export declare class BuildingService {
    private buildingRepo;
    private kingdomRepo;
    constructor(buildingRepo: Repository<Building>, kingdomRepo: Repository<Kingdom>);
    upgradeBuilding(kingdomId: string, buildingType: BuildingType, isVip?: boolean): Promise<{
        building: Building;
        cost: {
            gold: number;
            wood: number;
            stone: number;
        };
        upgradeEndsAt: Date;
        durationSeconds: number;
    }>;
    speedUpUpgrade(kingdomId: string, buildingType: BuildingType): Promise<{
        gemCost: number;
        newLevel: number;
    }>;
    getUpgradeCost(type: BuildingType, currentLevel: number): {
        gold: number;
        wood: number;
        stone: number;
    };
    getBuildTime(type: BuildingType, currentLevel: number): number;
    getAllUpgradeCosts(kingdomId: string): Promise<{
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
}
