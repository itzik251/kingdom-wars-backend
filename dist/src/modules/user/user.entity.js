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
exports.User = void 0;
const typeorm_1 = require("typeorm");
let User = class User {
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'telegram_id', type: 'varchar', unique: true }),
    __metadata("design:type", String)
], User.prototype, "telegramId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'first_name', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avatar_url', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "avatarUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'referral_code', unique: true }),
    __metadata("design:type", String)
], User.prototype, "referralCode", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'referred_by' }),
    __metadata("design:type", User)
], User.prototype, "referredBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_login', nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "lastLogin", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'en' }),
    __metadata("design:type", String)
], User.prototype, "language", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'terms_accepted_at', nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "termsAcceptedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'claimed_referral_milestones', type: 'simple-array', default: '' }),
    __metadata("design:type", Array)
], User.prototype, "claimedReferralMilestones", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'referral_claimed_count', default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "referralClaimedCount", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=user.entity.js.map