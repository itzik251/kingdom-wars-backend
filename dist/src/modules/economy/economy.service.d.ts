import { Repository } from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Building } from '../building/building.entity';
import { Unit } from '../units/unit.entity';
import { User } from '../user/user.entity';
import { AllianceMember } from '../alliance/alliance-member.entity';
import { NotificationService } from '../notifications/notification.service';
import { Notification } from '../notifications/notification.entity';
export declare class EconomyService {
    private kingdomRepo;
    private buildingRepo;
    private unitRepo;
    private userRepo;
    private notifRepo;
    private allianceMemberRepo;
    private notifService;
    constructor(kingdomRepo: Repository<Kingdom>, buildingRepo: Repository<Building>, unitRepo: Repository<Unit>, userRepo: Repository<User>, notifRepo: Repository<Notification>, allianceMemberRepo: Repository<AllianceMember>, notifService: NotificationService);
    tickAllKingdoms(): Promise<void>;
    tickKingdom(kingdomId: string, userId?: string, userObj?: any): Promise<Kingdom>;
    calculateProduction(buildings: Building[], hours: number): Record<string, number>;
    calculateUpkeep(units: Unit[], hours: number): number;
    private completeBuildingUpgrades;
    private completeUnitTraining;
    private completeRepairs;
    getProductionRates(buildings: Building[], kingdom?: Kingdom, units?: {
        type: string;
        count: number;
    }[]): Record<string, number>;
}
