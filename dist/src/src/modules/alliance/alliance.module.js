"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllianceModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const alliance_controller_1 = require("./alliance.controller");
const alliance_service_1 = require("./alliance.service");
const alliance_entity_1 = require("./alliance.entity");
const alliance_member_entity_1 = require("./alliance-member.entity");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const kingdom_module_1 = require("../kingdom/kingdom.module");
let AllianceModule = class AllianceModule {
};
exports.AllianceModule = AllianceModule;
exports.AllianceModule = AllianceModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([alliance_entity_1.Alliance, alliance_member_entity_1.AllianceMember, kingdom_entity_1.Kingdom]), kingdom_module_1.KingdomModule],
        controllers: [alliance_controller_1.AllianceController],
        providers: [alliance_service_1.AllianceService],
    })
], AllianceModule);
//# sourceMappingURL=alliance.module.js.map