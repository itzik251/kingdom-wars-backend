import { Repository } from 'typeorm';
import { Kingdom } from './kingdom.entity';
import { Building } from '../building/building.entity';
import { Unit } from '../units/unit.entity';
import { User } from '../user/user.entity';
import { EconomyService } from '../economy/economy.service';
import { NotificationService } from '../notifications/notification.service';
export declare class KingdomService {
    private kingdomRepo;
    private buildingRepo;
    private unitRepo;
    private userRepo;
    private economyService;
    private notifService;
    constructor(kingdomRepo: Repository<Kingdom>, buildingRepo: Repository<Building>, unitRepo: Repository<Unit>, userRepo: Repository<User>, economyService: EconomyService, notifService: NotificationService);
    getKingdomByUser(userId: string): Promise<{
        kingdom: Kingdom;
        buildings: Building[];
        units: Unit[];
        productionRates: Record<string, number>;
        shieldActive: boolean;
        shieldUntil: Date;
        isVip: boolean;
        workers: number;
        maxWorkers: number;
    }>;
    private getUserPayload;
    private sendBuildDoneNotifs;
    private sendTrainingDoneNotifsRaw;
    buyShield(kingdomId: string): Promise<{
        shieldUntil: Date;
    }>;
    hireWorker(kingdomId: string): Promise<{
        workers: number;
        maxWorkers: number;
    }>;
    fireWorker(kingdomId: string): Promise<{
        workers: number;
    }>;
    expandStorage(kingdomId: string): Promise<{
        maxGold: number;
        maxWood: number;
    }>;
}
