import { CombatService } from './combat.service';
import { KingdomService } from '../kingdom/kingdom.service';
declare class AttackDto {
    defenderKingdomId: string;
}
export declare class CombatController {
    private combatService;
    private kingdomService;
    constructor(combatService: CombatService, kingdomService: KingdomService);
    attack(req: any, dto: AttackDto): Promise<import("./combat.service").BattleReport>;
    getTargets(req: any): Promise<import("../kingdom/kingdom.entity").Kingdom[]>;
    getProfile(req: any, targetId: string): Promise<{
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
            type: import("../building/building.entity").BuildingType;
            level: number;
        }[];
    }>;
}
export {};
