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
    }>;
    buyShield(req: any): Promise<{
        shieldUntil: Date;
    }>;
    expandStorage(req: any): Promise<{
        maxGold: number;
        maxWood: number;
    }>;
    getUsdtBalance(req: any): Promise<{
        usdtBalance: number;
        gameBalance: number;
    }>;
    withdrawUsdt(req: any): Promise<{
        success: boolean;
        amount: number;
    }>;
}
