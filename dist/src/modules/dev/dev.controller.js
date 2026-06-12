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
exports.DevController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const user_entity_1 = require("../user/user.entity");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const building_entity_1 = require("../building/building.entity");
const unit_entity_1 = require("../units/unit.entity");
const game_constants_1 = require("../../constants/game.constants");
const DEV_USERS = [
    { id: 100000001, username: 'dev_alice', firstName: 'Alice' },
    { id: 100000002, username: 'dev_bob', firstName: 'Bob' },
    { id: 100000003, username: 'dev_charlie', firstName: 'Charlie' },
    { id: 100000004, username: 'dev_diana', firstName: 'Diana' },
    { id: 100000005, username: 'dev_eve', firstName: 'Eve' },
    { id: 100000006, username: 'dev_frank', firstName: 'Frank' },
    { id: 100000007, username: 'dev_grace', firstName: 'Grace' },
    { id: 100000008, username: 'dev_henry', firstName: 'Henry' },
    { id: 100000009, username: 'dev_iris', firstName: 'Iris' },
    { id: 100000010, username: 'dev_jack', firstName: 'Jack' },
    { id: 100000011, username: 'dev_kate', firstName: 'Kate' },
];
let DevController = class DevController {
    constructor(config, userRepo, kingdomRepo, buildingRepo, unitRepo) {
        this.config = config;
        this.userRepo = userRepo;
        this.kingdomRepo = kingdomRepo;
        this.buildingRepo = buildingRepo;
        this.unitRepo = unitRepo;
    }
    guard() {
        if (this.config.get('NODE_ENV') === 'production') {
            throw new common_1.ForbiddenException('Dev endpoints are disabled in production');
        }
    }
    status() {
        this.guard();
        return { dev: true, users: DEV_USERS.map(u => u.firstName) };
    }
    async seed() {
        this.guard();
        const results = [];
        for (const tgUser of DEV_USERS) {
            const telegramId = String(tgUser.id);
            let user = await this.userRepo.findOne({ where: { telegramId } });
            const isNew = !user;
            if (!user) {
                user = this.userRepo.create({
                    telegramId,
                    username: tgUser.username,
                    firstName: tgUser.firstName,
                    language: 'he',
                    referralCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
                    lastLogin: new Date(),
                    termsAcceptedAt: new Date(),
                });
                await this.userRepo.save(user);
            }
            let kingdom = await this.kingdomRepo.findOne({ where: { user: { id: user.id } } });
            if (!kingdom) {
                kingdom = this.kingdomRepo.create({
                    user,
                    name: `${tgUser.firstName}'s Kingdom`,
                    shieldUntil: null,
                    gold: 50000,
                    wood: 30000,
                    stone: 20000,
                    food: 10000,
                    gems: 500,
                    score: 100,
                });
                await this.kingdomRepo.save(kingdom);
                await this.buildingRepo.save(game_constants_1.INITIAL_BUILDINGS.map(type => this.buildingRepo.create({ kingdom, type, level: type === building_entity_1.BuildingType.BARRACKS ? 3 : 2 })));
                const unitCounts = {
                    [unit_entity_1.UnitType.SPEARMAN]: 100,
                    [unit_entity_1.UnitType.ARCHER]: 80,
                    [unit_entity_1.UnitType.SWORDSMAN]: 50,
                    [unit_entity_1.UnitType.CAVALRY]: 30,
                    [unit_entity_1.UnitType.CATAPULT]: 10,
                };
                await this.unitRepo.save(game_constants_1.INITIAL_UNITS.map(type => this.unitRepo.create({ kingdom, type, count: unitCounts[type] ?? 0 })));
                results.push(`✅ ${tgUser.firstName}: נוצר`);
            }
            else {
                kingdom.shieldUntil = null;
                kingdom.gold = Math.max(kingdom.gold, 50000);
                kingdom.wood = Math.max(kingdom.wood, 30000);
                kingdom.stone = Math.max(kingdom.stone, 20000);
                kingdom.food = Math.max(kingdom.food, 10000);
                kingdom.gems = Math.max(kingdom.gems, 500);
                kingdom.score = Math.max(kingdom.score, 100);
                await this.kingdomRepo.save(kingdom);
                const units = await this.unitRepo.find({ where: { kingdom: { id: kingdom.id } } });
                const boosts = {
                    spearman: 100, archer: 80, swordsman: 50, cavalry: 30, catapult: 10,
                };
                for (const unit of units) {
                    const boost = boosts[unit.type];
                    if (boost)
                        unit.count = Math.max(unit.count, boost);
                }
                await this.unitRepo.save(units);
                results.push(`🔄 ${tgUser.firstName}: ${isNew ? 'נוצר' : 'עודכן'}`);
            }
        }
        return { ok: true, results };
    }
    async boost(userIdx) {
        this.guard();
        const idx = parseInt(userIdx, 10) || 1;
        const tgUser = DEV_USERS[idx - 1];
        if (!tgUser)
            return { ok: false, error: 'invalid idx' };
        const user = await this.userRepo.findOne({ where: { telegramId: String(tgUser.id) } });
        if (!user)
            return { ok: false, error: 'user not found — run /seed first' };
        user.referralClaimedCount = 10;
        user.claimedReferralMilestones = [1, 3, 5, 10];
        await this.userRepo.save(user);
        const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: user.id } } });
        if (!kingdom)
            return { ok: false, error: 'kingdom not found' };
        kingdom.vipExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        kingdom.gold = 999999;
        kingdom.wood = 999999;
        kingdom.stone = 999999;
        kingdom.food = 99999;
        kingdom.gems = 9999;
        kingdom.score = 5000;
        kingdom.shieldUntil = null;
        await this.kingdomRepo.save(kingdom);
        const units = await this.unitRepo.find({ where: { kingdom: { id: kingdom.id } } });
        const heroBoosts = {
            knight: 1, paladin: 1, dragon_rider: 1, ragnar: 1, titan: 1,
            spearman: 200, archer: 150, swordsman: 100, cavalry: 60, catapult: 20, elite_guard: 10,
        };
        for (const unit of units) {
            const boost = heroBoosts[unit.type];
            if (boost !== undefined)
                unit.count = boost;
        }
        await this.unitRepo.save(units);
        const otherUsers = DEV_USERS.filter(u => u.id !== tgUser.id);
        for (const other of otherUsers) {
            const otherUser = await this.userRepo.findOne({ where: { telegramId: String(other.id) } });
            if (otherUser && !otherUser.referredBy) {
                otherUser.referredBy = user;
                await this.userRepo.save(otherUser);
            }
        }
        return { ok: true, message: `${tgUser.firstName} boosted: VIP 30d, all heroes, 10 referrals, max resources` };
    }
};
exports.DevController = DevController;
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DevController.prototype, "status", null);
__decorate([
    (0, common_1.Post)('seed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DevController.prototype, "seed", null);
__decorate([
    (0, common_1.Post)('boost/:userIdx'),
    __param(0, (0, common_1.Param)('userIdx')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DevController.prototype, "boost", null);
exports.DevController = DevController = __decorate([
    (0, common_1.Controller)('dev'),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(kingdom_entity_1.Kingdom)),
    __param(3, (0, typeorm_1.InjectRepository)(building_entity_1.Building)),
    __param(4, (0, typeorm_1.InjectRepository)(unit_entity_1.Unit)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DevController);
//# sourceMappingURL=dev.controller.js.map