import { LeaderboardService } from './leaderboard.service';
export declare class LeaderboardController {
    private leaderboardService;
    constructor(leaderboardService: LeaderboardService);
    getTop(): Promise<{
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
    getWeekly(): Promise<{
        resetAt: Date;
        entries: {
            rank: number;
            kingdomName: string;
            username: string;
            winStreak: number;
            score: number;
        }[];
    }>;
}
