import { AllianceService } from './alliance.service';
import { KingdomService } from '../kingdom/kingdom.service';
declare class CreateAllianceDto {
    name: string;
    tag: string;
    description?: string;
}
declare class JoinAllianceDto {
    allianceId: string;
}
declare class KickDto {
    targetKingdomId: string;
}
declare class TransferDto {
    targetKingdomId: string;
}
export declare class AllianceController {
    private allianceService;
    private kingdomService;
    constructor(allianceService: AllianceService, kingdomService: KingdomService);
    list(): Promise<{
        memberCount: any;
        maxMembers: number;
        id: string;
        name: string;
        tag: string;
        description: string;
        leader: import("../kingdom/kingdom.entity").Kingdom;
        score: number;
        createdAt: Date;
    }[]>;
    getMine(req: any): Promise<{
        alliance: import("./alliance.entity").Alliance;
        members: {
            kingdomId: string;
            name: any;
            score: any;
            role: import("./alliance-member.entity").AllianceRole;
            joinedAt: Date;
        }[];
        myRole: import("./alliance-member.entity").AllianceRole;
        memberCount: number;
        allianceBonus: number;
        maxMembers: number;
    }>;
    create(req: any, dto: CreateAllianceDto): Promise<import("./alliance.entity").Alliance>;
    join(req: any, dto: JoinAllianceDto): Promise<import("./alliance-member.entity").AllianceMember>;
    leave(req: any): Promise<{
        disbanded: boolean;
        left?: undefined;
    } | {
        left: boolean;
        disbanded?: undefined;
    }>;
    kick(req: any, dto: KickDto): Promise<{
        kicked: boolean;
    }>;
    transfer(req: any, dto: TransferDto): Promise<{
        transferred: boolean;
    }>;
    promote(req: any, targetKingdomId: string): Promise<{
        role: import("./alliance-member.entity").AllianceRole.OFFICER | import("./alliance-member.entity").AllianceRole.MEMBER;
    }>;
    disband(req: any): Promise<{
        disbanded: boolean;
    }>;
}
export {};
