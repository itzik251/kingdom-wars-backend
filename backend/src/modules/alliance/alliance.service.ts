import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alliance } from './alliance.entity';
import { AllianceMember, AllianceRole } from './alliance-member.entity';
import { Kingdom } from '../kingdom/kingdom.entity';

@Injectable()
export class AllianceService {
  constructor(
    @InjectRepository(Alliance) private allianceRepo: Repository<Alliance>,
    @InjectRepository(AllianceMember) private memberRepo: Repository<AllianceMember>,
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
  ) {}

  async create(kingdomId: string, name: string, tag: string, description?: string) {
    const existing = await this.memberRepo.findOne({ where: { kingdomId } });
    if (existing) throw new BadRequestException('Already in an alliance');

    const alliance = this.allianceRepo.create({
      name, tag, description,
      leader: { id: kingdomId } as any,
    });
    await this.allianceRepo.save(alliance);

    const member = this.memberRepo.create({
      allianceId: alliance.id,
      kingdomId,
      role: AllianceRole.LEADER,
    });
    await this.memberRepo.save(member);

    return alliance;
  }

  async join(kingdomId: string, allianceId: string) {
    const existing = await this.memberRepo.findOne({ where: { kingdomId } });
    if (existing) throw new BadRequestException('Already in an alliance');

    const alliance = await this.allianceRepo.findOne({ where: { id: allianceId } });
    if (!alliance) throw new NotFoundException('Alliance not found');

    const count = await this.memberRepo.count({ where: { allianceId } });
    if (count >= alliance.maxMembers) throw new BadRequestException('Alliance is full');

    const member = this.memberRepo.create({ allianceId, kingdomId, role: AllianceRole.MEMBER });
    return this.memberRepo.save(member);
  }

  async leave(kingdomId: string) {
    const member = await this.memberRepo.findOne({ where: { kingdomId } });
    if (!member) throw new BadRequestException('Not in an alliance');
    if (member.role === AllianceRole.LEADER) {
      throw new BadRequestException('Leader must transfer leadership before leaving');
    }
    await this.memberRepo.remove(member);
  }

  async getMyAlliance(kingdomId: string) {
    const member = await this.memberRepo.findOne({
      where: { kingdomId },
      relations: ['alliance'],
    });
    if (!member) return null;

    const members = await this.memberRepo.find({
      where: { allianceId: member.allianceId },
      relations: ['kingdom', 'kingdom.user'],
    });

    return { alliance: member.alliance, members, myRole: member.role };
  }

  async listAlliances(limit = 20) {
    return this.allianceRepo.find({
      order: { score: 'DESC' },
      take: limit,
    });
  }
}
