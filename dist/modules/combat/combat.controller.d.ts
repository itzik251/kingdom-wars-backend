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
}
export {};
