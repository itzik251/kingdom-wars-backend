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
exports.ReferralService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../user/user.entity");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");

// Each milestone type has a unique offset range to avoid key collisions.
// claimKey = offset + count (stored in claimedReferralMilestones)
const MILESTONE_TYPES = [
    { interval: 1,  offset: 0,     gems: 100, usdt: 0, hero: null, labelFn: (c) => `חבר מספר ${c}` },
    { interval: 5,  offset: 10000, gems: 200, usdt: 0, hero: null, labelFn: (c) => `${c} חברים` },
    { interval: 10, offset: 20000, gems: 0,   usdt: 0, hero: 'ragnar', labelFn: (c) => `${c} חברים` },
    { interval: 20, offset: 30000, gems: 0,   usdt: 1, hero: null, labelFn: (c) => `${c} חברים` },
];

function buildMilestones(claimedSet, referredCount) {
    return MILESTONE_TYPES.map(type => {
        // Find all claimed keys belonging to this type's offset range
        const claimedOfType = [...claimedSet].filter(k => k > type.offset && k < type.offset + 10000);
        const claimedCounts = claimedOfType.map(k => k - type.offset);
        const nextCount = claimedCounts.length > 0
            ? Math.max(...claimedCounts) + type.interval
            : type.interval;
        const claimKey = type.offset + nextCount;
        return {
            claimKey,
            count: nextCount,
            label: type.labelFn(nextCount),
            gems: type.gems,
            usdt: type.usdt,
            hero: type.hero,
            reached: referredCount >= nextCount && !claimedSet.has(claimKey),
            alreadyClaimed: claimedSet.has(claimKey),
        };
    });
}

let ReferralService = class ReferralService {
    constructor(userRepo, kingdomRepo) {
        this.userRepo = userRepo;
        this.kingdomRepo = kingdomRepo;
    }
    async getStats(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        const referredCount = await this.userRepo.count({ where: { referredBy: { id: userId } } });
        const claimedSet = new Set((user.claimedReferralMilestones ?? []).map(Number));
        const milestones = buildMilestones(claimedSet, referredCount);
        const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'KingdomWarsBot';
        const link = `https://t.me/${botUsername}?start=ref_${user.referralCode}`;
        return {
            referralCode: user.referralCode,
            link,
            referredCount,
            milestones,
        };
    }
    async claimMilestone(userId, claimKey) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        const referredCount = await this.userRepo.count({ where: { referredBy: { id: userId } } });
        const claimedSet = new Set((user.claimedReferralMilestones ?? []).map(Number));

        const milestones = buildMilestones(claimedSet, referredCount);
        const milestone = milestones.find(m => m.claimKey === claimKey);
        if (!milestone)
            return { error: 'milestone not found' };
        if (referredCount < milestone.count)
            return { error: 'not reached yet' };
        if (claimedSet.has(claimKey))
            return { error: 'already claimed' };

        user.claimedReferralMilestones = [...claimedSet, claimKey];
        await this.userRepo.save(user);

        const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: userId } } });
        if (!kingdom)
            return { error: 'kingdom not found' };
        if (milestone.gems > 0)
            kingdom.gems += milestone.gems;
        if (milestone.usdt > 0)
            kingdom.usdtBalance = (kingdom.usdtBalance || 0) + milestone.usdt;
        await this.kingdomRepo.save(kingdom);

        return { claimed: true, gems: milestone.gems, usdt: milestone.usdt, hero: milestone.hero };
    }
};
exports.ReferralService = ReferralService;
exports.ReferralService = ReferralService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(kingdom_entity_1.Kingdom)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ReferralService);
//# sourceMappingURL=referral.service.js.map
