"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExplorationModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const map_node_entity_1 = require("./map-node.entity");
const exploration_mission_entity_1 = require("./exploration-mission.entity");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const building_entity_1 = require("../building/building.entity");
const unit_entity_1 = require("../units/unit.entity");
const exploration_service_1 = require("./exploration.service");
const exploration_controller_1 = require("./exploration.controller");
const kingdom_module_1 = require("../kingdom/kingdom.module");
const notification_module_1 = require("../notifications/notification.module");
let ExplorationModule = class ExplorationModule {
};
exports.ExplorationModule = ExplorationModule;
exports.ExplorationModule = ExplorationModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([map_node_entity_1.MapNode, exploration_mission_entity_1.ExplorationMission, kingdom_entity_1.Kingdom, building_entity_1.Building, unit_entity_1.Unit]), kingdom_module_1.KingdomModule, notification_module_1.NotificationModule],
        providers: [exploration_service_1.ExplorationService],
        controllers: [exploration_controller_1.ExplorationController],
        exports: [exploration_service_1.ExplorationService],
    })
], ExplorationModule);
//# sourceMappingURL=exploration.module.js.map