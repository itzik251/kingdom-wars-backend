import { User } from '../user/user.entity';
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'paid';
export declare class Withdrawal {
    id: string;
    user: User;
    userId: string;
    amount: number;
    walletAddress: string;
    status: WithdrawalStatus;
    txId: string | null;
    rejectReason: string | null;
    adminNote: string | null;
    createdAt: Date;
    updatedAt: Date;
}
