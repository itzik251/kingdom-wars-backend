"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoBotFullModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const cryptobot_service_1 = require("./cryptobot.service");
const cryptobot_controller_1 = require("./cryptobot.controller");
const vip_module_1 = require("../vip/vip.module");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
let CryptoBotFullModule = class CryptoBotFullModule {
};
exports.CryptoBotFullModule = CryptoBotFullModule;
exports.CryptoBotFullModule = CryptoBotFullModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([kingdom_entity_1.Kingdom]), vip_module_1.VipModule],
        providers: [cryptobot_service_1.CryptoBotService],
        controllers: [cryptobot_controller_1.CryptoBotController],
        exports: [cryptobot_service_1.CryptoBotService],
    })
], CryptoBotFullModule);
//# sourceMappingURL=cryptobot.full.module.js.map