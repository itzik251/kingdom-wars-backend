import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
export declare class TelegramService {
    private config;
    private userRepo;
    private readonly token;
    private readonly apiBase;
    constructor(config: ConfigService, userRepo: Repository<User>);
    sendMessage(chatId: number, text: string, extra?: any): Promise<void>;
    private getLang;
    handleUpdate(update: any): Promise<void>;
    setWebhook(webhookUrl: string): Promise<any>;
    deleteWebhook(): Promise<any>;
}
