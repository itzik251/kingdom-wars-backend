import { KingdomService } from './kingdom.service';
export declare class KingdomController {
    private kingdomService;
    constructor(kingdomService: KingdomService);
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
        maxGold: number;
        maxWood: number;
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
        withdrawalPending: number;
        withdrawalStatus: string;
        withdrawalWallet: string;
    }>;
    requestWithdrawal(req: any, body: {
        walletAddress: string;
    }): Promise<{
        success: boolean;
        amount: number;
        wallet: string;
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
        newLevel: number;
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
    withdrawUsdt(): void;
}
