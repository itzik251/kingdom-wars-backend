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
exports.BattleLog = void 0;
const typeorm_1 = require("typeorm");
let BattleLog = class BattleLog {};
exports.BattleLog = BattleLog;
__decorate([(0, typeorm_1.PrimaryGeneratedColumn)('uuid'), __metadata("design:type", String)], BattleLog.prototype, "id", void 0);
__decorate([(0, typeorm_1.Column)({ name: 'attacker_kingdom_id' }), __metadata("design:type", String)], BattleLog.prototype, "attackerKingdomId", void 0);
__decorate([(0, typeorm_1.Column)({ name: 'defender_kingdom_id' }), __metadata("design:type", String)], BattleLog.prototype, "defenderKingdomId", void 0);
__decorate([(0, typeorm_1.Column)({ name: 'attacker_name', nullable: true }), __metadata("design:type", String)], BattleLog.prototype, "attackerName", void 0);
__decorate([(0, typeorm_1.Column)({ name: 'defender_name', nullable: true }), __metadata("design:type", String)], BattleLog.prototype, "defenderName", void 0);
__decorate([(0, typeorm_1.Column)({ name: 'attacker_wins' }), __metadata("design:type", Boolean)], BattleLog.prototype, "attackerWins", void 0);
__decorate([(0, typeorm_1.Column)({ type: 'simple-json', nullable: true }), __metadata("design:type", Object)], BattleLog.prototype, "loot", void 0);
__decorate([(0, typeorm_1.Column)({ name: 'attacker_power', nullable: true }), __metadata("design:type", Number)], BattleLog.prototype, "attackerPower", void 0);
__decorate([(0, typeorm_1.Column)({ name: 'defender_power', nullable: true }), __metadata("design:type", Number)], BattleLog.prototype, "defenderPower", void 0);
__decorate([(0, typeorm_1.CreateDateColumn)({ name: 'created_at' }), __metadata("design:type", Date)], BattleLog.prototype, "createdAt", void 0);
exports.BattleLog = BattleLog = __decorate([(0, typeorm_1.Entity)('battle_logs')], BattleLog);
