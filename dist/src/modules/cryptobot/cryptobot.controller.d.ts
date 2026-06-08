import { CryptoBotService } from './cryptobot.service';
import { VipService } from '../vip/vip.service';
import { Repository } from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';
import { ConfigService } from '@nestjs/config';
export declare class CryptoBotController {
    private cryptoBotService;
    private vipService;
    private config;
    private kingdomRepo;
    private readonly logger;
    constructor(cryptoBotService: CryptoBotService, vipService: VipService, config: ConfigService, kingdomRepo: Repository<Kingdom>);
    createVipInvoice(req: any): Promise<{
        invoiceId: number;
        payUrl: string;
        amount: string;
        expiresIn: number;
    }>;
    checkVipPayment(req: any, body: {
        invoiceId: number;
    }): Promise<{
        paid: boolean;
        reason: string;
        status?: undefined;
        vipActivated?: undefined;
        expiresAt?: undefined;
    } | {
        paid: boolean;
        status: "active" | "expired";
        reason?: undefined;
        vipActivated?: undefined;
        expiresAt?: undefined;
    } | {
        paid: boolean;
        vipActivated: boolean;
        expiresAt: Date;
        reason?: undefined;
        status?: undefined;
    }>;
    handleWebhook(body: any, headers: any): Promise<{
        ok: boolean;
    }>;
}
