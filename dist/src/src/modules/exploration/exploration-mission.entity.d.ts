export declare enum MissionStatus {
    ACTIVE = "active",
    RETURNED = "returned"
}
export declare class ExplorationMission {
    id: string;
    kingdomId: string;
    targetX: number;
    targetY: number;
    distance: number;
    startedAt: Date;
    returnsAt: Date;
    status: MissionStatus;
    discoveredNodeIds: string[];
}
