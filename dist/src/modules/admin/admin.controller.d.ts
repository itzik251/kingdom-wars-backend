import { Response } from 'express';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from '../notifications/notification.service';
import { TonService } from '../ton/ton.service';
import { CryptoBotService } from '../cryptobot/cryptobot.service';
import { AntiBotService } from '../antibot/antibot.service';
type ResourceType = 'gems' | 'gold' | 'wood' | 'stone' | 'food' | 'usdt' | 'vip';
export declare class AdminController {
    private userRepo;
    private kingdomRepo;
    private config;
    private notifService;
    private tonService;
    private cryptoBotService;
    private antiBotService;
    constructor(userRepo: Repository<User>, kingdomRepo: Repository<Kingdom>, config: ConfigService, notifService: NotificationService, tonService: TonService, cryptoBotService: CryptoBotService, antiBotService: AntiBotService);
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
    deleteUser(headers: any, telegramId: string): Promise<{
        error: string;
        deleted?: undefined;
        telegramId?: undefined;
    } | {
        deleted: boolean;
        telegramId: string;
        error?: undefined;
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
    takeResource(telegramId: string, type: ResourceType, amount: number, headers: any): Promise<{
        error: string;
        success?: undefined;
        type?: undefined;
        amount?: undefined;
    } | {
        success: boolean;
        type: ResourceType;
        amount: number;
        error?: undefined;
    }>;
    giveResource(telegramId: string, type: ResourceType, amount: number, headers: any): Promise<{
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
    getWalletBalance(headers: any): Promise<any>;
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
        success?: undefined;
        amount?: undefined;
        wallet?: undefined;
        note?: undefined;
    } | {
        success: boolean;
        amount: number;
        wallet: string;
        note: string;
        error?: undefined;
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
    removeVip(headers: any, telegramId: string): Promise<{
        error: string;
        success?: undefined;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    listUsers(headers: any): Promise<{
        telegramId: string;
        name: string;
        username: string;
        language: string;
        joined: Date;
        lastLogin: Date;
        termsAccepted: boolean;
        kingdomName: string;
        score: number;
        gems: number;
        gold: number;
        wood: number;
        stone: number;
        food: number;
        usdtBalance: string;
        isVip: boolean;
        vipUntil: Date;
        referralsTotal: number;
        referralsActive: number;
    }[]>;
    getUserReferrals(headers: any, telegramId: string): Promise<{
        telegramId: string;
        username: string;
        joinedAt: Date;
        score: number;
        active: boolean;
    }[]>;
    getAntiBotStatus(headers: any, telegramId: string): Promise<{
        isBanned: boolean;
        bannedUntil: Date;
        abuseScore: number;
    } | {
        error: string;
    }>;
    antiBotBan(headers: any, telegramId: string, body: {
        hours?: number;
        reason?: string;
    }): Promise<{
        error: string;
        success?: undefined;
        bannedFor?: undefined;
        userId?: undefined;
    } | {
        success: boolean;
        bannedFor: string;
        userId: string;
        error?: undefined;
    }>;
    antiBotUnban(headers: any, telegramId: string): Promise<{
        error: string;
        success?: undefined;
    } | {
        success: boolean;
        error?: undefined;
    }>;
}
export {};
