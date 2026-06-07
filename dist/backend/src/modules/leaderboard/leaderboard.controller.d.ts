import { LeaderboardService } from './leaderboard.service';
export declare class LeaderboardController {
    private leaderboardService;
    constructor(leaderboardService: LeaderboardService);
    getTop(all?: string): Promise<{
        id: string;
        rank: number;
        kingdomName: string;
        username: string;
        avatarUrl: string;
        score: number;
        isShielded: boolean;
    }[]>;
    resetScores(key: string): Promise<{
        message: string;
    }>;
}
