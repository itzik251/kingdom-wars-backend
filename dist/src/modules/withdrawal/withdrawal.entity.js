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
exports.Withdrawal = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../user/user.entity");
let Withdrawal = class Withdrawal {
};
exports.Withdrawal = Withdrawal;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Withdrawal.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Withdrawal.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], Withdrawal.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], Withdrawal.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'wallet_address' }),
    __metadata("design:type", String)
], Withdrawal.prototype, "walletAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'pending' }),
    __metadata("design:type", String)
], Withdrawal.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tx_id', nullable: true }),
    __metadata("design:type", String)
], Withdrawal.prototype, "txId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reject_reason', nullable: true }),
    __metadata("design:type", String)
], Withdrawal.prototype, "rejectReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'admin_note', nullable: true }),
    __metadata("design:type", String)
], Withdrawal.prototype, "adminNote", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Withdrawal.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Withdrawal.prototype, "updatedAt", void 0);
exports.Withdrawal = Withdrawal = __decorate([
    (0, typeorm_1.Entity)('withdrawals')
], Withdrawal);
//# sourceMappingURL=withdrawal.entity.js.map