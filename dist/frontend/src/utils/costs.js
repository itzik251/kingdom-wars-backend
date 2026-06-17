"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESOURCE_META = exports.BUILDING_BASE_COSTS = void 0;
exports.upgradeCost = upgradeCost;
exports.BUILDING_BASE_COSTS = {
    town_hall: { gold: 500, wood: 200, stone: 200 },
    gold_mine: { gold: 200, wood: 100, stone: 0 },
    lumber_mill: { gold: 150, wood: 0, stone: 100 },
    stone_quarry: { gold: 150, wood: 100, stone: 0 },
    farm: { gold: 100, wood: 150, stone: 0 },
    barracks: { gold: 300, wood: 200, stone: 100 },
    academy: { gold: 500, wood: 300, stone: 200 },
    wall: { gold: 200, wood: 0, stone: 400 },
    watch_tower: { gold: 150, wood: 200, stone: 100 },
    hospital: { gold: 300, wood: 200, stone: 100 },
    arcane_tower: { gold: 800, wood: 400, stone: 400 },
};
const GROWTH = 1.25;
function upgradeCost(type, currentLevel) {
    const base = exports.BUILDING_BASE_COSTS[type] || { gold: 0, wood: 0, stone: 0 };
    const mult = Math.pow(GROWTH, currentLevel);
    return {
        gold: Math.floor(base.gold * mult),
        wood: Math.floor(base.wood * mult),
        stone: Math.floor(base.stone * mult),
    };
}
exports.RESOURCE_META = {
    gold: { emoji: '💰', color: '#f4d03f' },
    wood: { emoji: '🪵', color: '#b07a45' },
    stone: { emoji: '🪨', color: '#b8c0c4' },
};
//# sourceMappingURL=costs.js.map