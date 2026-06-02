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
            count: number;
            gems: number;
            label: string;
            skin?: undefined;
            hero?: undefined;
        } | {
            reached: boolean;
            count: number;
            gems: number;
            label: string;
            skin: string;
            hero?: undefined;
        } | {
            reached: boolean;
            count: number;
            gems: number;
            label: string;
            hero: string;
            skin?: undefined;
        })[];
    }>;
    claimMilestone(userId: string, milestoneCount: number): Promise<{
        error: string;
        claimed?: undefined;
        gems?: undefined;
        skin?: undefined;
        hero?: undefined;
    } | {
        claimed: boolean;
        gems: number;
        skin: string;
        hero: string;
        error?: undefined;
    }>;
}
