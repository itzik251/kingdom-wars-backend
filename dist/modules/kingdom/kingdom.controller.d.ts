import { KingdomService } from './kingdom.service';
export declare class KingdomController {
    private kingdomService;
    constructor(kingdomService: KingdomService);
    getMyKingdom(req: any): Promise<{
        kingdom: import("./kingdom.entity").Kingdom & {
            isVip: boolean;
        };
        buildings: import("../building/building.entity").Building[];
        units: import("../units/unit.entity").Unit[];
        productionRates: Record<string, number>;
        shieldActive: boolean;
        shieldUntil: Date;
    }>;
    buyShield(req: any): Promise<{
        shieldUntil: Date;
    }>;
    expandStorage(req: any): Promise<{
        maxGold: number;
        maxWood: number;
    }>;
}
