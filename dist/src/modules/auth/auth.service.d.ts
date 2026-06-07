import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Building } from '../building/building.entity';
import { Unit } from '../units/unit.entity';
export declare class AuthService {
    private jwtService;
    private config;
    private userRepo;
    private kingdomRepo;
    private buildingRepo;
    private unitRepo;
    constructor(jwtService: JwtService, config: ConfigService, userRepo: Repository<User>, kingdomRepo: Repository<Kingdom>, buildingRepo: Repository<Building>, unitRepo: Repository<Unit>);
    validateTelegramData(initData: string): Record<string, string>;
    loginOrRegister(initData: string, referralCode?: string): Promise<{
        token: string;
        userId: string;
    }>;
    private createNewUser;
    setLanguage(userId: string, language: string): Promise<{
        language: string;
    }>;
    private generateReferralCode;
}
