import { WithdrawalService } from './withdrawal.service';
export declare class WithdrawalController {
    private service;
    constructor(service: WithdrawalService);
    request(req: any, body: {
        amount: number;
        walletAddress: string;
    }): Promise<{
        success: boolean;
        id: string;
        amount: number;
        status: string;
    }>;
    history(req: any): Promise<import("./withdrawal.entity").Withdrawal[]>;
}
