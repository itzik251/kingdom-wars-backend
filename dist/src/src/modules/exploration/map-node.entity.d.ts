export declare enum MapNodeType {
    RESOURCE = "resource",
    RARE_RESOURCE = "rare_resource",
    HERO = "hero"
}
export declare enum RareResourceType {
    MAGIC = "magic"
}
export declare class MapNode {
    id: string;
    kingdomId: string;
    x: number;
    y: number;
    type: MapNodeType;
    resourceType: string;
    amount: number;
    heroType: string;
    discovered: boolean;
    discoveredAt: Date;
    lastRaidedAt: Date;
}
