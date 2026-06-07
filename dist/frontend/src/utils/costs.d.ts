export interface Cost {
    gold: number;
    wood: number;
    stone: number;
}
export declare const BUILDING_BASE_COSTS: Record<string, Cost>;
export declare function upgradeCost(type: string, currentLevel: number): Cost;
export declare const RESOURCE_META: Record<keyof Cost, {
    emoji: string;
    color: string;
}>;
