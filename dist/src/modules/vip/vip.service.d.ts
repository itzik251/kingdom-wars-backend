import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { TonService } from '../ton/ton.service';
export declare class VipService {
    private userRepo;
    private kingdomRepo;
    private tonService;
    constructor(userRepo: Repository<User>, kingdomRepo: Repository<Kingdom>, tonService: TonService);
    getStatus(userId: string): Promise<{
        isVip: boolean;
        expiresAt: Date;
        priceUsdt: number;
        currency: string;
        gameWallet: string;
        usdtBalance: number;
    }>;
    activateVip(userId: string, tonTxHash: string): Promise<{
        success: boolean;
        expiresAt: Date;
        durationDays: number;
    }>;
    purchaseWithUsdt(userId: string): Promise<{
        success: boolean;
        expiresAt: Date;
        durationDays: number;
    }>;
    getPaymentInfo(): {
        walletAddress: string;
        amount: number;
        currency: string;
        network: string;
        note: string;
    };
    isUserVip(userId: string): boolean;
}
