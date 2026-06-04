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
        const alliance = this.allianceRepo.create({
            name, tag, description,
            leader: { id: kingdomId },
        });
        await this.allianceRepo.save(alliance);
        const member = this.memberRepo.create({
            allianceId: alliance.id,
            kingdomId,
            role: alliance_member_entity_1.AllianceRole.LEADER,
        });
        await this.memberRepo.save(member);
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
        if (count >= alliance.maxMembers)
            throw new common_1.BadRequestException('Alliance is full');
        const member = this.memberRepo.create({ allianceId, kingdomId, role: alliance_member_entity_1.AllianceRole.MEMBER });
        return this.memberRepo.save(member);
    }
    async leave(kingdomId) {
        const member = await this.memberRepo.findOne({ where: { kingdomId } });
        if (!member)
            throw new common_1.BadRequestException('Not in an alliance');
        if (member.role === alliance_member_entity_1.AllianceRole.LEADER) {
            throw new common_1.BadRequestException('Leader must transfer leadership before leaving');
        }
        await this.memberRepo.remove(member);
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
    async donateResources(kingdomId, gold = 0, wood = 0, stone = 0) {
        const member = await this.memberRepo.findOne({ where: { kingdomId }, relations: ['alliance'] });
        if (!member) throw new common_1.BadRequestException('Not in an alliance');
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        if (!kingdom) throw new common_1.BadRequestException('Kingdom not found');
        const MIN = 100, MAX = 10000;
        const totalDonate = gold + wood + stone;
        if (totalDonate < MIN) throw new common_1.BadRequestException(`מינימום תרומה ${MIN} משאבים`);
        if (totalDonate > MAX) throw new common_1.BadRequestException(`מקסימום תרומה ${MAX} משאבים`);
        if (gold > 0 && kingdom.gold < gold) throw new common_1.BadRequestException('Not enough gold');
        if (wood > 0 && kingdom.wood < wood) throw new common_1.BadRequestException('Not enough wood');
        if (stone > 0 && kingdom.stone < stone) throw new common_1.BadRequestException('Not enough stone');
        kingdom.gold -= gold;
        kingdom.wood -= wood;
        kingdom.stone -= stone;
        // Bonus: 5 gems per 1000 donated, plus alliance score
        const gemsBonus = Math.floor(totalDonate / 1000) * 5;
        kingdom.gems += gemsBonus;
        await this.kingdomRepo.save(kingdom);
        const alliance = member.alliance;
        alliance.score = (alliance.score || 0) + Math.floor(totalDonate / 10);
        await this.allianceRepo.save(alliance);
        return { donated: { gold, wood, stone }, gemsBonus, allianceScore: alliance.score };
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