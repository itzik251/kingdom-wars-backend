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
            skin?: undefined;
            hero?: undefined;
        } | {
            reached: boolean;
            alreadyClaimed: boolean;
            count: number;
            gems: number;
            label: string;
            skin: string;
            hero?: undefined;
        } | {
            reached: boolean;
            alreadyClaimed: boolean;
            count: number;
            gems: number;
            label: string;
            hero: string;
            skin?: undefined;
        })[];
    }>;
    claim(req: any, count: string): Promise<{
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
