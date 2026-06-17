// ─── packages/shared/formulas.ts ─────────────────────────────────────────────
// All game formulas in one place. Import from here — never recalculate inline.

import {
  UPGRADE_COST_MULTIPLIER,
  BUILD_TIME_MULTIPLIER,
  BUILDING_BASE_COSTS,
  BUILDING_BASE_TIMES,
  PRODUCTION_MULTIPLIER,
  BASE_PRODUCTION,
  BASE_STORAGE,
  STORAGE_MULTIPLIER,
  VIP_BUILD_TIME_REDUCTION,
} from './constants';

export interface Cost { gold: number; wood: number; stone: number; }

// Cost to upgrade a building from currentLevel → currentLevel+1
export function upgradeCost(type: string, currentLevel: number): Cost {
  const base = BUILDING_BASE_COSTS[type] || { gold: 0, wood: 0, stone: 0 };
  const mult = Math.pow(UPGRADE_COST_MULTIPLIER, currentLevel);
  return {
    gold:  Math.floor(base.gold  * mult),
    wood:  Math.floor(base.wood  * mult),
    stone: Math.floor(base.stone * mult),
  };
}

// Build time in seconds for an upgrade at currentLevel
export function buildTime(type: string, currentLevel: number, isVip = false): number {
  const base = BUILDING_BASE_TIMES[type] ?? 60;
  const seconds = Math.floor(base * Math.pow(BUILD_TIME_MULTIPLIER, currentLevel));
  return isVip ? Math.floor(seconds * (1 - VIP_BUILD_TIME_REDUCTION)) : seconds;
}

// Town Hall storage caps at a given TH level
export function storageMax(thLevel: number): { gold: number; wood: number; stone: number; food: number } {
  const mult = 1 + (thLevel - 1) * STORAGE_MULTIPLIER;
  return {
    gold:  Math.floor(BASE_STORAGE.gold  * mult),
    wood:  Math.floor(BASE_STORAGE.wood  * mult),
    stone: Math.floor(BASE_STORAGE.stone * mult),
    food:  Math.floor(BASE_STORAGE.food  * mult),
  };
}

// Production per hour for a building at a given level
export function productionPerHour(type: string, level: number): number {
  const base = BASE_PRODUCTION[type];
  if (!base) return 0;
  return base * Math.pow(PRODUCTION_MULTIPLIER, level - 1);
}

// Total production over hoursElapsed, with optional bonus multiplier
export function productionTotal(type: string, level: number, hoursElapsed: number, bonus = 1): number {
  return productionPerHour(type, level) * hoursElapsed * bonus;
}
