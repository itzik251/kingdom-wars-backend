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
var AdsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const quest_service_1 = require("../quest/quest.service");
const MAX_ADS_PER_DAY = 30;
const BOOST_DURATION_HOURS = 1;
let AdsService = AdsService_1 = class AdsService {
    constructor(kingdomRepo, dataSource, questService) {
        this.kingdomRepo = kingdomRepo;
        this.dataSource = dataSource;
        this.questService = questService;
        this.logger = new common_1.Logger(AdsService_1.name);
    }
    async verifyAdsgramToken(token) {
        try {
            const res = await fetch(`https://api.adsgram.ai/adv?token=${encodeURIComponent(token)}`, {
                headers: { 'Accept': 'application/json' },
            });
            if (!res.ok)
                return false;
            const data = await res.json();
            return data?.done === true;
        }
        catch {
            return true;
        }
    }
    async claimReward(userId, kingdomId, rewardType, adsgramToken) {
        if (adsgramToken && adsgramToken.length > 5) {
            const already = await this.dataSource.query(`SELECT 1 FROM ad_reward_tokens WHERE token = $1 LIMIT 1`, [adsgramToken]).catch(() => []);
            if (already.length > 0) {
                throw new common_1.BadRequestException('TOKEN_ALREADY_USED');
            }
            await this.dataSource.query(`INSERT INTO ad_reward_tokens(token, kingdom_id) VALUES($1,$2) ON CONFLICT DO NOTHING`, [adsgramToken, kingdomId]).catch(() => { });
        }
        return this.dataSource.transaction(async (manager) => {
            const kingdom = await manager.findOne(kingdom_entity_1.Kingdom, {
                where: { id: kingdomId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!kingdom)
                throw new common_1.BadRequestException('Kingdom not found');
            const today = new Date().toISOString().split('T')[0];
            if (kingdom.adsWatchedDate !== today) {
                kingdom.adsWatchedToday = 0;
                kingdom.adsWatchedDate = today;
            }
            if (kingdom.adsWatchedToday >= MAX_ADS_PER_DAY) {
                throw new common_1.BadRequestException('ADS_DAILY_LIMIT');
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
            else if (rewardType === 'double_attack_speed') {
                const until = new Date(Date.now() + BOOST_DURATION_HOURS * 3_600_000);
                kingdom.attackSpeedBoostUntil = until;
                result = {
                    reward: 'double_attack_speed',
                    boostUntil: until,
                    adsRemainingToday: MAX_ADS_PER_DAY - kingdom.adsWatchedToday,
                };
            }
            else if (rewardType === 'usdt_bonus') {
                kingdom.usdtBalance = parseFloat(((kingdom.usdtBalance || 0) + 0.001).toFixed(6));
                result = { reward: 'usdt_bonus', usdtAdded: 0.001 };
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
            await manager.save(kingdom_entity_1.Kingdom, kingdom);
            this.logger.log(`Ad reward: kingdom=${kingdomId} type=${rewardType} ads=${kingdom.adsWatchedToday}/${MAX_ADS_PER_DAY}`);
            if (rewardType === 'gold_bonus') {
                this.questService.incrementQuest(kingdomId, 'collect_gold_1000', 500).catch(() => { });
            }
            return result;
        });
    }
    async getBoostStatus(kingdomId) {
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        if (!kingdom) {
            return {
                boostActive: false, boostUntil: null,
                attackBoostActive: false, attackBoostUntil: null,
                adsWatchedToday: 0, adsRemainingToday: MAX_ADS_PER_DAY,
            };
        }
        const today = new Date().toISOString().split('T')[0];
        const adsToday = kingdom.adsWatchedDate === today ? kingdom.adsWatchedToday : 0;
        const until = kingdom.productionBoostUntil ? new Date(kingdom.productionBoostUntil) : null;
        const active = !!(until && new Date() < until);
        const attackUntil = kingdom.attackSpeedBoostUntil ? new Date(kingdom.attackSpeedBoostUntil) : null;
        const attackBoostActive = !!(attackUntil && new Date() < attackUntil);
        return {
            boostActive: active,
            boostUntil: active ? until : null,
            attackBoostActive,
            attackBoostUntil: attackBoostActive ? attackUntil : null,
            adsWatchedToday: adsToday,
            adsRemainingToday: MAX_ADS_PER_DAY - adsToday,
        };
    }
};
exports.AdsService = AdsService;
exports.AdsService = AdsService = AdsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(kingdom_entity_1.Kingdom)),
    __param(1, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource,
        quest_service_1.QuestService])
], AdsService);
//# sourceMappingURL=ads.service.js.map