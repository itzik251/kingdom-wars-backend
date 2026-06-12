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
exports.AllianceMember = exports.AllianceRole = void 0;
const typeorm_1 = require("typeorm");
const alliance_entity_1 = require("./alliance.entity");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
var AllianceRole;
(function (AllianceRole) {
    AllianceRole["LEADER"] = "leader";
    AllianceRole["OFFICER"] = "officer";
    AllianceRole["MEMBER"] = "member";
})(AllianceRole || (exports.AllianceRole = AllianceRole = {}));
let AllianceMember = class AllianceMember {
};
exports.AllianceMember = AllianceMember;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'alliance_id' }),
    __metadata("design:type", String)
], AllianceMember.prototype, "allianceId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'kingdom_id' }),
    __metadata("design:type", String)
], AllianceMember.prototype, "kingdomId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => alliance_entity_1.Alliance),
    (0, typeorm_1.JoinColumn)({ name: 'alliance_id' }),
    __metadata("design:type", alliance_entity_1.Alliance)
], AllianceMember.prototype, "alliance", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => kingdom_entity_1.Kingdom),
    (0, typeorm_1.JoinColumn)({ name: 'kingdom_id' }),
    __metadata("design:type", kingdom_entity_1.Kingdom)
], AllianceMember.prototype, "kingdom", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', default: AllianceRole.MEMBER }),
    __metadata("design:type", String)
], AllianceMember.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'joined_at' }),
    __metadata("design:type", Date)
], AllianceMember.prototype, "joinedAt", void 0);
exports.AllianceMember = AllianceMember = __decorate([
    (0, typeorm_1.Entity)('alliance_members')
], AllianceMember);
//# sourceMappingURL=alliance-member.entity.js.map