import { ReferralService } from './referral.service';
export declare class ReferralController {
    private referralService;
    constructor(referralService: ReferralService);
    getStats(req: any): Promise<{
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
    claim(req: any, count: string): Promise<{
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
