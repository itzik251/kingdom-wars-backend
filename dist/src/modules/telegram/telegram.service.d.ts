import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
export declare class TelegramService {
    private config;
    private userRepo;
    private kingdomRepo;
    private readonly token;
    private readonly apiBase;
    constructor(config: ConfigService, userRepo: Repository<User>, kingdomRepo: Repository<Kingdom>);
    sendMessage(chatId: number, text: string, extra?: any): Promise<void>;
    private getLang;
    handleUpdate(update: any): Promise<void>;
    setMyCommands(): Promise<any>;
    setWebhook(webhookUrl: string): Promise<any>;
    deleteWebhook(): Promise<any>;
}
