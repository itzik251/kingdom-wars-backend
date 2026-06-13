import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog) private repo: Repository<AuditLog>,
  ) {}

  log(
    action: AuditAction,
    kingdomId: string,
    details: Record<string, any>,
    userId?: string,
  ): void {
    // Fire-and-forget — never block the main flow
    this.repo.save(this.repo.create({ action, kingdomId, userId, details })).catch(() => {});
  }

  async getForKingdom(kingdomId: string, limit = 200) {
    return this.repo.find({
      where: { kingdomId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getAll(limit = 500) {
    return this.repo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
