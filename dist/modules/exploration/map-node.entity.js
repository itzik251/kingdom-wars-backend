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
exports.MapNode = exports.RareResourceType = exports.MapNodeType = void 0;
const typeorm_1 = require("typeorm");
var MapNodeType;
(function (MapNodeType) {
    MapNodeType["RESOURCE"] = "resource";
    MapNodeType["RARE_RESOURCE"] = "rare_resource";
    MapNodeType["HERO"] = "hero";
})(MapNodeType || (exports.MapNodeType = MapNodeType = {}));
var RareResourceType;
(function (RareResourceType) {
    RareResourceType["MAGIC"] = "magic";
})(RareResourceType || (exports.RareResourceType = RareResourceType = {}));
let MapNode = class MapNode {
};
exports.MapNode = MapNode;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MapNode.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'kingdom_id', nullable: true }),
    __metadata("design:type", String)
], MapNode.prototype, "kingdomId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], MapNode.prototype, "x", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], MapNode.prototype, "y", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], MapNode.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resource_type', nullable: true }),
    __metadata("design:type", String)
], MapNode.prototype, "resourceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], MapNode.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hero_type', nullable: true }),
    __metadata("design:type", String)
], MapNode.prototype, "heroType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'discovered', default: false }),
    __metadata("design:type", Boolean)
], MapNode.prototype, "discovered", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'discovered_at', nullable: true }),
    __metadata("design:type", Date)
], MapNode.prototype, "discoveredAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_raided_at', nullable: true }),
    __metadata("design:type", Date)
], MapNode.prototype, "lastRaidedAt", void 0);
exports.MapNode = MapNode = __decorate([
    (0, typeorm_1.Entity)('map_nodes')
], MapNode);
//# sourceMappingURL=map-node.entity.js.map