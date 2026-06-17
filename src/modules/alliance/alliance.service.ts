import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alliance } from './alliance.entity';
import { AllianceMember, AllianceRole } from './alliance-member.entity';
import { Kingdom } from '../kingdom/kingdom.entity';

const CREATE_COST = 500; // gems
const MAX_MEMBERS = 20;

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

    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    if ((kingdom.gems ?? 0) < CREATE_COST)
      throw new BadRequestException(`Need ${CREATE_COST} gems to create an alliance`);

    const nameTaken = await this.allianceRepo.findOne({ where: { name } });
    if (nameTaken) throw new BadRequestException('Alliance name already taken');
    const tagTaken = await this.allianceRepo.findOne({ where: { tag: tag.toUpperCase() } });
    if (tagTaken) throw new BadRequestException('Alliance tag already taken');

    kingdom.gems -= CREATE_COST;
    await this.kingdomRepo.save(kingdom);

    const alliance = this.allianceRepo.create({
      name,
      tag: tag.toUpperCase(),
      description,
      leader: { id: kingdomId } as any,
      score: kingdom.score ?? 0,
    });
    await this.allianceRepo.save(alliance);

    await this.memberRepo.save(this.memberRepo.create({
      allianceId: alliance.id,
      kingdomId,
      role: AllianceRole.LEADER,
    }));

    return alliance;
  }

  async join(kingdomId: string, allianceId: string) {
    const existing = await this.memberRepo.findOne({ where: { kingdomId } });
    if (existing) throw new BadRequestException('Already in an alliance');

    const alliance = await this.allianceRepo.findOne({ where: { id: allianceId } });
    if (!alliance) throw new NotFoundException('Alliance not found');

    const count = await this.memberRepo.count({ where: { allianceId } });
    if (count >= MAX_MEMBERS) throw new BadRequestException('Alliance is full');

    const member = this.memberRepo.create({ allianceId, kingdomId, role: AllianceRole.MEMBER });
    await this.memberRepo.save(member);

    await this.updateAllianceScore(allianceId);
    return member;
  }

  async leave(kingdomId: string) {
    const member = await this.memberRepo.findOne({ where: { kingdomId } });
    if (!member) throw new BadRequestException('Not in an alliance');
    if (member.role === AllianceRole.LEADER) {
      const count = await this.memberRepo.count({ where: { allianceId: member.allianceId } });
      if (count > 1) throw new BadRequestException('Transfer leadership before leaving');
      // Last member — disband
      await this.memberRepo.delete({ allianceId: member.allianceId });
      await this.allianceRepo.delete({ id: member.allianceId });
      return { disbanded: true };
    }
    const allianceId = member.allianceId;
    await this.memberRepo.remove(member);
    await this.updateAllianceScore(allianceId);
    return { left: true };
  }

  async kick(leaderKingdomId: string, targetKingdomId: string) {
    const leader = await this.memberRepo.findOne({ where: { kingdomId: leaderKingdomId } });
    if (!leader || (leader.role !== AllianceRole.LEADER && leader.role !== AllianceRole.OFFICER))
      throw new ForbiddenException('Not authorized');

    const target = await this.memberRepo.findOne({
      where: { kingdomId: targetKingdomId, allianceId: leader.allianceId },
    });
    if (!target) throw new NotFoundException('Member not found');
    if (target.role === AllianceRole.LEADER) throw new ForbiddenException('Cannot kick the leader');

    await this.memberRepo.remove(target);
    await this.updateAllianceScore(leader.allianceId);
    return { kicked: true };
  }

  async disband(leaderKingdomId: string) {
    const leader = await this.memberRepo.findOne({ where: { kingdomId: leaderKingdomId } });
    if (!leader || leader.role !== AllianceRole.LEADER) throw new ForbiddenException('Not the leader');

    await this.memberRepo.delete({ allianceId: leader.allianceId });
    await this.allianceRepo.delete({ id: leader.allianceId });
    return { disbanded: true };
  }

  async transferLeadership(leaderKingdomId: string, targetKingdomId: string) {
    const leader = await this.memberRepo.findOne({ where: { kingdomId: leaderKingdomId } });
    if (!leader || leader.role !== AllianceRole.LEADER) throw new ForbiddenException('Not the leader');

    const target = await this.memberRepo.findOne({
      where: { kingdomId: targetKingdomId, allianceId: leader.allianceId },
    });
    if (!target) throw new NotFoundException('Member not found');

    // Update leader in alliances table
    await this.allianceRepo.update({ id: leader.allianceId }, { leader: { id: targetKingdomId } as any });

    leader.role = AllianceRole.MEMBER;
    target.role = AllianceRole.LEADER;
    await this.memberRepo.save([leader, target]);
    return { transferred: true };
  }

  async promote(leaderKingdomId: string, targetKingdomId: string) {
    const leader = await this.memberRepo.findOne({ where: { kingdomId: leaderKingdomId } });
    if (!leader || leader.role !== AllianceRole.LEADER) throw new ForbiddenException('Not the leader');

    const target = await this.memberRepo.findOne({
      where: { kingdomId: targetKingdomId, allianceId: leader.allianceId },
    });
    if (!target) throw new NotFoundException('Member not found');

    target.role = target.role === AllianceRole.OFFICER ? AllianceRole.MEMBER : AllianceRole.OFFICER;
    await this.memberRepo.save(target);
    return { role: target.role };
  }

  async getMyAlliance(kingdomId: string) {
    const member = await this.memberRepo.findOne({
      where: { kingdomId },
      relations: ['alliance'],
    });
    if (!member) return null;

    const members = await this.memberRepo.find({
      where: { allianceId: member.allianceId },
      relations: ['kingdom'],
    });

    const memberCount = members.length;
    const allianceBonus = Math.min(15, memberCount * 3); // +3% per member, max 15%

    return {
      alliance: member.alliance,
      members: members.map(m => ({
        kingdomId: m.kingdomId,
        name: (m.kingdom as any)?.name ?? '?',
        score: (m.kingdom as any)?.score ?? 0,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      myRole: member.role,
      memberCount,
      allianceBonus,
      maxMembers: MAX_MEMBERS,
    };
  }

  async listAlliances() {
    const alliances = await this.allianceRepo.find({ order: { score: 'DESC' }, take: 30 });
    const counts = await this.memberRepo
      .createQueryBuilder('m')
      .select('m.allianceId', 'allianceId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('m.allianceId')
      .getRawMany();
    const countMap = Object.fromEntries(counts.map(c => [c.allianceId, Number(c.count)]));
    return alliances.map(a => ({ ...a, memberCount: countMap[a.id] ?? 0, maxMembers: MAX_MEMBERS }));
  }

  async isAllied(kingdomId1: string, kingdomId2: string): Promise<boolean> {
    const m1 = await this.memberRepo.findOne({ where: { kingdomId: kingdomId1 } });
    if (!m1) return false;
    const m2 = await this.memberRepo.findOne({ where: { kingdomId: kingdomId2, allianceId: m1.allianceId } });
    return !!m2;
  }

  async getAllianceBonusForKingdom(kingdomId: string): Promise<number> {
    const member = await this.memberRepo.findOne({ where: { kingdomId } });
    if (!member) return 0;
    const count = await this.memberRepo.count({ where: { allianceId: member.allianceId } });
    return Math.min(0.15, count * 0.03); // returns as a decimal (0.03 = 3%)
  }

  private async updateAllianceScore(allianceId: string) {
    const members = await this.memberRepo.find({
      where: { allianceId },
      relations: ['kingdom'],
    });
    const total = members.reduce((s, m) => s + ((m.kingdom as any)?.score ?? 0), 0);
    await this.allianceRepo.update({ id: allianceId }, { score: total });
  }
}
