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
const unit_entity_1 = require("../units/unit.entity");
function calcRewards(from, to) {
    let gems = 0;
    let skins = 0;
    let vipDays = 0;
    for (let i = from + 1; i <= to; i++) {
        gems += 100;
        if (i % 5 === 0)
            gems += 200;
        if (i % 10 === 0)
            skins++;
        if (i % 20 === 0)
            vipDays += 30;
    }
    return { gems, skins, vipDays };
}
let ReferralService = class ReferralService {
    constructor(userRepo, kingdomRepo, unitRepo) {
        this.userRepo = userRepo;
        this.kingdomRepo = kingdomRepo;
        this.unitRepo = unitRepo;
    }
    async getActiveReferralCount(userId) {
        const result = await this.kingdomRepo
            .createQueryBuilder('k')
            .innerJoin('k.user', 'u')
            .innerJoin('u.referredBy', 'ref')
            .where('ref.id = :userId', { userId })
            .andWhere('k.score > 0')
            .getCount();
        return result;
    }
    async getTotalReferralCount(userId) {
        const result = await this.userRepo
            .createQueryBuilder('u')
            .innerJoin('u.referredBy', 'ref')
            .where('ref.id = :userId', { userId })
            .getCount();
        return result;
    }
    async autoGrantReferralHeroes(userId, referredCount) {
        const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: userId } } });
        if (!kingdom)
            return;
        const granted = kingdom.ragnarHeroGrantedCount ?? 0;
        const shouldGrant = Math.floor(referredCount / 10);
        const toGrant = shouldGrant - granted;
        if (toGrant <= 0)
            return;
        let ragnar = await this.unitRepo.findOne({
            where: { kingdom: { id: kingdom.id }, type: unit_entity_1.UnitType.RAGNAR },
        });
        if (!ragnar) {
            ragnar = this.unitRepo.create({ kingdom: { id: kingdom.id }, type: unit_entity_1.UnitType.RAGNAR, count: toGrant, trainingCount: 0, trainingEndsAt: null });
        }
        else {
            ragnar.count += toGrant;
        }
        await this.unitRepo.save(ragnar);
        kingdom.ragnarHeroGrantedCount = shouldGrant;
        await this.kingdomRepo.save(kingdom);
    }
    async getStats(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        const [referredCount, totalReferredCount] = await Promise.all([
            this.getActiveReferralCount(userId),
            this.getTotalReferralCount(userId),
        ]);
        await this.autoGrantReferralHeroes(userId, referredCount);
        const claimedCount = user.referralClaimedCount ?? 0;
        const pending = calcRewards(claimedCount, referredCount);
        const nextPerReferral = referredCount + 1;
        const nextBonus5 = Math.ceil((referredCount + 1) / 5) * 5;
        const nextSkin = Math.ceil((referredCount + 1) / 10) * 10;
        const nextVip = Math.ceil((referredCount + 1) / 20) * 20;
        const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'KingdomWarsBot';
        const link = `https://t.me/${botUsername}?start=ref_${user.referralCode}`;
        return {
            referralCode: user.referralCode,
            link,
            referredCount,
            totalReferredCount,
            claimedCount,
            pendingRewards: pending,
            hasPending: pending.gems > 0 || pending.skins > 0 || pending.vipDays > 0,
            nextMilestones: {
                gems100At: nextPerReferral,
                bonus200At: nextBonus5,
                skinAt: nextSkin,
                vipAt: nextVip,
            },
            milestones: [],
        };
    }
    async claimRewards(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        const referredCount = await this.getActiveReferralCount(userId);
        const claimedCount = user.referralClaimedCount ?? 0;
        if (referredCount <= claimedCount) {
            return { claimed: false, reason: 'no_pending' };
        }
        const { gems, skins, vipDays } = calcRewards(claimedCount, referredCount);
        const updateResult = await this.userRepo
            .createQueryBuilder()
            .update()
            .set({ referralClaimedCount: referredCount })
            .where('id = :id AND referral_claimed_count = :expected', { id: userId, expected: claimedCount })
            .execute();
        if (!updateResult.affected || updateResult.affected === 0) {
            return { claimed: false, reason: 'concurrent_claim' };
        }
        const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: userId } } });
        if (!kingdom)
            return { claimed: false, reason: 'no_kingdom' };
        if (gems > 0) {
            kingdom.gems += gems;
        }
        if (vipDays > 0) {
            const expiresAt = new Date(Math.max(Date.now(), kingdom.vipExpiresAt?.getTime() ?? 0) + vipDays * 86_400_000);
            kingdom.vipExpiresAt = expiresAt;
        }
        await this.kingdomRepo.save(kingdom);
        if (skins > 0) {
            let ragnar = await this.unitRepo.findOne({
                where: { kingdom: { id: kingdom.id }, type: unit_entity_1.UnitType.RAGNAR },
            });
            if (!ragnar) {
                ragnar = this.unitRepo.create({
                    kingdom: { id: kingdom.id },
                    type: unit_entity_1.UnitType.RAGNAR,
                    count: skins,
                    trainingCount: 0,
                    trainingEndsAt: null,
                });
            }
            else {
                ragnar.count += skins;
            }
            await this.unitRepo.save(ragnar);
        }
        return {
            claimed: true,
            gems,
            skins,
            vipDays,
            newClaimedCount: referredCount,
        };
    }
    async claimMilestone(userId, _milestoneCount) {
        return this.claimRewards(userId);
    }
};
exports.ReferralService = ReferralService;
exports.ReferralService = ReferralService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(kingdom_entity_1.Kingdom)),
    __param(2, (0, typeorm_1.InjectRepository)(unit_entity_1.Unit)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ReferralService);
//# sourceMappingURL=referral.service.js.map