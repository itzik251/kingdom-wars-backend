import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Unit } from '../units/unit.entity';
export declare class ReferralService {
    private userRepo;
    private kingdomRepo;
    private unitRepo;
    constructor(userRepo: Repository<User>, kingdomRepo: Repository<Kingdom>, unitRepo: Repository<Unit>);
    private getActiveReferralCount;
    private getTotalReferralCount;
    getStats(userId: string): Promise<{
        referralCode: string;
        link: string;
        referredCount: number;
        totalReferredCount: number;
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
    claimRewards(userId: string): Promise<{
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
    claimMilestone(userId: string, _milestoneCount: number): Promise<{
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
