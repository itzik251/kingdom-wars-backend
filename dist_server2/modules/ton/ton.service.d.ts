import { ConfigService } from '@nestjs/config';
export declare const USDT_JETTON_MASTER = "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs";
export declare class TonService {
    private config;
    private readonly logger;
    constructor(config: ConfigService);
    private getHeaders;
    getUsdtBalance(address: string): Promise<number>;
    getTonBalance(address: string): Promise<number>;
    verifyUsdtTx(txHash: string, expectedAmount: number, toAddress: string): Promise<boolean>;
    sendUsdt(toAddress: string, amount: number): Promise<{
        txId?: string;
        error?: string;
    }>;
    getJettonWalletAddress(ownerAddress: string, jettonMaster: string): Promise<string | null>;
    isValidAddress(address: string): boolean;
}
