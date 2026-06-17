// ─── packages/shared/constants.ts ────────────────────────────────────────────
// ONE source of truth. Both backend (src/) and frontend (frontend/src/) import from here.
// Never duplicate these values anywhere else.

// ─── Building costs ───────────────────────────────────────────────────────────
export const UPGRADE_COST_MULTIPLIER = 1.25;   // base × 1.25^level

export const BUILDING_BASE_COSTS: Record<string, { gold: number; wood: number; stone: number }> = {
  town_hall:    { gold: 500,  wood: 200,  stone: 200 },
  gold_mine:    { gold: 200,  wood: 100,  stone: 0   },
  lumber_mill:  { gold: 150,  wood: 0,    stone: 100 },
  stone_quarry: { gold: 150,  wood: 100,  stone: 0   },
  farm:         { gold: 100,  wood: 150,  stone: 0   },
  barracks:     { gold: 300,  wood: 200,  stone: 100 },
  academy:      { gold: 500,  wood: 300,  stone: 200 },
  wall:         { gold: 200,  wood: 0,    stone: 400 },
  watch_tower:  { gold: 150,  wood: 200,  stone: 100 },
  hospital:     { gold: 300,  wood: 200,  stone: 100 },
  arcane_tower: { gold: 800,  wood: 400,  stone: 400 },
  gem_forge:    { gold: 0,    wood: 0,    stone: 0   },
};

// ─── Build times ──────────────────────────────────────────────────────────────
export const BUILD_TIME_MULTIPLIER = 1.4;      // base × 1.4^level

export const BUILDING_BASE_TIMES: Record<string, number> = {
  town_hall:    60,
  gold_mine:    30,
  lumber_mill:  30,
  stone_quarry: 30,
  farm:         20,
  barracks:     45,
  academy:      90,
  wall:         40,
  watch_tower:  35,
  hospital:     45,
  arcane_tower: 120,
  gem_forge:    300,
};

// ─── Storage caps ─────────────────────────────────────────────────────────────
export const BASE_STORAGE = { gold: 5000, wood: 4000, stone: 3000, food: 2000 };
export const STORAGE_MULTIPLIER = 3.2;         // TH: base × (1 + (level-1) × 3.2)

// Extra storage per level from production buildings
export const STORAGE_BUMP: Record<string, { field: string; perLevel: number }> = {
  gold_mine:    { field: 'maxGold',  perLevel: 300 },
  lumber_mill:  { field: 'maxWood',  perLevel: 250 },
  stone_quarry: { field: 'maxStone', perLevel: 200 },
  farm:         { field: 'maxFood',  perLevel: 150 },
};

// ─── Resource production ──────────────────────────────────────────────────────
export const PRODUCTION_MULTIPLIER = 1.12;     // +12% per level

export const BASE_PRODUCTION: Record<string, number> = {
  gold_mine:    100,  // gold/hour at level 1
  lumber_mill:  80,
  stone_quarry: 60,
  farm:         50,
};

// ─── Town Hall gates ──────────────────────────────────────────────────────────
export const MAX_BUILDING_LEVEL = 30;
export const TOWN_HALL_GATES: Record<number, number> = {
  1:  3,
  3:  5,
  5:  8,
  8:  12,
  12: 16,
  16: 20,
  20: 25,
  25: 30,
};

// ─── Combat ───────────────────────────────────────────────────────────────────
export const COMBAT_RANDOM_MIN = 0.85;
export const COMBAT_RANDOM_MAX = 1.15;
export const LOOT_PERCENTAGE = 1.0;
export const DEFENDER_LOSS_MAX = 0.20;
export const WALL_DEFENSE_BONUS_PER_LEVEL = 50;
export const NEWBIE_SHIELD_HOURS = 72;
export const POST_ATTACK_SHIELD_HOURS = 1;
export const SNOWBALL_SCORE_RATIO = 3;
export const SNOWBALL_LOOT_PENALTY = 0.5;
export const WEAK_PLAYER_RESOURCE_BONUS = 0.20;

// ─── VIP ──────────────────────────────────────────────────────────────────────
export const VIP_BUILD_TIME_REDUCTION = 0.30;
export const VIP_PRICE_USDT_TON = 5;
export const VIP_DURATION_DAYS = 30;
export const VIP_GAME_PRODUCTION_MULTIPLIER = 1.5;
export const PAYMENT_WALLET_ADDRESS = 'UQBQeWT7nw0KjeKmSbxsmqqgDRh61H-_ZamVc3_I5S1jNX0T';
export const USDT_JETTON_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';

// Backwards compat aliases
export const VIP_PRICE_TON  = VIP_PRICE_USDT_TON;
export const VIP_PRICE_USDT = VIP_PRICE_USDT_TON;
