import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
export declare class ReferralService {
    private userRepo;
    private kingdomRepo;
    constructor(userRepo: Repository<User>, kingdomRepo: Repository<Kingdom>);
    getStats(userId: string): Promise<{
        referralCode: string;
        link: string;
        referredCount: number;
        milestones: ({
            reached: boolean;
            alreadyClaimed: boolean;
            count: number;
            gems: number;
            label: string;
            hero?: undefined;
            vipDays?: undefined;
        } | {
            reached: boolean;
            alreadyClaimed: boolean;
            count: number;
            gems: number;
            label: string;
            hero: string;
            vipDays?: undefined;
        } | {
            reached: boolean;
            alreadyClaimed: boolean;
            count: number;
            gems: number;
            label: string;
            vipDays: number;
            hero?: undefined;
        })[];
    }>;
    claimMilestone(userId: string, milestoneCount: number): Promise<{
        error: string;
        claimed?: undefined;
        gems?: undefined;
        hero?: undefined;
        vipDays?: undefined;
    } | {
        claimed: boolean;
        gems: number;
        hero: any;
        vipDays: any;
        error?: undefined;
    }>;
}
