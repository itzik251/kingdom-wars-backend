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
exports.ExplorationMission = exports.MissionStatus = void 0;
const typeorm_1 = require("typeorm");
var MissionStatus;
(function (MissionStatus) {
    MissionStatus["ACTIVE"] = "active";
    MissionStatus["RETURNED"] = "returned";
})(MissionStatus || (exports.MissionStatus = MissionStatus = {}));
let ExplorationMission = class ExplorationMission {
};
exports.ExplorationMission = ExplorationMission;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ExplorationMission.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'kingdom_id' }),
    __metadata("design:type", String)
], ExplorationMission.prototype, "kingdomId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_x' }),
    __metadata("design:type", Number)
], ExplorationMission.prototype, "targetX", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_y' }),
    __metadata("design:type", Number)
], ExplorationMission.prototype, "targetY", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], ExplorationMission.prototype, "distance", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'started_at' }),
    __metadata("design:type", Date)
], ExplorationMission.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'returns_at' }),
    __metadata("design:type", Date)
], ExplorationMission.prototype, "returnsAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', default: MissionStatus.ACTIVE }),
    __metadata("design:type", String)
], ExplorationMission.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'discovered_node_ids', type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], ExplorationMission.prototype, "discoveredNodeIds", void 0);
exports.ExplorationMission = ExplorationMission = __decorate([
    (0, typeorm_1.Entity)('exploration_missions')
], ExplorationMission);
//# sourceMappingURL=exploration-mission.entity.js.map