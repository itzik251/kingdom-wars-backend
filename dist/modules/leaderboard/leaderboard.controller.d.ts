import { LeaderboardService } from './leaderboard.service';
export declare class LeaderboardController {
    private leaderboardService;
    constructor(leaderboardService: LeaderboardService);
    getTop(): Promise<import("../kingdom/kingdom.entity").Kingdom[]>;
}
