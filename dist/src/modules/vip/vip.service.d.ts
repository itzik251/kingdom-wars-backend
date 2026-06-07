import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
export declare class VipService {
    private userRepo;
    private kingdomRepo;
    constructor(userRepo: Repository<User>, kingdomRepo: Repository<Kingdom>);
    getStatus(userId: string): Promise<{
        isVip: boolean;
        expiresAt: Date;
        priceToN: number;
    }>;
    activateVip(userId: string, tonTxHash: string): Promise<{
        success: boolean;
        expiresAt: Date;
        durationDays: number;
    }>;
    isUserVip(userId: string): boolean;
}
