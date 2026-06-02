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
exports.Kingdom = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../user/user.entity");
let Kingdom = class Kingdom {
    get isShielded() {
        return this.shieldUntil && new Date() < new Date(this.shieldUntil);
    }
};
exports.Kingdom = Kingdom;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Kingdom.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Kingdom.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'My Kingdom' }),
    __metadata("design:type", String)
], Kingdom.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 500 }),
    __metadata("design:type", Number)
], Kingdom.prototype, "gold", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 300 }),
    __metadata("design:type", Number)
], Kingdom.prototype, "wood", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 200 }),
    __metadata("design:type", Number)
], Kingdom.prototype, "stone", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 100 }),
    __metadata("design:type", Number)
], Kingdom.prototype, "food", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 50 }),
    __metadata("design:type", Number)
], Kingdom.prototype, "gems", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_gold', default: 5000 }),
    __metadata("design:type", Number)
], Kingdom.prototype, "maxGold", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_wood', default: 4000 }),
    __metadata("design:type", Number)
], Kingdom.prototype, "maxWood", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_stone', default: 3000 }),
    __metadata("design:type", Number)
], Kingdom.prototype, "maxStone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_food', default: 2000 }),
    __metadata("design:type", Number)
], Kingdom.prototype, "maxFood", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'shield_until', nullable: true }),
    __metadata("design:type", Date)
], Kingdom.prototype, "shieldUntil", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Kingdom.prototype, "score", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'win_streak', default: 0 }),
    __metadata("design:type", Number)
], Kingdom.prototype, "winStreak", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_resource_tick', nullable: true }),
    __metadata("design:type", Date)
], Kingdom.prototype, "lastResourceTick", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'production_boost_until', nullable: true }),
    __metadata("design:type", Date)
], Kingdom.prototype, "productionBoostUntil", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Kingdom.prototype, "createdAt", void 0);
exports.Kingdom = Kingdom = __decorate([
    (0, typeorm_1.Entity)('kingdoms')
], Kingdom);
//# sourceMappingURL=kingdom.entity.js.map