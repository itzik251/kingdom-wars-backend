import { Repository } from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Building } from '../building/building.entity';
import { Unit } from '../units/unit.entity';
import { NotificationService } from '../notifications/notification.service';
export declare class EconomyService {
    private kingdomRepo;
    private buildingRepo;
    private unitRepo;
    private notifService;
    constructor(kingdomRepo: Repository<Kingdom>, buildingRepo: Repository<Building>, unitRepo: Repository<Unit>, notifService: NotificationService);
    tickAllKingdoms(): Promise<void>;
    tickKingdom(kingdomId: string, userId?: string): Promise<Kingdom>;
    calculateProduction(buildings: Building[], hours: number): Record<string, number>;
    calculateUpkeep(units: Unit[], hours: number): number;
    private completeBuildingUpgrades;
    private completeUnitTraining;
    getProductionRates(buildings: Building[], kingdom?: Kingdom): Record<string, number>;
}
