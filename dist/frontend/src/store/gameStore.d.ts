export interface Resources {
    gold: number;
    wood: number;
    stone: number;
    food: number;
    gems: number;
    maxGold: number;
    maxWood: number;
    maxStone: number;
    maxFood: number;
}
export interface Building {
    id: string;
    type: string;
    level: number;
    slot?: number;
    upgradeEndsAt: string | null;
    isUpgrading: boolean;
    needsRepair?: boolean;
}
export interface Unit {
    type: string;
    count: number;
    trainingCount: number;
    trainingEndsAt: string | null;
    woundedCount?: number;
}
export interface Kingdom extends Resources {
    id: string;
    name: string;
    score: number;
    shieldUntil: string | null;
    shieldActive: boolean;
    lastResourceTick: string;
    isVip?: boolean;
    workers: number;
    maxWorkers: number;
    usdtBalance?: number;
    attackSpeedBoostUntil?: string | null;
    productionBoostUntil?: string | null;
}
interface GameState {
    token: string | null;
    kingdom: Kingdom | null;
    buildings: Building[];
    units: Unit[];
    productionRates: Record<string, number>;
    isLoading: boolean;
    activeScreen: 'home' | 'repair' | 'army' | 'attack' | 'alliance' | 'referral' | 'shop' | 'leaderboard' | 'quests' | 'worldmap';
    setToken: (token: string) => void;
    setScreen: (screen: GameState['activeScreen']) => void;
    loadKingdom: () => Promise<void>;
    refresh: () => Promise<void>;
}
export declare const useGameStore: import("zustand").UseBoundStore<import("zustand").StoreApi<GameState>>;
export {};
