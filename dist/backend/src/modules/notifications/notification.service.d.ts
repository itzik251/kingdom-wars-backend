import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { ConfigService } from '@nestjs/config';
export declare class NotificationService {
    private notifRepo;
    private config;
    constructor(notifRepo: Repository<Notification>, config: ConfigService);
    create(userId: string, type: string, payload: Record<string, any>): Promise<Notification>;
    getUnread(userId: string): Promise<Notification[]>;
    markRead(userId: string): Promise<void>;
    private recentSends;
    private sendTelegram;
}
