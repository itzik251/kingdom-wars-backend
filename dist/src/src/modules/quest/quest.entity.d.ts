import { Kingdom } from '../kingdom/kingdom.entity';
export declare enum QuestPeriod {
    DAILY = "daily",
    WEEKLY = "weekly"
}
export declare class Quest {
    id: string;
    kingdom: Kingdom;
    questKey: string;
    period: QuestPeriod;
    progress: number;
    target: number;
    completed: boolean;
    rewardClaimed: boolean;
    periodDate: string;
}
