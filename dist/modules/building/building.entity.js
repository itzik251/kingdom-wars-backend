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
exports.Building = exports.BuildingType = void 0;
const typeorm_1 = require("typeorm");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
var BuildingType;
(function (BuildingType) {
    BuildingType["TOWN_HALL"] = "town_hall";
    BuildingType["GOLD_MINE"] = "gold_mine";
    BuildingType["LUMBER_MILL"] = "lumber_mill";
    BuildingType["STONE_QUARRY"] = "stone_quarry";
    BuildingType["FARM"] = "farm";
    BuildingType["BARRACKS"] = "barracks";
    BuildingType["ACADEMY"] = "academy";
    BuildingType["WALL"] = "wall";
    BuildingType["WATCH_TOWER"] = "watch_tower";
    BuildingType["HOSPITAL"] = "hospital";
    BuildingType["ARCANE_TOWER"] = "arcane_tower";
})(BuildingType || (exports.BuildingType = BuildingType = {}));
let Building = class Building {
    get isUpgrading() {
        return this.upgradeEndsAt && new Date() < new Date(this.upgradeEndsAt);
    }
};
exports.Building = Building;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Building.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => kingdom_entity_1.Kingdom),
    (0, typeorm_1.JoinColumn)({ name: 'kingdom_id' }),
    __metadata("design:type", kingdom_entity_1.Kingdom)
], Building.prototype, "kingdom", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Building.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 1 }),
    __metadata("design:type", Number)
], Building.prototype, "level", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Building.prototype, "slot", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'upgrade_ends_at', nullable: true }),
    __metadata("design:type", Date)
], Building.prototype, "upgradeEndsAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Building.prototype, "createdAt", void 0);
exports.Building = Building = __decorate([
    (0, typeorm_1.Entity)('buildings')
], Building);
//# sourceMappingURL=building.entity.js.map