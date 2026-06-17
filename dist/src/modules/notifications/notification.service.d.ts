import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/user.entity';
type Lang = 'en' | 'he' | 'es' | 'fr' | 'de' | 'ru' | 'pt' | 'ar';
export declare class NotificationService {
    private notifRepo;
    private userRepo;
    private config;
    constructor(notifRepo: Repository<Notification>, userRepo: Repository<User>, config: ConfigService);
    create(userId: string, type: string, payload: Record<string, any>): Promise<Notification>;
    getUnread(userId: string): Promise<Notification[]>;
    getMessages(userId: string, lang?: Lang): Promise<{
        id: string;
        type: string;
        text: string;
        read: boolean;
        createdAt: Date;
    }[]>;
    clearMessages(userId: string): Promise<void>;
    markRead(userId: string): Promise<void>;
    private recentSends;
    private sendTelegram;
}
export {};
