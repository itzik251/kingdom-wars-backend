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
export declare class AllianceController {
    private allianceService;
    private kingdomService;
    constructor(allianceService: AllianceService, kingdomService: KingdomService);
    list(): Promise<import("./alliance.entity").Alliance[]>;
    getMine(req: any): Promise<{
        alliance: import("./alliance.entity").Alliance;
        members: import("./alliance-member.entity").AllianceMember[];
        myRole: import("./alliance-member.entity").AllianceRole;
    }>;
    create(req: any, dto: CreateAllianceDto): Promise<import("./alliance.entity").Alliance>;
    join(req: any, dto: JoinAllianceDto): Promise<import("./alliance-member.entity").AllianceMember>;
    leave(req: any): Promise<void>;
}
export {};
