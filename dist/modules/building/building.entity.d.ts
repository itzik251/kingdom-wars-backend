import { Kingdom } from '../kingdom/kingdom.entity';
export declare enum BuildingType {
    TOWN_HALL = "town_hall",
    GOLD_MINE = "gold_mine",
    LUMBER_MILL = "lumber_mill",
    STONE_QUARRY = "stone_quarry",
    FARM = "farm",
    BARRACKS = "barracks",
    ACADEMY = "academy",
    WALL = "wall",
    WATCH_TOWER = "watch_tower"
}
export declare class Building {
    id: string;
    kingdom: Kingdom;
    type: BuildingType;
    level: number;
    upgradeEndsAt: Date;
    createdAt: Date;
    get isUpgrading(): boolean;
}
