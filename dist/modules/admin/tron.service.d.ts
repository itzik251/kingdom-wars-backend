import { ConfigService } from '@nestjs/config';
export declare class TronService {
    private config;
    private readonly logger;
    constructor(config: ConfigService);
    private getApiHeaders;
    getUsdtBalance(address: string): Promise<number>;
    getTrxBalance(address: string): Promise<number>;
    sendUsdt(toAddress: string, amount: number): Promise<{
        txId?: string;
        error?: string;
    }>;
    isValidAddress(address: string): boolean;
}
