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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramController = void 0;
const common_1 = require("@nestjs/common");
const telegram_service_1 = require("./telegram.service");
let TelegramController = class TelegramController {
    constructor(telegramService) {
        this.telegramService = telegramService;
    }
    handleWebhook(update) {
        this.telegramService.handleUpdate(update).catch(() => { });
        return { ok: true };
    }
    setWebhook(url) {
        return this.telegramService.setWebhook(url);
    }
    deleteWebhook() {
        return this.telegramService.deleteWebhook();
    }
    setCommands() {
        return this.telegramService.setMyCommands();
    }
    debugInfo() {
        return this.telegramService.getDebugInfo();
    }
};
exports.TelegramController = TelegramController;
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TelegramController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Get)('set-webhook'),
    __param(0, (0, common_1.Query)('url')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TelegramController.prototype, "setWebhook", null);
__decorate([
    (0, common_1.Get)('delete-webhook'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TelegramController.prototype, "deleteWebhook", null);
__decorate([
    (0, common_1.Get)('set-commands'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TelegramController.prototype, "setCommands", null);
__decorate([
    (0, common_1.Get)('debug'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TelegramController.prototype, "debugInfo", null);
exports.TelegramController = TelegramController = __decorate([
    (0, common_1.Controller)('telegram'),
    __metadata("design:paramtypes", [telegram_service_1.TelegramService])
], TelegramController);
//# sourceMappingURL=telegram.controller.js.map