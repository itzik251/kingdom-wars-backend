import { Repository } from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Unit } from '../units/unit.entity';
import { Building, BuildingType } from '../building/building.entity';
import { User } from '../user/user.entity';
import { EconomyService } from '../economy/economy.service';
import { NotificationService } from '../notifications/notification.service';
export interface BattleReport {
    attackerWins: boolean;
    attackerPower: number;
    defenderPower: number;
    loot: {
        gold: number;
        wood: number;
        stone: number;
    };
    attackerLosses: Record<string, number>;
    defenderLosses: Record<string, number>;
    winStreak?: number;
    streakBonus?: number;
}
export declare class CombatService {
    private kingdomRepo;
    private unitRepo;
    private buildingRepo;
    private userRepo;
    private economyService;
    private notifService;
    constructor(kingdomRepo: Repository<Kingdom>, unitRepo: Repository<Unit>, buildingRepo: Repository<Building>, userRepo: Repository<User>, economyService: EconomyService, notifService: NotificationService);
    attack(attackerKingdomId: string, defenderKingdomId: string): Promise<BattleReport>;
    getTargets(myKingdom: Kingdom): Promise<Kingdom[]>;
    getKingdomProfile(myKingdomId: string, targetKingdomId: string): Promise<{
        id: string;
        name: string;
        username: string;
        score: number;
        isShielded: boolean;
        shieldUntil: Date;
        resources: {
            gold: number;
            wood: number;
            stone: number;
        };
        lootable: {
            gold: number;
            wood: number;
            stone: number;
        };
        defPower: number;
        myAttackPower: number;
        winChance: number;
        marchSeconds: number;
        wallLevel: number;
        armySize: number;
        buildings: {
            type: BuildingType;
            level: number;
        }[];
    }>;
    private simulate;
    private calculateLosses;
    private applyBattleResults;
    private random;
}
