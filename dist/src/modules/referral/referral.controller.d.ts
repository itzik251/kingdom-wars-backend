import { ReferralService } from './referral.service';
export declare class ReferralController {
    private referralService;
    constructor(referralService: ReferralService);
    getStats(req: any): Promise<{
        referralCode: string;
        link: string;
        referredCount: number;
        claimedCount: number;
        pendingRewards: {
            gems: number;
            skins: number;
            vipDays: number;
        };
        hasPending: boolean;
        nextMilestones: {
            gems100At: number;
            bonus200At: number;
            skinAt: number;
            vipAt: number;
        };
        milestones: any[];
    }>;
    claimAll(req: any): Promise<{
        claimed: boolean;
        reason: string;
        gems?: undefined;
        skins?: undefined;
        vipDays?: undefined;
        newClaimedCount?: undefined;
    } | {
        claimed: boolean;
        gems: number;
        skins: number;
        vipDays: number;
        newClaimedCount: number;
        reason?: undefined;
    }>;
    claim(req: any, count: string): Promise<{
        claimed: boolean;
        reason: string;
        gems?: undefined;
        skins?: undefined;
        vipDays?: undefined;
        newClaimedCount?: undefined;
    } | {
        claimed: boolean;
        gems: number;
        skins: number;
        vipDays: number;
        newClaimedCount: number;
        reason?: undefined;
    }>;
}
