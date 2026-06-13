import { Repository } from 'typeorm';
import { Kingdom } from './kingdom.entity';
import { Building } from '../building/building.entity';
import { Unit } from '../units/unit.entity';
import { User } from '../user/user.entity';
import { EconomyService } from '../economy/economy.service';
import { NotificationService } from '../notifications/notification.service';
import { AuditService } from '../audit/audit.service';
export declare class KingdomService {
    private kingdomRepo;
    private buildingRepo;
    private unitRepo;
    private userRepo;
    private economyService;
    private notifService;
    private auditService;
    constructor(kingdomRepo: Repository<Kingdom>, buildingRepo: Repository<Building>, unitRepo: Repository<Unit>, userRepo: Repository<User>, economyService: EconomyService, notifService: NotificationService, auditService: AuditService);
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
    private sendBuildDoneNotifsRaw;
    private sendTrainingDoneNotifsRaw;
    getUsdtBalance(kingdomId: string): Promise<{
        usdtBalance: number;
        gameBalance: number;
    }>;
    requestWithdrawal(kingdomId: string, walletAddress: string): Promise<{
        success: boolean;
        amount: number;
        wallet: string;
        status: string;
    }>;
    getWithdrawalStatus(kingdomId: string): Promise<{
        usdtBalance: number;
        withdrawalPending: number;
        withdrawalStatus: string;
        withdrawalWallet: string;
    }>;
    withdrawUsdt(kingdomId: string): Promise<void>;
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
    renameKingdom(kingdomId: string, name: string): Promise<{
        name: string;
    }>;
    buyTitanHero(kingdomId: string): Promise<{
        trainingCount: number;
        trainingEndsAt: Date;
        usdtBalance: number;
    }>;
    buyGiantHero(kingdomId: string): Promise<{
        trainingCount: number;
        trainingEndsAt: Date;
        usdtBalance: number;
    }>;
    buyGems(kingdomId: string, gems: number): Promise<{
        gemsAdded: number;
        gems: number;
        usdtBalance: number;
    }>;
    buildGemForge(kingdomId: string): Promise<{
        id: string;
        level: number;
        usdtBalance: number;
    }>;
    upgradeGemForge(kingdomId: string, buildingId: string): Promise<{
        id: string;
        level: number;
        upgradeEndsAt: Date;
        usdtBalance: number;
    }>;
    expandStorage(kingdomId: string): Promise<{
        maxGold: number;
        maxWood: number;
    }>;
}
