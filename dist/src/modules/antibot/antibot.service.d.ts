import { OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
export declare class AntiBotService implements OnApplicationBootstrap {
    private dataSource;
    private readonly logger;
    private readonly windows;
    private readonly banCache;
    constructor(dataSource: DataSource);
    onApplicationBootstrap(): Promise<void>;
    private initBanTable;
    check(userId: string, action: string, ip?: string): {
        allowed: boolean;
        reason?: string;
        retryAfter?: number;
    };
    recordFailure(userId: string, action: string, severity?: 'low' | 'medium' | 'high'): void;
    private analyzeBotPattern;
    private maybeBan;
    private saveBan;
    banUser(userId: string, hours: number, reason: string): Promise<void>;
    unbanUser(userId: string): Promise<void>;
    getBanStatus(userId: string): Promise<{
        isBanned: boolean;
        bannedUntil: Date;
        abuseScore: number;
    }>;
    private cleanup;
}
