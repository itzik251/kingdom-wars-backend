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
exports.Unit = exports.HERO_SALARY_GEMS = exports.HERO_TYPES = exports.UnitType = void 0;
const typeorm_1 = require("typeorm");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
var UnitType;
(function (UnitType) {
    UnitType["SPEARMAN"] = "spearman";
    UnitType["ARCHER"] = "archer";
    UnitType["SWORDSMAN"] = "swordsman";
    UnitType["CAVALRY"] = "cavalry";
    UnitType["CATAPULT"] = "catapult";
    UnitType["ELITE_GUARD"] = "elite_guard";
    UnitType["KNIGHT"] = "knight";
    UnitType["PALADIN"] = "paladin";
    UnitType["DRAGON_RIDER"] = "dragon_rider";
    UnitType["RAGNAR"] = "ragnar";
    UnitType["TITAN"] = "titan";
    UnitType["GIANT"] = "giant";
})(UnitType || (exports.UnitType = UnitType = {}));
exports.HERO_TYPES = new Set([
    UnitType.KNIGHT,
    UnitType.PALADIN,
    UnitType.DRAGON_RIDER,
    UnitType.RAGNAR,
    UnitType.TITAN,
    UnitType.GIANT,
]);
exports.HERO_SALARY_GEMS = {
    [UnitType.KNIGHT]: 1,
    [UnitType.PALADIN]: 3,
    [UnitType.DRAGON_RIDER]: 5,
    [UnitType.RAGNAR]: 2,
    [UnitType.TITAN]: 0,
    [UnitType.GIANT]: 10,
};
let Unit = class Unit {
};
exports.Unit = Unit;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Unit.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => kingdom_entity_1.Kingdom),
    (0, typeorm_1.JoinColumn)({ name: 'kingdom_id' }),
    __metadata("design:type", kingdom_entity_1.Kingdom)
], Unit.prototype, "kingdom", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Unit.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Unit.prototype, "count", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'training_count', default: 0 }),
    __metadata("design:type", Number)
], Unit.prototype, "trainingCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'training_ends_at', nullable: true }),
    __metadata("design:type", Date)
], Unit.prototype, "trainingEndsAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'wounded_count', default: 0 }),
    __metadata("design:type", Number)
], Unit.prototype, "woundedCount", void 0);
exports.Unit = Unit = __decorate([
    (0, typeorm_1.Entity)('units')
], Unit);
//# sourceMappingURL=unit.entity.js.map