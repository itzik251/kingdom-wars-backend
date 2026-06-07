import { NotificationService } from './notification.service';
export declare class NotificationController {
    private notifService;
    constructor(notifService: NotificationService);
    getUnread(req: any): Promise<import("./notification.entity").Notification[]>;
    markRead(req: any): Promise<void>;
}
