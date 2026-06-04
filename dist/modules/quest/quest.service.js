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
exports.QuestService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const quest_entity_1 = require("./quest.entity");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const DAILY_QUESTS = [
    { key: 'collect_gold_1000', target: 1000, rewardGems: 10 },
    { key: 'upgrade_building', target: 1, rewardGems: 15 },
    { key: 'perform_attack', target: 1, rewardGems: 20 },
];
const WEEKLY_QUESTS = [
    { key: 'train_500_soldiers', target: 500, rewardGems: 100 },
    { key: 'win_20_battles', target: 20, rewardGems: 200 },
];
let QuestService = class QuestService {
    constructor(questRepo, kingdomRepo) {
        this.questRepo = questRepo;
        this.kingdomRepo = kingdomRepo;
    }
    async getDailyQuests(kingdomId) {
        const today = new Date().toISOString().split('T')[0];
        return this.ensureQuests(kingdomId, DAILY_QUESTS, quest_entity_1.QuestPeriod.DAILY, today);
    }
    async getWeeklyQuests(kingdomId) {
        const weekStart = this.getWeekStart();
        return this.ensureQuests(kingdomId, WEEKLY_QUESTS, quest_entity_1.QuestPeriod.WEEKLY, weekStart);
    }
    async incrementQuest(kingdomId, questKey, amount = 1) {
        const today = new Date().toISOString().split('T')[0];
        const weekStart = this.getWeekStart();
        const isWeekly = WEEKLY_QUESTS.some(q => q.key === questKey);
        const periodDate = isWeekly ? weekStart : today;
        if (isWeekly) {
            await this.ensureQuests(kingdomId, WEEKLY_QUESTS, quest_entity_1.QuestPeriod.WEEKLY, weekStart);
        }
        else {
            await this.ensureQuests(kingdomId, DAILY_QUESTS, quest_entity_1.QuestPeriod.DAILY, today);
        }
        const quest = await this.questRepo.findOne({
            where: { kingdom: { id: kingdomId }, questKey, periodDate },
        });
        if (!quest || quest.completed)
            return;
        quest.progress = Math.min(quest.target, quest.progress + amount);
        if (quest.progress >= quest.target)
            quest.completed = true;
        await this.questRepo.save(quest);
    }
    async claimReward(kingdomId, questId) {
        const quest = await this.questRepo.findOne({ where: { id: questId, kingdom: { id: kingdomId } } });
        if (!quest?.completed || quest.rewardClaimed)
            return null;
        const questDef = [...DAILY_QUESTS, ...WEEKLY_QUESTS].find(q => q.key === quest.questKey);
        if (!questDef)
            return null;
        // Atomic update — prevents double-claim race condition
        const updateResult = await this.questRepo.update(
            { id: questId, rewardClaimed: false },
            { rewardClaimed: true }
        );
        if (!updateResult.affected || updateResult.affected === 0)
            return null; // already claimed by another request
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        kingdom.gems += questDef.rewardGems;
        await this.kingdomRepo.save(kingdom);
        return { gemsRewarded: questDef.rewardGems };
    }
    async ensureQuests(kingdomId, defs, period, periodDate) {
        const existing = await this.questRepo.find({
            where: { kingdom: { id: kingdomId }, period, periodDate },
        });
        const toCreate = defs.filter(d => !existing.find(e => e.questKey === d.key));
        if (toCreate.length > 0) {
            await this.questRepo.save(toCreate.map(d => this.questRepo.create({
                kingdom: { id: kingdomId },
                questKey: d.key,
                period,
                target: d.target,
                periodDate,
            })));
        }
        return this.questRepo.find({
            where: { kingdom: { id: kingdomId }, period, periodDate },
        });
    }
    getWeekStart() {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(now.setDate(diff)).toISOString().split('T')[0];
    }
};
exports.QuestService = QuestService;
exports.QuestService = QuestService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(quest_entity_1.Quest)),
    __param(1, (0, typeorm_1.InjectRepository)(kingdom_entity_1.Kingdom)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], QuestService);
//# sourceMappingURL=quest.service.js.map