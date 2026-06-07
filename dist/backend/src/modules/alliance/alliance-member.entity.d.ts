import { Alliance } from './alliance.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
export declare enum AllianceRole {
    LEADER = "leader",
    OFFICER = "officer",
    MEMBER = "member"
}
export declare class AllianceMember {
    allianceId: string;
    kingdomId: string;
    alliance: Alliance;
    kingdom: Kingdom;
    role: AllianceRole;
    joinedAt: Date;
}
