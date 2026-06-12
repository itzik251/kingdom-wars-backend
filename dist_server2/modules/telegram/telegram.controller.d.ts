import { TelegramService } from './telegram.service';
export declare class TelegramController {
    private telegramService;
    constructor(telegramService: TelegramService);
    handleWebhook(update: any): {
        ok: boolean;
    };
    setWebhook(url: string): Promise<any>;
    deleteWebhook(): Promise<any>;
    setCommands(): Promise<any>;
}
