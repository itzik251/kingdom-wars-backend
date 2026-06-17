"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AntiBotGuard = exports.AntiBotAction = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const antibot_service_1 = require("./antibot.service");
const AntiBotAction = (action) => (0, common_1.SetMetadata)('antiBotAction', action);
exports.AntiBotAction = AntiBotAction;
let AntiBotGuard = class AntiBotGuard {
    constructor(antiBotService, reflector) {
        this.antiBotService = antiBotService;
        this.reflector = reflector;
    }
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const userId = req.user?.userId;
        if (!userId)
            return true;
        const action = this.reflector.get('antiBotAction', context.getHandler())
            ?? this.reflector.get('antiBotAction', context.getClass())
            ?? 'default';
        const ip = req.ip || req.connection?.remoteAddress || '';
        const result = this.antiBotService.check(userId, action, ip);
        if (!result.allowed) {
            const headers = {};
            if (result.retryAfter)
                headers['Retry-After'] = String(result.retryAfter);
            throw new common_1.HttpException({
                statusCode: result.reason === 'BANNED' ? 403 : 429,
                message: result.reason === 'BANNED'
                    ? 'נחסמת עקב פעילות חשודה. פנה לתמיכה אם זו טעות.'
                    : 'יותר מדי בקשות. אנא המתן.',
                reason: result.reason,
                retryAfter: result.retryAfter,
            }, result.reason === 'BANNED' ? common_1.HttpStatus.FORBIDDEN : common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        return true;
    }
};
exports.AntiBotGuard = AntiBotGuard;
exports.AntiBotGuard = AntiBotGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [antibot_service_1.AntiBotService,
        core_1.Reflector])
], AntiBotGuard);
//# sourceMappingURL=antibot.guard.js.map