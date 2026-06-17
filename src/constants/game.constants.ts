// ─── src/constants/game.constants.ts ─────────────────────────────────────────
// Re-exports from shared + backend-only items (enums, entities, UNIT_STATS).
// DO NOT put numeric constants or formulas here — edit packages/shared/constants.ts instead.

import { BuildingType } from '../modules/building/building.entity';
import { UnitType } from '../modules/units/unit.entity';

export { BuildingType, UnitType };

// Re-export all shared constants so existing imports continue to work unchanged
export {
  UPGRADE_COST_MULTIPLIER,
  BUILD_TIME_MULTIPLIER,
  BUILDING_BASE_TIMES,
  BASE_STORAGE,
  STORAGE_MULTIPLIER,
  STORAGE_BUMP,
  PRODUCTION_MULTIPLIER,
  BASE_PRODUCTION,
  MAX_BUILDING_LEVEL,
  TOWN_HALL_GATES,
  COMBAT_RANDOM_MIN,
  COMBAT_RANDOM_MAX,
  LOOT_PERCENTAGE,
  DEFENDER_LOSS_MAX,
  WALL_DEFENSE_BONUS_PER_LEVEL,
  NEWBIE_SHIELD_HOURS,
  POST_ATTACK_SHIELD_HOURS,
  SNOWBALL_SCORE_RATIO,
  SNOWBALL_LOOT_PENALTY,
  WEAK_PLAYER_RESOURCE_BONUS,
  VIP_BUILD_TIME_REDUCTION,
  VIP_PRICE_USDT_TON,
  VIP_DURATION_DAYS,
  VIP_GAME_PRODUCTION_MULTIPLIER,
  PAYMENT_WALLET_ADDRESS,
  USDT_JETTON_MASTER,
  VIP_PRICE_TON,
  VIP_PRICE_USDT,
  upgradeCost,
  buildTime,
  storageMax,
  productionPerHour,
  productionTotal,
} from '../../packages/shared';

// Re-export BUILDING_BASE_COSTS with BuildingType keys for backend type safety
import { BUILDING_BASE_COSTS as _BBC } from '../../packages/shared';
export const BUILDING_BASE_COSTS: Record<BuildingType, { gold: number; wood: number; stone: number }> =
  _BBC as Record<BuildingType, { gold: number; wood: number; stone: number }>;

// ─── Units (backend-only — UnitType enum required) ────────────────────────────
export interface UnitStats {
  goldCost:     number;
  foodCost:     number;
  upkeep:       number;
  attackPower:  number;
  defensePower: number;
  trainingTime: number;
  requiredBarracksLevel: number;
  gemsCost?:             number;
  requiresVip?:          boolean;
  requiresReferralHero?: boolean;
  requiresExploration?:  boolean;
}

export const UNIT_STATS: Record<UnitType, UnitStats> = {
  [UnitType.SPEARMAN]:     { goldCost: 10,  foodCost: 5,  upkeep: 1,  attackPower: 1,   defensePower: 1,   trainingTime: 10,   requiredBarracksLevel: 1 },
  [UnitType.ARCHER]:       { goldCost: 20,  foodCost: 8,  upkeep: 1,  attackPower: 2,   defensePower: 1,   trainingTime: 20,   requiredBarracksLevel: 1 },
  [UnitType.SWORDSMAN]:    { goldCost: 40,  foodCost: 12, upkeep: 2,  attackPower: 4,   defensePower: 3,   trainingTime: 40,   requiredBarracksLevel: 2 },
  [UnitType.CAVALRY]:      { goldCost: 80,  foodCost: 20, upkeep: 3,  attackPower: 9,   defensePower: 5,   trainingTime: 80,   requiredBarracksLevel: 3 },
  [UnitType.CATAPULT]:     { goldCost: 200, foodCost: 40, upkeep: 5,  attackPower: 15,  defensePower: 2,   trainingTime: 200,  requiredBarracksLevel: 5 },
  [UnitType.ELITE_GUARD]:  { goldCost: 500, foodCost: 80, upkeep: 8,  attackPower: 25,  defensePower: 20,  trainingTime: 600,  requiredBarracksLevel: 8 },
  [UnitType.KNIGHT]:       { goldCost: 800, foodCost: 0,  upkeep: 2,  attackPower: 40,  defensePower: 30,  trainingTime: 120,  requiredBarracksLevel: 1 },
  [UnitType.PALADIN]:      { goldCost: 0, gemsCost: 100,  foodCost: 0, upkeep: 5,  attackPower: 80,  defensePower: 60,  trainingTime: 300,  requiredBarracksLevel: 3, requiresVip: true },
  [UnitType.DRAGON_RIDER]: { goldCost: 0, gemsCost: 300,  foodCost: 0, upkeep: 15, attackPower: 250, defensePower: 150, trainingTime: 600,  requiredBarracksLevel: 5, requiresVip: true },
  [UnitType.RAGNAR]:       { goldCost: 0, gemsCost: 200,  foodCost: 0, upkeep: 20, attackPower: 400, defensePower: 300, trainingTime: 900,  requiredBarracksLevel: 3, requiresReferralHero: true },
  [UnitType.TITAN]:        { goldCost: 0, gemsCost: 0,    foodCost: 0, upkeep: 25, attackPower: 800, defensePower: 600, trainingTime: 0,    requiredBarracksLevel: 1 },
  [UnitType.GIANT]:        { goldCost: 0, gemsCost: 0,    foodCost: 0, upkeep: 50, attackPower: 2000,defensePower: 1200,trainingTime: 0,    requiredBarracksLevel: 1 },
  [UnitType.OGRE]:         { goldCost: 0, gemsCost: 150,  foodCost: 0, upkeep: 18, attackPower: 350, defensePower: 500, trainingTime: 1800, requiredBarracksLevel: 1, requiresExploration: true },
  [UnitType.MAGE]:         { goldCost: 0, gemsCost: 180,  foodCost: 0, upkeep: 12, attackPower: 600, defensePower: 200, trainingTime: 2400, requiredBarracksLevel: 1, requiresExploration: true },
  [UnitType.DWARF_FIGHTER]:{ goldCost: 0, gemsCost: 120,  foodCost: 0, upkeep: 10, attackPower: 280, defensePower: 320, trainingTime: 1200, requiredBarracksLevel: 1, requiresExploration: true },
};

// ─── Initial kingdom setup ────────────────────────────────────────────────────
export const INITIAL_BUILDINGS = [
  BuildingType.TOWN_HALL,
  BuildingType.GOLD_MINE,
  BuildingType.LUMBER_MILL,
  BuildingType.STONE_QUARRY,
  BuildingType.FARM,
  BuildingType.BARRACKS,
];

export const INITIAL_UNITS = Object.values(UnitType);
