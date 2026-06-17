import { KingdomService } from './kingdom.service';
import { WithdrawalService } from '../withdrawal/withdrawal.service';
export declare class KingdomController {
    private kingdomService;
    private withdrawalService;
    constructor(kingdomService: KingdomService, withdrawalService: WithdrawalService);
    getMyKingdom(req: any): Promise<{
        kingdom: import("./kingdom.entity").Kingdom;
        buildings: import("../building/building.entity").Building[];
        units: import("../units/unit.entity").Unit[];
        productionRates: Record<string, number>;
        shieldActive: boolean;
        shieldUntil: Date;
        isVip: boolean;
        workers: number;
        maxWorkers: number;
    }>;
    buyShield(req: any): Promise<{
        shieldUntil: Date;
    }>;
    expandStorage(req: any): Promise<{
        storageBoostUntil: Date;
    }>;
    hireWorker(req: any): Promise<{
        workers: number;
        maxWorkers: number;
    }>;
    fireWorker(req: any): Promise<{
        workers: number;
    }>;
    renameKingdom(req: any, body: {
        name: string;
    }): Promise<{
        name: string;
    }>;
    getUsdtBalance(req: any): Promise<{
        usdtBalance: number;
        withdrawalStatus: string;
        withdrawalPending: number;
        withdrawalWallet: string;
        history: import("../withdrawal/withdrawal.entity").Withdrawal[];
    }>;
    requestWithdrawal(req: any, body: {
        walletAddress: string;
        amount: number;
    }): Promise<{
        success: boolean;
        id: string;
        amount: number;
        status: string;
    }>;
    buildGemForge(req: any): Promise<{
        id: string;
        level: number;
        usdtBalance: number;
    }>;
    upgradeGemForge(req: any, body: {
        buildingId: string;
    }): Promise<{
        id: string;
        level: number;
        upgradeEndsAt: Date;
        usdtBalance: number;
    }>;
    buyGems(req: any, body: {
        gems: number;
    }): Promise<{
        gemsAdded: number;
        gems: number;
        usdtBalance: number;
    }>;
    buyTitan(req: any): Promise<{
        trainingCount: number;
        trainingEndsAt: Date;
        usdtBalance: number;
    }>;
    buyGiant(req: any): Promise<{
        trainingCount: number;
        trainingEndsAt: Date;
        usdtBalance: number;
    }>;
    getMessages(req: any): Promise<{
        id: string;
        type: string;
        text: string;
        read: boolean;
        createdAt: Date;
    }[]>;
    clearMessages(req: any): Promise<void>;
    withdrawUsdt(): void;
}
