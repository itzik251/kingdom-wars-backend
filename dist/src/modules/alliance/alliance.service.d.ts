import { Repository } from 'typeorm';
import { Alliance } from './alliance.entity';
import { AllianceMember, AllianceRole } from './alliance-member.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
export declare class AllianceService {
    private allianceRepo;
    private memberRepo;
    private kingdomRepo;
    constructor(allianceRepo: Repository<Alliance>, memberRepo: Repository<AllianceMember>, kingdomRepo: Repository<Kingdom>);
    create(kingdomId: string, name: string, tag: string, description?: string): Promise<Alliance>;
    join(kingdomId: string, allianceId: string): Promise<AllianceMember>;
    leave(kingdomId: string): Promise<{
        disbanded: boolean;
        left?: undefined;
    } | {
        left: boolean;
        disbanded?: undefined;
    }>;
    kick(leaderKingdomId: string, targetKingdomId: string): Promise<{
        kicked: boolean;
    }>;
    disband(leaderKingdomId: string): Promise<{
        disbanded: boolean;
    }>;
    transferLeadership(leaderKingdomId: string, targetKingdomId: string): Promise<{
        transferred: boolean;
    }>;
    promote(leaderKingdomId: string, targetKingdomId: string): Promise<{
        role: AllianceRole.OFFICER | AllianceRole.MEMBER;
    }>;
    getMyAlliance(kingdomId: string): Promise<{
        alliance: Alliance;
        members: {
            kingdomId: string;
            name: any;
            score: any;
            role: AllianceRole;
            joinedAt: Date;
        }[];
        myRole: AllianceRole;
        memberCount: number;
        allianceBonus: number;
        maxMembers: number;
    }>;
    listAlliances(): Promise<{
        memberCount: any;
        maxMembers: number;
        id: string;
        name: string;
        tag: string;
        description: string;
        leader: Kingdom;
        score: number;
        createdAt: Date;
    }[]>;
    isAllied(kingdomId1: string, kingdomId2: string): Promise<boolean>;
    getAllianceBonusForKingdom(kingdomId: string): Promise<number>;
    private updateAllianceScore;
}
