"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VipModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const vip_controller_1 = require("./vip.controller");
const vip_service_1 = require("./vip.service");
const user_entity_1 = require("../user/user.entity");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const ton_module_1 = require("../ton/ton.module");
let VipModule = class VipModule {
};
exports.VipModule = VipModule;
exports.VipModule = VipModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, kingdom_entity_1.Kingdom]), ton_module_1.TonModule],
        controllers: [vip_controller_1.VipController],
        providers: [vip_service_1.VipService],
        exports: [vip_service_1.VipService],
    })
], VipModule);
//# sourceMappingURL=vip.module.js.map