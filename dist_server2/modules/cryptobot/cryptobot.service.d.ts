import { ConfigService } from '@nestjs/config';
export interface CryptoBotInvoice {
    invoice_id: number;
    hash: string;
    currency_type: string;
    asset: string;
    amount: string;
    pay_url: string;
    bot_invoice_url: string;
    mini_app_invoice_url: string;
    status: 'active' | 'paid' | 'expired';
    payload?: string;
    paid_at?: string;
}
export declare class CryptoBotService {
    private config;
    private readonly logger;
    constructor(config: ConfigService);
    private getHeaders;
    private apiCall;
    createVipInvoice(userId: string, amountUsdt: number): Promise<CryptoBotInvoice>;
    getInvoice(invoiceId: number): Promise<CryptoBotInvoice | null>;
    getPaidInvoicesByPayload(payloadPrefix: string): Promise<CryptoBotInvoice[]>;
    transferUsdt(telegramId: string, amount: number, comment?: string): Promise<{
        spend_id: string;
        status: string;
    } | {
        error: string;
    }>;
    getBalance(): Promise<Record<string, string>>;
    setWebhook(webhookUrl: string): Promise<any>;
}
