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
const quest_service_1 = require("../quest/quest.service");
const MAX_ADS_PER_DAY = 10;
const BOOST_DURATION_HOURS = 1;
let AdsService = class AdsService {
    constructor(kingdomRepo, questService) {
        this.kingdomRepo = kingdomRepo;
        this.questService = questService;
    }
    async claimReward(userId, kingdomId, rewardType) {
        const today = new Date().toISOString().split('T')[0];
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        if (!kingdom)
            throw new common_1.BadRequestException('Kingdom not found');
        if (kingdom.adsWatchedDate !== today) {
            kingdom.adsWatchedToday = 0;
            kingdom.adsWatchedDate = today;
        }
        if (kingdom.adsWatchedToday >= MAX_ADS_PER_DAY) {
            throw new common_1.BadRequestException(`מקסימום ${MAX_ADS_PER_DAY} פרסומות ליום`);
        }
        kingdom.adsWatchedToday += 1;
        let result;
        if (rewardType === 'double_production') {
            const until = new Date(Date.now() + BOOST_DURATION_HOURS * 3_600_000);
            kingdom.productionBoostUntil = until;
            result = {
                reward: 'double_production',
                boostUntil: until,
                adsRemainingToday: MAX_ADS_PER_DAY - kingdom.adsWatchedToday,
            };
        }
        else if (rewardType === 'gems') {
            kingdom.gems += 10;
            result = { reward: 'gems', gemsAdded: 10 };
        }
        else {
            const resourceBonuses = {
                gold_bonus: { amount: 500, apply: (k, v) => { k.gold = Math.min(k.maxGold, k.gold + v); } },
                wood_bonus: { amount: 500, apply: (k, v) => { k.wood = Math.min(k.maxWood, k.wood + v); } },
                stone_bonus: { amount: 500, apply: (k, v) => { k.stone = Math.min(k.maxStone, k.stone + v); } },
                food_bonus: { amount: 500, apply: (k, v) => { k.food = Math.min(k.maxFood, k.food + v); } },
            };
            const bonus = resourceBonuses[rewardType];
            if (!bonus)
                throw new common_1.BadRequestException('Invalid reward type');
            bonus.apply(kingdom, bonus.amount);
            result = { reward: rewardType, amount: bonus.amount };
        }
        await this.kingdomRepo.save(kingdom);
        if (rewardType === 'gold_bonus') {
            await this.questService.incrementQuest(kingdomId, 'collect_gold_1000', 500).catch(() => { });
        }
        return result;
    }
    async getBoostStatus(kingdomId) {
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        if (!kingdom) {
            return { boostActive: false, boostUntil: null, adsWatchedToday: 0, adsRemainingToday: MAX_ADS_PER_DAY };
        }
        const today = new Date().toISOString().split('T')[0];
        const adsToday = kingdom.adsWatchedDate === today ? kingdom.adsWatchedToday : 0;
        const until = kingdom.productionBoostUntil ? new Date(kingdom.productionBoostUntil) : null;
        const active = !!(until && new Date() < until);
        return {
            boostActive: active,
            boostUntil: active ? until : null,
            adsWatchedToday: adsToday,
            adsRemainingToday: MAX_ADS_PER_DAY - adsToday,
        };
    }
};
exports.AdsService = AdsService;
exports.AdsService = AdsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(kingdom_entity_1.Kingdom)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        quest_service_1.QuestService])
], AdsService);
//# sourceMappingURL=ads.service.js.map