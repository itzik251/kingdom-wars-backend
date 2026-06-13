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
exports.Alliance = void 0;
const typeorm_1 = require("typeorm");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
let Alliance = class Alliance {
};
exports.Alliance = Alliance;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Alliance.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Alliance.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 6 }),
    __metadata("design:type", String)
], Alliance.prototype, "tag", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Alliance.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => kingdom_entity_1.Kingdom),
    (0, typeorm_1.JoinColumn)({ name: 'leader_id' }),
    __metadata("design:type", kingdom_entity_1.Kingdom)
], Alliance.prototype, "leader", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], Alliance.prototype, "score", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_members', type: 'smallint', default: 50 }),
    __metadata("design:type", Number)
], Alliance.prototype, "maxMembers", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Alliance.prototype, "createdAt", void 0);
exports.Alliance = Alliance = __decorate([
    (0, typeorm_1.Entity)('alliances')
], Alliance);
//# sourceMappingURL=alliance.entity.js.map