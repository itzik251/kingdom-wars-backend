import { Repository } from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Building } from '../building/building.entity';
import { Unit } from '../units/unit.entity';
export declare class EconomyService {
    private kingdomRepo;
    private buildingRepo;
    private unitRepo;
    constructor(kingdomRepo: Repository<Kingdom>, buildingRepo: Repository<Building>, unitRepo: Repository<Unit>);
    tickAllKingdoms(): Promise<void>;
    tickKingdom(kingdomId: string): Promise<Kingdom>;
    calculateProduction(buildings: Building[], hours: number): Record<string, number>;
    calculateUpkeep(units: Unit[], hours: number): number;
    private completeBuildingUpgrades;
    private completeUnitTraining;
    getProductionRates(buildings: Building[]): Record<string, number>;
}
