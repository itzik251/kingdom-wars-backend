import { Repository, DataSource } from 'typeorm';
import { Withdrawal } from './withdrawal.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { TonService } from '../ton/ton.service';
export declare class WithdrawalService {
    private repo;
    private kingdomRepo;
    private dataSource;
    private tonService;
    private readonly logger;
    constructor(repo: Repository<Withdrawal>, kingdomRepo: Repository<Kingdom>, dataSource: DataSource, tonService: TonService);
    request(userId: string, amount: number, walletAddress: string): Promise<{
        success: boolean;
        id: string;
        amount: number;
        status: string;
    }>;
    listPending(): Promise<Withdrawal[]>;
    listAll(limit?: number): Promise<Withdrawal[]>;
    approve(id: string): Promise<{
        success: boolean;
        txId: string;
    }>;
    reject(id: string, reason?: string): Promise<{
        success: boolean;
    }>;
    getUserHistory(userId: string): Promise<Withdrawal[]>;
}
