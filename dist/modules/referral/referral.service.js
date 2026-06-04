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
const STATIC_MILESTONES = [
    { count: 1,  gems: 100, label: '1 חבר' },
    { count: 5,  gems: 200, label: '5 חברים' },
    { count: 10, gems: 0,   label: '10 חברים', hero: 'ragnar' },
];
const USDT_MILESTONE_INTERVAL = 20;
let ReferralService = class ReferralService {
    constructor(userRepo, kingdomRepo) {
        this.userRepo = userRepo;
        this.kingdomRepo = kingdomRepo;
    }
    async getStats(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        const referredCount = await this.userRepo.count({ where: { referredBy: { id: userId } } });
        const claimedSet = new Set((user.claimedReferralMilestones ?? []).map(Number));

        // Dynamic USDT milestone: next unclaimed multiple of 20
        const claimedUsdtRounds = [...claimedSet].filter(n => n % USDT_MILESTONE_INTERVAL === 0 && n > 10);
        const nextUsdtCount = claimedUsdtRounds.length > 0
            ? Math.max(...claimedUsdtRounds) + USDT_MILESTONE_INTERVAL
            : USDT_MILESTONE_INTERVAL;
        const MILESTONES = [
            ...STATIC_MILESTONES,
            { count: nextUsdtCount, gems: 0, label: `${nextUsdtCount} חברים`, usdt: 1 },
        ];

        const milestones = MILESTONES.map(m => ({
            ...m,
            reached: referredCount >= m.count && !claimedSet.has(m.count),
            alreadyClaimed: claimedSet.has(m.count),
        }));
        const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'KingdomWarsBot';
        const link = `https://t.me/${botUsername}?start=ref_${user.referralCode}`;
        return {
            referralCode: user.referralCode,
            link,
            referredCount,
            milestones,
        };
    }
    async claimMilestone(userId, milestoneCount) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        const referredCount = await this.userRepo.count({ where: { referredBy: { id: userId } } });
        // Rebuild milestones the same way as getStats
        const claimedSet = new Set((user.claimedReferralMilestones ?? []).map(Number));
        const claimedUsdtRounds = [...claimedSet].filter(n => n % USDT_MILESTONE_INTERVAL === 0 && n > 10);
        const nextUsdtCount = claimedUsdtRounds.length > 0
            ? Math.max(...claimedUsdtRounds) + USDT_MILESTONE_INTERVAL
            : USDT_MILESTONE_INTERVAL;
        const MILESTONES = [
            ...STATIC_MILESTONES,
            { count: nextUsdtCount, gems: 0, label: `${nextUsdtCount} חברים`, usdt: 1 },
        ];
        const milestone = MILESTONES.find(m => m.count === milestoneCount);
        if (!milestone)
            return { error: 'milestone not found' };
        if (referredCount < milestone.count)
            return { error: 'not reached yet' };
        const claimed = user.claimedReferralMilestones ?? [];
        if (claimed.map(Number).includes(milestoneCount))
            return { error: 'already claimed' };
        user.claimedReferralMilestones = [...claimed.map(Number), milestoneCount];
        await this.userRepo.save(user);
        const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: userId } } });
        if (!kingdom)
            return { error: 'kingdom not found' };
        if (milestone.gems > 0) {
            kingdom.gems += milestone.gems;
        }
        if (milestone.usdt > 0) {
            kingdom.usdtBalance = (kingdom.usdtBalance || 0) + milestone.usdt;
        }
        await this.kingdomRepo.save(kingdom);
        return { claimed: true, gems: milestone.gems, usdt: milestone.usdt, skin: milestone.skin, hero: milestone.hero };
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