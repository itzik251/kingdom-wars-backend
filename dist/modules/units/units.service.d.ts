import { Repository } from 'typeorm';
import { Unit, UnitType } from './unit.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Building } from '../building/building.entity';
import { AuditService } from '../audit/audit.service';
export declare class UnitsService {
    private unitRepo;
    private kingdomRepo;
    private buildingRepo;
    private auditService;
    constructor(unitRepo: Repository<Unit>, kingdomRepo: Repository<Kingdom>, buildingRepo: Repository<Building>, auditService: AuditService);
    trainUnits(kingdomId: string, unitType: UnitType, amount: number): Promise<{
        unit: Unit;
        trainingEndsAt: Date;
        durationSeconds: number;
    }>;
    getAvailableUnits(barracksLevel: number): {
        goldCost: number;
        foodCost: number;
        upkeep: number;
        attackPower: number;
        defensePower: number;
        trainingTime: number;
        requiredBarracksLevel: number;
        gemsCost?: number;
        requiresVip?: boolean;
        requiresReferralHero?: boolean;
        requiresExploration?: boolean;
        type: string;
    }[];
}
