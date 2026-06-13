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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Quest = exports.QuestPeriod = void 0;
const typeorm_1 = require("typeorm");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
var QuestPeriod;
(function (QuestPeriod) {
    QuestPeriod["DAILY"] = "daily";
    QuestPeriod["WEEKLY"] = "weekly";
})(QuestPeriod || (exports.QuestPeriod = QuestPeriod = {}));
let Quest = class Quest {
};
exports.Quest = Quest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Quest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => kingdom_entity_1.Kingdom),
    (0, typeorm_1.JoinColumn)({ name: 'kingdom_id' }),
    __metadata("design:type", kingdom_entity_1.Kingdom)
], Quest.prototype, "kingdom", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quest_key' }),
    __metadata("design:type", String)
], Quest.prototype, "questKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Quest.prototype, "period", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Quest.prototype, "progress", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Quest.prototype, "target", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Quest.prototype, "completed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reward_claimed', default: false }),
    __metadata("design:type", Boolean)
], Quest.prototype, "rewardClaimed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'period_date', type: 'date', default: () => 'CURRENT_DATE' }),
    __metadata("design:type", String)
], Quest.prototype, "periodDate", void 0);
exports.Quest = Quest = __decorate([
    (0, typeorm_1.Entity)('quests'),
    (0, typeorm_1.Unique)(['kingdom', 'questKey', 'periodDate'])
], Quest);
//# sourceMappingURL=quest.entity.js.map