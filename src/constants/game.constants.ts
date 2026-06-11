import { BuildingType } from '../modules/building/building.entity';
import { UnitType } from '../modules/units/unit.entity';

// ─── Resource Production (per hour at level 1) ───────────────
export const BASE_PRODUCTION: Record<string, number> = {
  gold_mine:    100,
  lumber_mill:  80,
  stone_quarry: 60,
  farm:         50,
};

// +12% per level
export const PRODUCTION_MULTIPLIER = 1.12;

// ─── Building Upgrade Costs ───────────────────────────────────
// Base cost × (1.35)^level
export const BUILDING_BASE_COSTS: Record<BuildingType, { gold: number; wood: number; stone: number }> = {
  [BuildingType.TOWN_HALL]:    { gold: 500,  wood: 200,  stone: 200 },
  [BuildingType.GOLD_MINE]:    { gold: 200,  wood: 100,  stone: 0   },
  [BuildingType.LUMBER_MILL]:  { gold: 150,  wood: 0,    stone: 100 },
  [BuildingType.STONE_QUARRY]: { gold: 150,  wood: 100,  stone: 0   },
  [BuildingType.FARM]:         { gold: 100,  wood: 150,  stone: 0   },
  [BuildingType.BARRACKS]:     { gold: 300,  wood: 200,  stone: 100 },
  [BuildingType.ACADEMY]:      { gold: 500,  wood: 300,  stone: 200 },
  [BuildingType.WALL]:         { gold: 200,  wood: 0,    stone: 400 },
  [BuildingType.WATCH_TOWER]:  { gold: 150,  wood: 200,  stone: 100 },
  [BuildingType.HOSPITAL]:     { gold: 300,  wood: 200,  stone: 100 },
  [BuildingType.ARCANE_TOWER]: { gold: 800,  wood: 400,  stone: 400 },
};

export const UPGRADE_COST_MULTIPLIER = 1.35;

// ─── Build Times (seconds at level 1, × 1.4 per level) ───────
export const BUILDING_BASE_TIMES: Record<BuildingType, number> = {
  [BuildingType.TOWN_HALL]:    60,
  [BuildingType.GOLD_MINE]:    30,
  [BuildingType.LUMBER_MILL]:  30,
  [BuildingType.STONE_QUARRY]: 30,
  [BuildingType.FARM]:         20,
  [BuildingType.BARRACKS]:     45,
  [BuildingType.ACADEMY]:      90,
  [BuildingType.WALL]:         40,
  [BuildingType.WATCH_TOWER]:  35,
  [BuildingType.HOSPITAL]:     45,
  [BuildingType.ARCANE_TOWER]: 120,
};

export const BUILD_TIME_MULTIPLIER = 1.4;

// Max building level — gated by Town Hall level
export const MAX_BUILDING_LEVEL = 30;
export const TOWN_HALL_GATES: Record<number, number> = {
  // townHallLevel → maxBuildingLevel for others
  1:  3,
  3:  5,
  5:  8,
  8:  12,
  12: 16,
  16: 20,
  20: 25,
  25: 30,
};

// ─── Units ───────────────────────────────────────────────────
export interface UnitStats {
  goldCost:     number;
  foodCost:     number;   // one-time food cost to train
  upkeep:       number;   // food/hour
  attackPower:  number;
  defensePower: number;
  trainingTime: number;   // seconds per unit
  requiredBarracksLevel: number;
  gemsCost?:          number;   // VIP units cost gems instead of gold
  requiresVip?:       boolean;
  requiresReferralHero?: boolean; // Ragnar — unlocked only after referral milestone claim
}

