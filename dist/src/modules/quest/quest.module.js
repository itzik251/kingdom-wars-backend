"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const quest_controller_1 = require("./quest.controller");
const quest_service_1 = require("./quest.service");
const quest_entity_1 = require("./quest.entity");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const kingdom_module_1 = require("../kingdom/kingdom.module");
const economy_module_1 = require("../economy/economy.module");
let QuestModule = class QuestModule {
};
exports.QuestModule = QuestModule;
exports.QuestModule = QuestModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([quest_entity_1.Quest, kingdom_entity_1.Kingdom]), kingdom_module_1.KingdomModule, economy_module_1.EconomyModule],
        controllers: [quest_controller_1.QuestController],
        providers: [quest_service_1.QuestService],
        exports: [quest_service_1.QuestService],
    })
], QuestModule);
//# sourceMappingURL=quest.module.js.map