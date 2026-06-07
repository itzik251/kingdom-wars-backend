import { Response } from 'express';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { ConfigService } from '@nestjs/config';
export declare class AdminController {
    private userRepo;
    private kingdomRepo;
    private config;
    constructor(userRepo: Repository<User>, kingdomRepo: Repository<Kingdom>, config: ConfigService);
    dashboard(res: Response): void;
    private guard;
    stats(headers: any): Promise<{
        totalUsers: number;
        totalKingdoms: number;
        activeUsers7d: number;
        newUsersToday: number;
        totalGemsInGame: number;
        topKingdoms: {
            name: string;
            score: number;
            gems: number;
            gold: number;
            username: string;
        }[];
    }>;
    banUser(headers: any, telegramId: string): Promise<{
        error: string;
        banned?: undefined;
        telegramId?: undefined;
    } | {
        banned: boolean;
        telegramId: string;
        error?: undefined;
    }>;
    giveGems(headers: any, telegramId: string, body: {
        gems: number;
    }): Promise<{
        error: string;
        success?: undefined;
        newGems?: undefined;
    } | {
        success: boolean;
        newGems: number;
        error?: undefined;
    }>;
    listUsers(headers: any): Promise<any[]>;
}
