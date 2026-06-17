import { Repository, DataSource } from 'typeorm';
import { Building, BuildingType } from './building.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { AuditService } from '../audit/audit.service';
export declare class BuildingService {
    private buildingRepo;
    private kingdomRepo;
    private dataSource;
    private auditService;
    constructor(buildingRepo: Repository<Building>, kingdomRepo: Repository<Kingdom>, dataSource: DataSource, auditService: AuditService);
    upgradeBuilding(kingdomId: string, buildingType: BuildingType, isVip?: boolean, buildingId?: string): Promise<{
        building: Building;
        cost: {
            gold: number;
            wood: number;
            stone: number;
        };
        upgradeEndsAt: Date;
        durationSeconds: number;
    }>;
    speedUpUpgrade(kingdomId: string, buildingType: BuildingType, buildingId?: string): Promise<{
        gemCost: number;
        newLevel: number;
    }>;
    getUpgradeCost(type: BuildingType, currentLevel: number): {
        gold: number;
        wood: number;
        stone: number;
    };
    getBuildTime(type: BuildingType, currentLevel: number): number;
    buildNew(kingdomId: string, buildingType: BuildingType): Promise<{
        building: Building;
        cost: {
            gold: number;
            wood: number;
            stone: number;
        };
    }>;
    getRepairCost(type: BuildingType, level: number): {
        cost: {
            gold: number;
            wood: number;
            stone: number;
        };
        repairTimeSeconds: number;
    };
    repairBuilding(kingdomId: string, buildingId: string): Promise<{
        building: Building;
        cost: {
            gold: number;
            wood: number;
            stone: number;
        };
        repairEndsAt: Date;
        repairTimeSeconds: number;
    }>;
    completeRepairs(kingdomId: string): Promise<void>;
    moveBuilding(kingdomId: string, buildingId: string, gridX: number, gridY: number): Promise<{
        id: string;
        gridX: number;
        gridY: number;
    }>;
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
