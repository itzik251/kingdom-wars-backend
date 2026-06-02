import { Kingdom } from '../kingdom/kingdom.entity';
export declare enum UnitType {
    SPEARMAN = "spearman",
    ARCHER = "archer",
    SWORDSMAN = "swordsman",
    CAVALRY = "cavalry",
    CATAPULT = "catapult",
    ELITE_GUARD = "elite_guard"
}
export declare class Unit {
    id: string;
    kingdom: Kingdom;
    type: UnitType;
    count: number;
    trainingCount: number;
    trainingEndsAt: Date;
}
