"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllianceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const alliance_entity_1 = require("./alliance.entity");
const alliance_member_entity_1 = require("./alliance-member.entity");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const CREATE_COST = 500;
const MAX_MEMBERS = 20;
let AllianceService = class AllianceService {
    constructor(allianceRepo, memberRepo, kingdomRepo) {
        this.allianceRepo = allianceRepo;
        this.memberRepo = memberRepo;
        this.kingdomRepo = kingdomRepo;
    }
    async create(kingdomId, name, tag, description) {
        const existing = await this.memberRepo.findOne({ where: { kingdomId } });
        if (existing)
            throw new common_1.BadRequestException('Already in an alliance');
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        if ((kingdom.gems ?? 0) < CREATE_COST)
            throw new common_1.BadRequestException(`Need ${CREATE_COST} gems to create an alliance`);
        const nameTaken = await this.allianceRepo.findOne({ where: { name } });
        if (nameTaken)
            throw new common_1.BadRequestException('Alliance name already taken');
        const tagTaken = await this.allianceRepo.findOne({ where: { tag: tag.toUpperCase() } });
        if (tagTaken)
            throw new common_1.BadRequestException('Alliance tag already taken');
        kingdom.gems -= CREATE_COST;
        await this.kingdomRepo.save(kingdom);
        const alliance = this.allianceRepo.create({
            name,
            tag: tag.toUpperCase(),
            description,
            leader: { id: kingdomId },
            score: kingdom.score ?? 0,
        });
        await this.allianceRepo.save(alliance);
        await this.memberRepo.save(this.memberRepo.create({
            allianceId: alliance.id,
            kingdomId,
            role: alliance_member_entity_1.AllianceRole.LEADER,
        }));
        return alliance;
    }
    async join(kingdomId, allianceId) {
        const existing = await this.memberRepo.findOne({ where: { kingdomId } });
        if (existing)
            throw new common_1.BadRequestException('Already in an alliance');
        const alliance = await this.allianceRepo.findOne({ where: { id: allianceId } });
        if (!alliance)
            throw new common_1.NotFoundException('Alliance not found');
        const count = await this.memberRepo.count({ where: { allianceId } });
        if (count >= MAX_MEMBERS)
            throw new common_1.BadRequestException('Alliance is full');
        const member = this.memberRepo.create({ allianceId, kingdomId, role: alliance_member_entity_1.AllianceRole.MEMBER });
        await this.memberRepo.save(member);
        await this.updateAllianceScore(allianceId);
        return member;
    }
    async leave(kingdomId) {
        const member = await this.memberRepo.findOne({ where: { kingdomId } });
        if (!member)
            throw new common_1.BadRequestException('Not in an alliance');
        if (member.role === alliance_member_entity_1.AllianceRole.LEADER) {
            const count = await this.memberRepo.count({ where: { allianceId: member.allianceId } });
            if (count > 1)
                throw new common_1.BadRequestException('Transfer leadership before leaving');
            await this.memberRepo.delete({ allianceId: member.allianceId });
            await this.allianceRepo.delete({ id: member.allianceId });
            return { disbanded: true };
        }
        const allianceId = member.allianceId;
        await this.memberRepo.remove(member);
        await this.updateAllianceScore(allianceId);
        return { left: true };
    }
    async kick(leaderKingdomId, targetKingdomId) {
        const leader = await this.memberRepo.findOne({ where: { kingdomId: leaderKingdomId } });
        if (!leader || (leader.role !== alliance_member_entity_1.AllianceRole.LEADER && leader.role !== alliance_member_entity_1.AllianceRole.OFFICER))
            throw new common_1.ForbiddenException('Not authorized');
        const target = await this.memberRepo.findOne({
            where: { kingdomId: targetKingdomId, allianceId: leader.allianceId },
        });
        if (!target)
            throw new common_1.NotFoundException('Member not found');
        if (target.role === alliance_member_entity_1.AllianceRole.LEADER)
            throw new common_1.ForbiddenException('Cannot kick the leader');
        await this.memberRepo.remove(target);
        await this.updateAllianceScore(leader.allianceId);
        return { kicked: true };
    }
    async disband(leaderKingdomId) {
        const leader = await this.memberRepo.findOne({ where: { kingdomId: leaderKingdomId } });
        if (!leader || leader.role !== alliance_member_entity_1.AllianceRole.LEADER)
            throw new common_1.ForbiddenException('Not the leader');
        await this.memberRepo.delete({ allianceId: leader.allianceId });
        await this.allianceRepo.delete({ id: leader.allianceId });
        return { disbanded: true };
    }
    async transferLeadership(leaderKingdomId, targetKingdomId) {
        const leader = await this.memberRepo.findOne({ where: { kingdomId: leaderKingdomId } });
        if (!leader || leader.role !== alliance_member_entity_1.AllianceRole.LEADER)
            throw new common_1.ForbiddenException('Not the leader');
        const target = await this.memberRepo.findOne({
            where: { kingdomId: targetKingdomId, allianceId: leader.allianceId },
        });
        if (!target)
            throw new common_1.NotFoundException('Member not found');
        await this.allianceRepo.update({ id: leader.allianceId }, { leader: { id: targetKingdomId } });
        leader.role = alliance_member_entity_1.AllianceRole.MEMBER;
        target.role = alliance_member_entity_1.AllianceRole.LEADER;
        await this.memberRepo.save([leader, target]);
        return { transferred: true };
    }
    async promote(leaderKingdomId, targetKingdomId) {
        const leader = await this.memberRepo.findOne({ where: { kingdomId: leaderKingdomId } });
        if (!leader || leader.role !== alliance_member_entity_1.AllianceRole.LEADER)
            throw new common_1.ForbiddenException('Not the leader');
        const target = await this.memberRepo.findOne({
            where: { kingdomId: targetKingdomId, allianceId: leader.allianceId },
        });
        if (!target)
            throw new common_1.NotFoundException('Member not found');
        target.role = target.role === alliance_member_entity_1.AllianceRole.OFFICER ? alliance_member_entity_1.AllianceRole.MEMBER : alliance_member_entity_1.AllianceRole.OFFICER;
        await this.memberRepo.save(target);
        return { role: target.role };
    }
    async getMyAlliance(kingdomId) {
        const member = await this.memberRepo.findOne({
            where: { kingdomId },
            relations: ['alliance'],
        });
        if (!member)
            return null;
        const members = await this.memberRepo.find({
            where: { allianceId: member.allianceId },
            relations: ['kingdom'],
        });
        const memberCount = members.length;
        const allianceBonus = Math.min(15, memberCount * 3);
        return {
            alliance: member.alliance,
            members: members.map(m => ({
                kingdomId: m.kingdomId,
                name: m.kingdom?.name ?? '?',
                score: m.kingdom?.score ?? 0,
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
    async isAllied(kingdomId1, kingdomId2) {
        const m1 = await this.memberRepo.findOne({ where: { kingdomId: kingdomId1 } });
        if (!m1)
            return false;
        const m2 = await this.memberRepo.findOne({ where: { kingdomId: kingdomId2, allianceId: m1.allianceId } });
        return !!m2;
    }
    async getAllianceBonusForKingdom(kingdomId) {
        const member = await this.memberRepo.findOne({ where: { kingdomId } });
        if (!member)
            return 0;
        const count = await this.memberRepo.count({ where: { allianceId: member.allianceId } });
        return Math.min(0.15, count * 0.03);
    }
    async updateAllianceScore(allianceId) {
        const members = await this.memberRepo.find({
            where: { allianceId },
            relations: ['kingdom'],
        });
        const total = members.reduce((s, m) => s + (m.kingdom?.score ?? 0), 0);
        await this.allianceRepo.update({ id: allianceId }, { score: total });
    }
};
exports.AllianceService = AllianceService;
exports.AllianceService = AllianceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(alliance_entity_1.Alliance)),
    __param(1, (0, typeorm_1.InjectRepository)(alliance_member_entity_1.AllianceMember)),
    __param(2, (0, typeorm_1.InjectRepository)(kingdom_entity_1.Kingdom)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AllianceService);
//# sourceMappingURL=alliance.service.js.map