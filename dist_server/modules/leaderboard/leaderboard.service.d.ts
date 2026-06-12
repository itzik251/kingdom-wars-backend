import { Repository } from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';
export declare class LeaderboardService {
    private kingdomRepo;
    constructor(kingdomRepo: Repository<Kingdom>);
    getWeeklyTop(limit?: number): Promise<{
        resetAt: Date;
        entries: {
            rank: number;
            kingdomName: string;
            username: string;
            winStreak: number;
            score: number;
        }[];
    }>;
    getTop(limit?: number): Promise<{
        id: string;
        rank: number;
        kingdomName: string;
        username: string;
        avatarUrl: string;
        score: number;
        isShielded: boolean;
        shieldUntil: Date;
        usdtBalance: number;
        gameBalance: number;
    }[]>;
}
