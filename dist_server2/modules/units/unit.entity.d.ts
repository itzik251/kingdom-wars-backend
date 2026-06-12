import { Kingdom } from '../kingdom/kingdom.entity';
export declare enum UnitType {
    SPEARMAN = "spearman",
    ARCHER = "archer",
    SWORDSMAN = "swordsman",
    CAVALRY = "cavalry",
    CATAPULT = "catapult",
    ELITE_GUARD = "elite_guard",
    KNIGHT = "knight",
    PALADIN = "paladin",
    DRAGON_RIDER = "dragon_rider",
    RAGNAR = "ragnar",
    TITAN = "titan"
}
export declare const HERO_TYPES: Set<UnitType>;
export declare const HERO_SALARY_GEMS: Record<string, number>;
export declare class Unit {
    id: string;
    kingdom: Kingdom;
    type: UnitType;
    count: number;
    trainingCount: number;
    trainingEndsAt: Date;
    woundedCount: number;
}
