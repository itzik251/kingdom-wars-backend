"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombatModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const combat_controller_1 = require("./combat.controller");
const combat_service_1 = require("./combat.service");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const unit_entity_1 = require("../units/unit.entity");
const building_entity_1 = require("../building/building.entity");
const user_entity_1 = require("../user/user.entity");
const economy_module_1 = require("../economy/economy.module");
const kingdom_module_1 = require("../kingdom/kingdom.module");
const notification_module_1 = require("../notifications/notification.module");
const quest_module_1 = require("../quest/quest.module");
let CombatModule = class CombatModule {
};
exports.CombatModule = CombatModule;
exports.CombatModule = CombatModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([kingdom_entity_1.Kingdom, unit_entity_1.Unit, building_entity_1.Building, user_entity_1.User]), economy_module_1.EconomyModule, kingdom_module_1.KingdomModule, notification_module_1.NotificationModule, quest_module_1.QuestModule],
        controllers: [combat_controller_1.CombatController],
        providers: [combat_service_1.CombatService],
    })
], CombatModule);
//# sourceMappingURL=combat.module.js.map