import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './audit-log.entity';
export declare class AuditService {
    private repo;
    constructor(repo: Repository<AuditLog>);
    log(action: AuditAction, kingdomId: string, details: Record<string, any>, userId?: string): void;
    getForKingdom(kingdomId: string, limit?: number): Promise<AuditLog[]>;
    getAll(limit?: number): Promise<AuditLog[]>;
}
