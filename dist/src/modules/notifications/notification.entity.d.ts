import { User } from '../user/user.entity';
export declare class Notification {
    id: string;
    user: User;
    type: string;
    payload: Record<string, any>;
    read: boolean;
    createdAt: Date;
}
