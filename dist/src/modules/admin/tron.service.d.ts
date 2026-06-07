import { ConfigService } from '@nestjs/config';
export declare class TronService {
    private config;
    private readonly logger;
    constructor(config: ConfigService);
    private getTronWeb;
    getUsdtBalance(address: string): Promise<number>;
    private getUsdtBalanceRest;
    sendUsdt(toAddress: string, amount: number): Promise<{
        txId?: string;
        error?: string;
    }>;
    getTrxBalance(address: string): Promise<number>;
    isValidAddress(address: string): boolean;
}
