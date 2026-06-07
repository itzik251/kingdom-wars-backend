import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/user.entity';
export declare class NotificationService {
    private notifRepo;
    private userRepo;
    private config;
    constructor(notifRepo: Repository<Notification>, userRepo: Repository<User>, config: ConfigService);
    create(userId: string, type: string, payload: Record<string, any>): Promise<Notification>;
    getUnread(userId: string): Promise<Notification[]>;
    markRead(userId: string): Promise<void>;
    private sendTelegram;
}
