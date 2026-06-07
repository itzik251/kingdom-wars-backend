import { Response } from 'express';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from '../notifications/notification.service';
import { TronService } from './tron.service';
type ResourceType = 'gems' | 'gold' | 'wood' | 'stone' | 'food' | 'usdt' | 'vip';
export declare class AdminController {
    private userRepo;
    private kingdomRepo;
    private config;
    private notifService;
    private tronService;
    constructor(userRepo: Repository<User>, kingdomRepo: Repository<Kingdom>, config: ConfigService, notifService: NotificationService, tronService: TronService);
    dashboard(res: Response): void;
    private getWalletConfig;
    private guard;
    stats(headers: any): Promise<{
        totalUsers: number;
        totalKingdoms: number;
        activeUsers7d: number;
        newUsersToday: number;
        totalGemsInGame: number;
        totalUsdtInGame: string;
        vipCount: number;
        gameWalletAddress: string;
        topKingdoms: {
            name: string;
            score: number;
            gems: number;
            gold: number;
            usdtBalance: string;
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
        type?: undefined;
        vipUntil?: undefined;
        amount?: undefined;
    } | {
        success: boolean;
        type: string;
        vipUntil: Date;
        error?: undefined;
        amount?: undefined;
    } | {
        success: boolean;
        type: "gems" | "gold" | "wood" | "stone" | "food" | "usdt";
        amount: number;
        error?: undefined;
        vipUntil?: undefined;
    }>;
    giveResource(telegramId: string, type: ResourceType, amount: number, headers?: any): Promise<{
        error: string;
        success?: undefined;
        type?: undefined;
        vipUntil?: undefined;
        amount?: undefined;
    } | {
        success: boolean;
        type: string;
        vipUntil: Date;
        error?: undefined;
        amount?: undefined;
    } | {
        success: boolean;
        type: "gems" | "gold" | "wood" | "stone" | "food" | "usdt";
        amount: number;
        error?: undefined;
        vipUntil?: undefined;
    }>;
    getWallet(headers: any): {
        address: string;
    };
    updateWallet(headers: any, body: {
        address: string;
    }): {
        address: string;
        success: boolean;
    };
    getWalletBalance(headers: any): Promise<{
        error: string;
        address?: undefined;
        usdtBalance?: undefined;
        trxBalance?: undefined;
    } | {
        address: string;
        usdtBalance: number;
        trxBalance: number;
        error?: undefined;
    }>;
    getPendingWithdrawals(headers: any): Promise<{
        kingdomId: string;
        kingdomName: string;
        telegramId: string;
        username: string;
        amount: number;
        wallet: string;
    }[]>;
    approveWithdrawal(headers: any, kingdomId: string): Promise<{
        error: string;
        hint?: undefined;
        success?: undefined;
        amount?: undefined;
        wallet?: undefined;
        txId?: undefined;
    } | {
        error: string;
        hint: string;
        success?: undefined;
        amount?: undefined;
        wallet?: undefined;
        txId?: undefined;
    } | {
        success: boolean;
        amount: number;
        wallet: string;
        txId: string;
        error?: undefined;
        hint?: undefined;
    }>;
    rejectWithdrawal(headers: any, kingdomId: string, body: {
        reason?: string;
    }): Promise<{
        error: string;
        success?: undefined;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    giveVip(headers: any, telegramId: string, body: {
        days?: number;
    }): Promise<{
        error: string;
        success?: undefined;
        type?: undefined;
        vipUntil?: undefined;
        amount?: undefined;
    } | {
        success: boolean;
        type: string;
        vipUntil: Date;
        error?: undefined;
        amount?: undefined;
    } | {
        success: boolean;
        type: "gems" | "gold" | "wood" | "stone" | "food" | "usdt";
        amount: number;
        error?: undefined;
        vipUntil?: undefined;
    }>;
    listUsers(headers: any): Promise<any[]>;
}
export {};
