"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VIP_PRICE_USDT = exports.VIP_PRICE_TON = exports.VIP_GAME_PRODUCTION_MULTIPLIER = exports.USDT_JETTON_MASTER = exports.PAYMENT_WALLET_ADDRESS = exports.VIP_DURATION_DAYS = exports.VIP_PRICE_USDT_TON = exports.VIP_BUILD_TIME_REDUCTION = exports.INITIAL_UNITS = exports.INITIAL_BUILDINGS = exports.WEAK_PLAYER_RESOURCE_BONUS = exports.SNOWBALL_LOOT_PENALTY = exports.SNOWBALL_SCORE_RATIO = exports.POST_ATTACK_SHIELD_HOURS = exports.NEWBIE_SHIELD_HOURS = exports.WALL_DEFENSE_BONUS_PER_LEVEL = exports.DEFENDER_LOSS_MAX = exports.LOOT_PERCENTAGE = exports.COMBAT_RANDOM_MAX = exports.COMBAT_RANDOM_MIN = exports.UNIT_STATS = exports.TOWN_HALL_GATES = exports.MAX_BUILDING_LEVEL = exports.BUILD_TIME_MULTIPLIER = exports.BUILDING_BASE_TIMES = exports.UPGRADE_COST_MULTIPLIER = exports.BUILDING_BASE_COSTS = exports.PRODUCTION_MULTIPLIER = exports.BASE_PRODUCTION = void 0;
const building_entity_1 = require("../modules/building/building.entity");
const unit_entity_1 = require("../modules/units/unit.entity");
exports.BASE_PRODUCTION = {
    gold_mine: 100,
    lumber_mill: 80,
    stone_quarry: 60,
    farm: 50,
};
exports.PRODUCTION_MULTIPLIER = 1.12;
exports.BUILDING_BASE_COSTS = {
    [building_entity_1.BuildingType.TOWN_HALL]: { gold: 500, wood: 200, stone: 200 },
    [building_entity_1.BuildingType.GOLD_MINE]: { gold: 200, wood: 100, stone: 0 },
    [building_entity_1.BuildingType.LUMBER_MILL]: { gold: 150, wood: 0, stone: 100 },
    [building_entity_1.BuildingType.STONE_QUARRY]: { gold: 150, wood: 100, stone: 0 },
    [building_entity_1.BuildingType.FARM]: { gold: 100, wood: 150, stone: 0 },
    [building_entity_1.BuildingType.BARRACKS]: { gold: 300, wood: 200, stone: 100 },
    [building_entity_1.BuildingType.ACADEMY]: { gold: 500, wood: 300, stone: 200 },
    [building_entity_1.BuildingType.WALL]: { gold: 200, wood: 0, stone: 400 },
    [building_entity_1.BuildingType.WATCH_TOWER]: { gold: 150, wood: 200, stone: 100 },
    [building_entity_1.BuildingType.HOSPITAL]: { gold: 300, wood: 200, stone: 100 },
    [building_entity_1.BuildingType.ARCANE_TOWER]: { gold: 800, wood: 400, stone: 400 },
};
exports.UPGRADE_COST_MULTIPLIER = 1.35;
exports.BUILDING_BASE_TIMES = {
    [building_entity_1.BuildingType.TOWN_HALL]: 60,
    [building_entity_1.BuildingType.GOLD_MINE]: 30,
    [building_entity_1.BuildingType.LUMBER_MILL]: 30,
    [building_entity_1.BuildingType.STONE_QUARRY]: 30,
    [building_entity_1.BuildingType.FARM]: 20,
    [building_entity_1.BuildingType.BARRACKS]: 45,
    [building_entity_1.BuildingType.ACADEMY]: 90,
    [building_entity_1.BuildingType.WALL]: 40,
    [building_entity_1.BuildingType.WATCH_TOWER]: 35,
    [building_entity_1.BuildingType.HOSPITAL]: 45,
    [building_entity_1.BuildingType.ARCANE_TOWER]: 120,
};
exports.BUILD_TIME_MULTIPLIER = 1.4;
exports.MAX_BUILDING_LEVEL = 30;
exports.TOWN_HALL_GATES = {
    1: 3,
    3: 5,
    5: 8,
    8: 12,
    12: 16,
    16: 20,
    20: 25,
    25: 30,
};
exports.UNIT_STATS = {
    [unit_entity_1.UnitType.SPEARMAN]: { goldCost: 10, foodCost: 5, upkeep: 1, attackPower: 1, defensePower: 1, trainingTime: 10, requiredBarracksLevel: 1 },
    [unit_entity_1.UnitType.ARCHER]: { goldCost: 20, foodCost: 8, upkeep: 1, attackPower: 2, defensePower: 1, trainingTime: 20, requiredBarracksLevel: 1 },
    [unit_entity_1.UnitType.SWORDSMAN]: { goldCost: 40, foodCost: 12, upkeep: 2, attackPower: 4, defensePower: 3, trainingTime: 40, requiredBarracksLevel: 2 },
    [unit_entity_1.UnitType.CAVALRY]: { goldCost: 80, foodCost: 20, upkeep: 3, attackPower: 9, defensePower: 5, trainingTime: 80, requiredBarracksLevel: 3 },
    [unit_entity_1.UnitType.CATAPULT]: { goldCost: 200, foodCost: 40, upkeep: 5, attackPower: 15, defensePower: 2, trainingTime: 200, requiredBarracksLevel: 5 },
    [unit_entity_1.UnitType.ELITE_GUARD]: { goldCost: 500, foodCost: 80, upkeep: 8, attackPower: 25, defensePower: 20, trainingTime: 600, requiredBarracksLevel: 8 },
    [unit_entity_1.UnitType.PALADIN]: { goldCost: 0, gemsCost: 100, foodCost: 0, upkeep: 5, attackPower: 80, defensePower: 60, trainingTime: 300, requiredBarracksLevel: 3, requiresVip: true },
    [unit_entity_1.UnitType.DRAGON_RIDER]: { goldCost: 0, gemsCost: 300, foodCost: 0, upkeep: 15, attackPower: 250, defensePower: 150, trainingTime: 600, requiredBarracksLevel: 5, requiresVip: true },
    [unit_entity_1.UnitType.RAGNAR]: { goldCost: 0, gemsCost: 200, foodCost: 0, upkeep: 20, attackPower: 400, defensePower: 300, trainingTime: 900, requiredBarracksLevel: 3, requiresReferralHero: true },
    [unit_entity_1.UnitType.TITAN]: { goldCost: 0, gemsCost: 0, foodCost: 0, upkeep: 0, attackPower: 800, defensePower: 600, trainingTime: 0, requiredBarracksLevel: 1, requiresVip: false },
};
exports.COMBAT_RANDOM_MIN = 0.85;
exports.COMBAT_RANDOM_MAX = 1.15;
exports.LOOT_PERCENTAGE = 0.30;
exports.DEFENDER_LOSS_MAX = 0.20;
exports.WALL_DEFENSE_BONUS_PER_LEVEL = 50;
exports.NEWBIE_SHIELD_HOURS = 72;
exports.POST_ATTACK_SHIELD_HOURS = 1;
exports.SNOWBALL_SCORE_RATIO = 3;
exports.SNOWBALL_LOOT_PENALTY = 0.5;
exports.WEAK_PLAYER_RESOURCE_BONUS = 0.20;
exports.INITIAL_BUILDINGS = [
    building_entity_1.BuildingType.TOWN_HALL,
    building_entity_1.BuildingType.GOLD_MINE,
    building_entity_1.BuildingType.LUMBER_MILL,
    building_entity_1.BuildingType.STONE_QUARRY,
    building_entity_1.BuildingType.FARM,
    building_entity_1.BuildingType.BARRACKS,
];
exports.INITIAL_UNITS = Object.values(unit_entity_1.UnitType);
exports.VIP_BUILD_TIME_REDUCTION = 0.30;
exports.VIP_PRICE_USDT_TON = 5;
exports.VIP_DURATION_DAYS = 30;
exports.PAYMENT_WALLET_ADDRESS = 'UQBQeWT7nw0KjeKmSbxsmqqgDRh61H-_ZamVc3_I5S1jNX0T';
exports.USDT_JETTON_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
exports.VIP_GAME_PRODUCTION_MULTIPLIER = 1.5;
exports.VIP_PRICE_TON = exports.VIP_PRICE_USDT_TON;
exports.VIP_PRICE_USDT = exports.VIP_PRICE_USDT_TON;
//# sourceMappingURL=game.constants.js.map