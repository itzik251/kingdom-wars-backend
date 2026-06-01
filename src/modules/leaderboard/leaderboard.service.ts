import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';

@Injectable()
export class LeaderboardService {
  constructor(@InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>) {}

  async getTop(limit = 50) {
    return this.kingdomRepo
      .createQueryBuilder('k')
      .leftJoinAndSelect('k.user', 'u')
      .select(['k.id', 'k.name', 'k.score', 'u.username', 'u.firstName', 'u.avatarUrl'])
      .orderBy('k.score', 'DESC')
      .limit(limit)
      .getMany();
  }
}
