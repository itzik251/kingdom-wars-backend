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
    leave(kingdomId: string): Promise<void>;
    getMyAlliance(kingdomId: string): Promise<{
        alliance: Alliance;
        members: AllianceMember[];
        myRole: AllianceRole;
    }>;
    listAlliances(limit?: number): Promise<Alliance[]>;
}
