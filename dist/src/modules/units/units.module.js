"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const units_controller_1 = require("./units.controller");
const units_service_1 = require("./units.service");
const unit_entity_1 = require("./unit.entity");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const building_entity_1 = require("../building/building.entity");
const kingdom_module_1 = require("../kingdom/kingdom.module");
const quest_module_1 = require("../quest/quest.module");
const audit_module_1 = require("../audit/audit.module");
let UnitsModule = class UnitsModule {
};
exports.UnitsModule = UnitsModule;
exports.UnitsModule = UnitsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([unit_entity_1.Unit, kingdom_entity_1.Kingdom, building_entity_1.Building]), kingdom_module_1.KingdomModule, quest_module_1.QuestModule, audit_module_1.AuditModule],
        controllers: [units_controller_1.UnitsController],
        providers: [units_service_1.UnitsService],
    })
], UnitsModule);
//# sourceMappingURL=units.module.js.map