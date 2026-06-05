import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';

@Injectable()
export class LeaderboardService {
  constructor(@InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>) {}

  async getTop(limit = 50, includeAll = false) {
    const qb = this.kingdomRepo
      .createQueryBuilder('k')
      .leftJoinAndSelect('k.user', 'u')
      .select([
        'k.id', 'k.name', 'k.score', 'k.shieldUntil',
        'u.username', 'u.firstName', 'u.avatarUrl',
      ])
      .orderBy('k.score', 'DESC')
      .limit(includeAll ? 500 : limit);

    if (!includeAll) qb.where('k.score > 0');

    const rows = await qb.getMany();

    const now = new Date();
    // Shape to what the frontend (LeaderboardScreen / WorldMapScreen) expects
    return rows.map((k, i) => ({
      id: k.id,
      rank: i + 1,
      kingdomName: k.name,
      username: k.user?.username || k.user?.firstName || null,
      avatarUrl: k.user?.avatarUrl || null,
      score: k.score,
      isShielded: !!(k.shieldUntil && now < new Date(k.shieldUntil)),
    }));
  }
}
