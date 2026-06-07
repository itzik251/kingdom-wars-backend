"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const building_controller_1 = require("./building.controller");
const building_service_1 = require("./building.service");
const building_entity_1 = require("./building.entity");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const kingdom_module_1 = require("../kingdom/kingdom.module");
const quest_module_1 = require("../quest/quest.module");
let BuildingModule = class BuildingModule {
};
exports.BuildingModule = BuildingModule;
exports.BuildingModule = BuildingModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([building_entity_1.Building, kingdom_entity_1.Kingdom]), kingdom_module_1.KingdomModule, quest_module_1.QuestModule],
        controllers: [building_controller_1.BuildingController],
        providers: [building_service_1.BuildingService],
        exports: [building_service_1.BuildingService],
    })
], BuildingModule);
//# sourceMappingURL=building.module.js.map