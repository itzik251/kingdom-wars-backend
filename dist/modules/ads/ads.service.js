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
exports.AdsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const boostStore = new Map();
const adCooldown = new Map();
const MAX_ADS_PER_DAY = 5;
const BOOST_DURATION_HOURS = 1;
let AdsService = class AdsService {
    constructor(kingdomRepo) {
        this.kingdomRepo = kingdomRepo;
    }
    async claimReward(userId, kingdomId, rewardType) {
        const today = new Date().toISOString().split('T')[0];
        const cooldown = adCooldown.get(userId);
        if (cooldown?.date === today && cooldown.count >= MAX_ADS_PER_DAY) {
            throw new common_1.BadRequestException(`מקסימום ${MAX_ADS_PER_DAY} פרסומות ליום`);
        }
        adCooldown.set(userId, {
            date: today,
            count: (cooldown?.date === today ? cooldown.count : 0) + 1,
        });
        if (rewardType === 'double_production') {
            const until = new Date(Date.now() + BOOST_DURATION_HOURS * 3_600_000);
            boostStore.set(userId, until);
            return { reward: 'double_production', boostUntil: until, adsRemainingToday: MAX_ADS_PER_DAY - (adCooldown.get(userId)?.count || 0) };
        }
        if (rewardType === 'gems') {
            const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
            kingdom.gems += 10;
            await this.kingdomRepo.save(kingdom);
            return { reward: 'gems', gemsAdded: 10 };
        }
    }
    getBoostStatus(userId) {
        const until = boostStore.get(userId);
        const active = until && new Date() < until;
        const today = new Date().toISOString().split('T')[0];
        const cooldown = adCooldown.get(userId);
        return {
            boostActive: !!active,
            boostUntil: active ? until : null,
            adsWatchedToday: cooldown?.date === today ? cooldown.count : 0,
            adsRemainingToday: MAX_ADS_PER_DAY - (cooldown?.date === today ? cooldown.count : 0),
        };
    }
    hasActiveBoost(userId) {
        const until = boostStore.get(userId);
        return !!(until && new Date() < until);
    }
};
exports.AdsService = AdsService;
exports.AdsService = AdsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(kingdom_entity_1.Kingdom)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AdsService);
//# sourceMappingURL=ads.service.js.map