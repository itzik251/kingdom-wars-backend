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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto = require("crypto");
const config_1 = require("@nestjs/config");
const user_entity_1 = require("../user/user.entity");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const building_entity_1 = require("../building/building.entity");
const unit_entity_1 = require("../units/unit.entity");
const game_constants_1 = require("../../constants/game.constants");
let AuthService = class AuthService {
    constructor(jwtService, config, userRepo, kingdomRepo, buildingRepo, unitRepo) {
        this.jwtService = jwtService;
        this.config = config;
        this.userRepo = userRepo;
        this.kingdomRepo = kingdomRepo;
        this.buildingRepo = buildingRepo;
        this.unitRepo = unitRepo;
    }
    validateTelegramData(initData) {
        if (this.config.get('NODE_ENV') !== 'production' && initData === 'dev') {
            return {
                user: JSON.stringify({ id: 123456789, username: 'dev_user', first_name: 'Dev' }),
                auth_date: String(Math.floor(Date.now() / 1000)),
            };
        }
        const pairs = initData.split('&').map(p => {
            const eq = p.indexOf('=');
            return { key: decodeURIComponent(p.slice(0, eq)), value: decodeURIComponent(p.slice(eq + 1)) };
        });
        const hash = pairs.find(p => p.key === 'hash')?.value;
        if (!hash)
            throw new common_1.UnauthorizedException('Missing hash');
        const dataCheckString = pairs
            .filter(p => p.key !== 'hash')
            .sort((a, b) => a.key.localeCompare(b.key))
            .map(p => `${p.key}=${p.value}`)
            .join('\n');
        const botToken = this.config.get('TELEGRAM_BOT_TOKEN');
        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
        const calculatedHash = crypto
            .createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');
        if (calculatedHash !== hash) {
            throw new common_1.UnauthorizedException('Invalid Telegram data signature');
        }
        const params = new URLSearchParams(initData);
        const authDate = parseInt(params.get('auth_date') || '0', 10);
        const now = Math.floor(Date.now() / 1000);
        if (now - authDate > 86400)
            throw new common_1.UnauthorizedException('Telegram data expired');
        return Object.fromEntries(params.entries());
    }
    async loginOrRegister(initData, referralCode) {
        const data = this.validateTelegramData(initData);
        const tgUser = JSON.parse(data.user);
        let user = await this.userRepo.findOne({
            where: { telegramId: String(tgUser.id) },
            relations: ['referredBy'],
        });
        let isNewUser = false;
        if (!user) {
            user = await this.createNewUser(tgUser, referralCode);
            isNewUser = true;
        }
        else {
            user.lastLogin = new Date();
            if (tgUser.language_code)
                user.language = tgUser.language_code.slice(0, 2);
            if (!user.referredBy && referralCode) {
                const referrer = await this.userRepo.findOne({ where: { referralCode } });
                if (referrer && referrer.id !== user.id) {
                    user.referredBy = referrer;
                }
            }
            await this.userRepo.save(user);
        }
        const token = this.jwtService.sign({ sub: user.id, telegramId: user.telegramId });
        return { token, userId: user.id, termsAccepted: !!user.termsAcceptedAt, isNewUser };
    }
    async createNewUser(tgUser, referralCode) {
        let referredBy = null;
        if (referralCode) {
            referredBy = await this.userRepo.findOne({ where: { referralCode } });
        }
        const user = this.userRepo.create({
            telegramId: String(tgUser.id),
            username: tgUser.username,
            firstName: tgUser.first_name,
            language: tgUser.language_code ? tgUser.language_code.slice(0, 2) : 'en',
            referralCode: this.generateReferralCode(),
            referredBy,
            lastLogin: new Date(),
        });
        await this.userRepo.save(user);
        const kingdom = this.kingdomRepo.create({
            user,
            name: `${tgUser.first_name}'s Kingdom`,
            shieldUntil: new Date(Date.now() + 72 * 60 * 60 * 1000),
        });
        await this.kingdomRepo.save(kingdom);
        await this.buildingRepo.save(game_constants_1.INITIAL_BUILDINGS.map((type) => this.buildingRepo.create({ kingdom, type, level: 1 })));
        await this.unitRepo.save(game_constants_1.INITIAL_UNITS.map((type) => this.unitRepo.create({ kingdom, type, count: 0 })));
        return user;
    }
    async acceptTerms(userId) {
        await this.userRepo.update({ id: userId }, { termsAcceptedAt: new Date() });
        return { accepted: true };
    }
    async setLanguage(userId, language) {
        const VALID_LANGS = ['en', 'he', 'es', 'fr', 'de', 'ru', 'pt', 'ar'];
        const lang = VALID_LANGS.includes(language) ? language : 'en';
        await this.userRepo.update({ id: userId }, { language: lang });
        return { language: lang };
    }
    generateReferralCode() {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(kingdom_entity_1.Kingdom)),
    __param(4, (0, typeorm_1.InjectRepository)(building_entity_1.Building)),
    __param(5, (0, typeorm_1.InjectRepository)(unit_entity_1.Unit)),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map