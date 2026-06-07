import { ConfigService } from '@nestjs/config';
export declare class TelegramService {
    private config;
    private readonly token;
    private readonly apiBase;
    constructor(config: ConfigService);
    sendMessage(chatId: number, text: string, extra?: any): Promise<void>;
    handleUpdate(update: any): Promise<void>;
    setWebhook(webhookUrl: string): Promise<any>;
    deleteWebhook(): Promise<any>;
}
