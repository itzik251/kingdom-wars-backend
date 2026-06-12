"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KingdomModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const kingdom_controller_1 = require("./kingdom.controller");
const kingdom_service_1 = require("./kingdom.service");
const kingdom_entity_1 = require("./kingdom.entity");
const building_entity_1 = require("../building/building.entity");
const unit_entity_1 = require("../units/unit.entity");
const user_entity_1 = require("../user/user.entity");
const economy_module_1 = require("../economy/economy.module");
const notification_module_1 = require("../notifications/notification.module");
let KingdomModule = class KingdomModule {
};
exports.KingdomModule = KingdomModule;
exports.KingdomModule = KingdomModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([kingdom_entity_1.Kingdom, building_entity_1.Building, unit_entity_1.Unit, user_entity_1.User]), economy_module_1.EconomyModule, notification_module_1.NotificationModule],
        controllers: [kingdom_controller_1.KingdomController],
        providers: [kingdom_service_1.KingdomService],
        exports: [kingdom_service_1.KingdomService],
    })
], KingdomModule);
//# sourceMappingURL=kingdom.module.js.map