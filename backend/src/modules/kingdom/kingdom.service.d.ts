import { Repository } from 'typeorm';
import { Kingdom } from './kingdom.entity';
import { Building } from '../building/building.entity';
import { Unit } from '../units/unit.entity';
import { EconomyService } from '../economy/economy.service';
export declare class KingdomService {
    private kingdomRepo;
    private buildingRepo;
    private unitRepo;
    private economyService;
    constructor(kingdomRepo: Repository<Kingdom>, buildingRepo: Repository<Building>, unitRepo: Repository<Unit>, economyService: EconomyService);
    getKingdomByUser(userId: string): Promise<{
        kingdom: Kingdom;
        buildings: Building[];
        units: Unit[];
        productionRates: Record<string, number>;
        shieldActive: boolean;
        shieldUntil: Date;
        isVip: boolean;
    }>;
    buyShield(kingdomId: string): Promise<{
        shieldUntil: Date;
    }>;
    getUsdtBalance(kingdomId: string): Promise<{
        usdtBalance: number;
        gameBalance: number;
    }>;
    withdrawUsdt(kingdomId: string): Promise<{
        success: boolean;
        amount: number;
    }>;
    expandStorage(kingdomId: string): Promise<{
        maxGold: number;
        maxWood: number;
    }>;
}
