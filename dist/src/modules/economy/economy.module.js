"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EconomyModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const economy_service_1 = require("./economy.service");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const building_entity_1 = require("../building/building.entity");
const unit_entity_1 = require("../units/unit.entity");
const user_entity_1 = require("../user/user.entity");
const notification_entity_1 = require("../notifications/notification.entity");
const alliance_member_entity_1 = require("../alliance/alliance-member.entity");
const notification_module_1 = require("../notifications/notification.module");
let EconomyModule = class EconomyModule {
};
exports.EconomyModule = EconomyModule;
exports.EconomyModule = EconomyModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([kingdom_entity_1.Kingdom, building_entity_1.Building, unit_entity_1.Unit, user_entity_1.User, notification_entity_1.Notification, alliance_member_entity_1.AllianceMember]), (0, common_1.forwardRef)(() => notification_module_1.NotificationModule)],
        providers: [economy_service_1.EconomyService],
        exports: [economy_service_1.EconomyService],
    })
], EconomyModule);
//# sourceMappingURL=economy.module.js.map