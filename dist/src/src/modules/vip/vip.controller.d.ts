import { VipService } from './vip.service';
declare class ActivateDto {
    tonTxHash: string;
}
export declare class VipController {
    private vipService;
    constructor(vipService: VipService);
    getStatus(req: any): Promise<{
        isVip: boolean;
        expiresAt: Date;
        priceUsdt: number;
        currency: string;
        gameWallet: string;
        usdtBalance: number;
    }>;
    activate(req: any, dto: ActivateDto): Promise<{
        success: boolean;
        expiresAt: Date;
        durationDays: number;
    }>;
    purchaseWithUsdt(req: any): Promise<{
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
    getInvoice(): {
        walletAddress: string;
        amount: number;
        currency: string;
        network: string;
        note: string;
    };
}
export {};