export const UNIT_STATS: Record<UnitType, UnitStats> = {
  [UnitType.SPEARMAN]:   { goldCost: 10,  foodCost: 5,  upkeep: 1, attackPower: 1,  defensePower: 1,  trainingTime: 10,  requiredBarracksLevel: 1 },
  [UnitType.ARCHER]:     { goldCost: 20,  foodCost: 8,  upkeep: 1, attackPower: 2,  defensePower: 1,  trainingTime: 20,  requiredBarracksLevel: 1 },
  [UnitType.SWORDSMAN]:  { goldCost: 40,  foodCost: 12, upkeep: 2, attackPower: 4,  defensePower: 3,  trainingTime: 40,  requiredBarracksLevel: 2 },
  [UnitType.CAVALRY]:    { goldCost: 80,  foodCost: 20, upkeep: 3, attackPower: 9,  defensePower: 5,  trainingTime: 80,  requiredBarracksLevel: 3 },
  [UnitType.CATAPULT]:   { goldCost: 200, foodCost: 40, upkeep: 5, attackPower: 15, defensePower: 2,  trainingTime: 200, requiredBarracksLevel: 5 },
  [UnitType.ELITE_GUARD]:{ goldCost: 500, foodCost: 80, upkeep: 8, attackPower: 25, defensePower: 20, trainingTime: 600, requiredBarracksLevel: 8 },
  [UnitType.PALADIN]:     { goldCost: 0, gemsCost: 100, foodCost: 0, upkeep: 5,  attackPower: 80,  defensePower: 60,  trainingTime: 300, requiredBarracksLevel: 3, requiresVip: true },
  [UnitType.DRAGON_RIDER]:{ goldCost: 0, gemsCost: 300, foodCost: 0, upkeep: 15, attackPower: 250, defensePower: 150, trainingTime: 600, requiredBarracksLevel: 5, requiresVip: true },
  // Ragnar — referral hero (first unit given free on claim; additional units cost gems)
  [UnitType.RAGNAR]:      { goldCost: 0, gemsCost: 200, foodCost: 0, upkeep: 20, attackPower: 400, defensePower: 300, trainingTime: 900, requiredBarracksLevel: 3, requiresReferralHero: true },
  // Titan — USDT hero, can attack alone (no minimum squad)
  [UnitType.TITAN]:       { goldCost: 0, gemsCost: 0, foodCost: 0, upkeep: 0, attackPower: 800, defensePower: 600, trainingTime: 0, requiredBarracksLevel: 1, requiresVip: false },
};

// ─── Combat ──────────────────────────────────────────────────
export const COMBAT_RANDOM_MIN = 0.85;
export const COMBAT_RANDOM_MAX = 1.15;

// Winner gets this fraction of defender's resources
export const LOOT_PERCENTAGE = 0.30;

// Max resource loss for the loser
export const DEFENDER_LOSS_MAX = 0.20;

// Wall bonus to defense per wall level
export const WALL_DEFENSE_BONUS_PER_LEVEL = 50;

// ─── Shields ─────────────────────────────────────────────────
export const NEWBIE_SHIELD_HOURS = 72;
export const POST_ATTACK_SHIELD_HOURS = 1;

// ─── Anti-Snowball ────────────────────────────────────────────
// Loot penalty when attacker score >> defender score
export const SNOWBALL_SCORE_RATIO = 3;   // if attacker 3× score of defender
export const SNOWBALL_LOOT_PENALTY = 0.5; // gets 50% less loot

// Weak player bonus
export const WEAK_PLAYER_RESOURCE_BONUS = 0.20;

// ─── Initial Setup ────────────────────────────────────────────
export const INITIAL_BUILDINGS = [
  BuildingType.TOWN_HALL,
  BuildingType.GOLD_MINE,
  BuildingType.LUMBER_MILL,
  BuildingType.STONE_QUARRY,
  BuildingType.FARM,
  BuildingType.BARRACKS,
];

export const INITIAL_UNITS = Object.values(UnitType);

// ─── VIP ─────────────────────────────────────────────────────
export const VIP_BUILD_TIME_REDUCTION = 0.30;  // 30% faster
export const VIP_PRICE_USDT_TON = 5;           // 5 USDT-TON per month
export const VIP_DURATION_DAYS = 30;
// Game wallet TON address (UQ format = non-bounceable, for receiving)
export const PAYMENT_WALLET_ADDRESS = 'UQBQeWT7nw0KjeKmSbxsmqqgDRh61H-_ZamVc3_I5S1jNX0T';
// USDT Jetton master on TON mainnet
export const USDT_JETTON_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
export const VIP_GAME_PRODUCTION_MULTIPLIER = 1.5;

// ─── Backwards compat aliases ────────────────────────────────
export const VIP_PRICE_TON  = VIP_PRICE_USDT_TON;
export const VIP_PRICE_USDT = VIP_PRICE_USDT_TON;
