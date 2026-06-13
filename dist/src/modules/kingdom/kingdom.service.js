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
exports.KingdomService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const kingdom_entity_1 = require("./kingdom.entity");
const building_entity_1 = require("../building/building.entity");
const unit_entity_1 = require("../units/unit.entity");
const user_entity_1 = require("../user/user.entity");
const economy_service_1 = require("../economy/economy.service");
const notification_service_1 = require("../notifications/notification.service");
let KingdomService = class KingdomService {
    constructor(kingdomRepo, buildingRepo, unitRepo, userRepo, economyService, notifService) {
        this.kingdomRepo = kingdomRepo;
        this.buildingRepo = buildingRepo;
        this.unitRepo = unitRepo;
        this.userRepo = userRepo;
        this.economyService = economyService;
        this.notifService = notifService;
    }
    async getKingdomByUser(userId) {
        this.userRepo.findOne({ where: { id: userId } }).then(user => {
            if (!user)
                return;
            const now = new Date();
            const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
            if (!lastLogin || now.getTime() - lastLogin.getTime() > 10 * 60 * 1000) {
                this.userRepo.update({ id: userId }, { lastLogin: now }).catch(() => { });
            }
        }).catch(() => { });
        const kingdom = await this.kingdomRepo.findOne({
            where: { user: { id: userId } },
        });
        if (!kingdom)
            throw new common_1.NotFoundException('Kingdom not found');
        const updated = await this.economyService.tickKingdom(kingdom.id);
        const tickBuildings = updated.__completedBuildings || [];
        const tickUnits = updated.__completedUnits || [];
        const [buildings, units] = await Promise.all([
            this.buildingRepo.find({ where: { kingdom: { id: kingdom.id } } }),
            this.unitRepo.find({ where: { kingdom: { id: kingdom.id } } }),
        ]);
        const allUnitTypes = Object.values(unit_entity_1.UnitType);
        const existingTypes = new Set(units.map(u => u.type));
        const missingTypes = allUnitTypes.filter(t => !existingTypes.has(t));
        if (missingTypes.length > 0) {
            const newRows = await this.unitRepo.save(missingTypes.map(type => this.unitRepo.create({ kingdom: { id: kingdom.id }, type, count: 0, trainingCount: 0, woundedCount: 0 })));
            units.push(...newRows);
        }
        const now = new Date();
        if (updated.shieldUntil &&
            new Date(updated.shieldUntil) <= now &&
            (!updated.shieldExpiredNotifiedAt ||
                new Date(updated.shieldExpiredNotifiedAt) < new Date(updated.shieldUntil))) {
            updated.shieldExpiredNotifiedAt = new Date(updated.shieldUntil);
            await this.kingdomRepo.save(updated);
            const shieldPayload = await this.getUserPayload(userId);
            this.notifService.create(userId, 'shield_expired', shieldPayload).catch(() => { });
        }
        const productionRates = this.economyService.getProductionRates(buildings, updated);
        return {
            kingdom: updated,
            buildings,
            units,
            productionRates,
            shieldActive: updated.isShielded,
            shieldUntil: updated.shieldUntil,
            isVip: !!updated.isVip,
            workers: updated.workers ?? 0,
            maxWorkers: updated.maxWorkers ?? 5,
        };
    }
    async getUserPayload(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        return { telegramId: user?.telegramId, language: user?.language || 'en' };
    }
    async sendBuildDoneNotifsRaw(userId, buildings) {
        const payload = await this.getUserPayload(userId);
        const grouped = new Map();
        for (const b of buildings) {
            const ex = grouped.get(b.type);
            if (ex)
                ex.count++;
            else
                grouped.set(b.type, { count: 1, level: b.level });
        }
        for (const [type, { count, level }] of grouped) {
            await this.notifService.create(userId, 'build_done', { ...payload, building: type, level, count }).catch(() => { });
        }
    }
    async sendTrainingDoneNotifsRaw(userId, snapshot) {
        const payload = await this.getUserPayload(userId);
        const grouped = new Map();
        for (const s of snapshot)
            grouped.set(s.type, (grouped.get(s.type) ?? 0) + s.count);
        for (const [type, count] of grouped) {
            await this.notifService.create(userId, 'training_done', { ...payload, unit: type, count }).catch(() => { });
        }
    }
    async getUsdtBalance(kingdomId) {
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        return { usdtBalance: kingdom?.usdtBalance ?? 0, gameBalance: kingdom?.gameBalance ?? 0 };
    }
    async requestWithdrawal(kingdomId, walletAddress) {
        const addr = walletAddress?.trim() || '';
        if (!addr || !(/^[UE]Q[A-Za-z0-9_-]{46}$/.test(addr) || /^[0-9a-fA-F]{64}$/.test(addr))) {
            throw new common_1.BadRequestException('כתובת ארנק TON לא תקינה — חייבת להתחיל ב-UQ או EQ');
        }
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        const MIN_WITHDRAW = 20;
        if ((kingdom?.usdtBalance ?? 0) < MIN_WITHDRAW) {
            throw new common_1.BadRequestException(`מינימום ${MIN_WITHDRAW} USDT למשיכה`);
        }
        if (kingdom.withdrawalStatus === 'pending') {
            throw new common_1.BadRequestException('יש כבר בקשת משיכה פעילה — המתן לאישור');
        }
        kingdom.withdrawalWallet = walletAddress.trim();
        kingdom.withdrawalPending = kingdom.usdtBalance;
        kingdom.withdrawalStatus = 'pending';
        await this.kingdomRepo.save(kingdom);
        return { success: true, amount: kingdom.withdrawalPending, wallet: kingdom.withdrawalWallet, status: 'pending' };
    }
    async getWithdrawalStatus(kingdomId) {
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        return {
            usdtBalance: kingdom?.usdtBalance ?? 0,
            withdrawalPending: kingdom?.withdrawalPending ?? 0,
            withdrawalStatus: kingdom?.withdrawalStatus ?? 'none',
            withdrawalWallet: kingdom?.withdrawalWallet ?? '',
        };
    }
    async withdrawUsdt(kingdomId) {
        throw new common_1.BadRequestException('השתמש ב-request-withdrawal עם כתובת ארנק');
    }
    async buyShield(kingdomId) {
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        const SHIELD_COST = 50;
        if (kingdom.gems < SHIELD_COST)
            throw new common_1.BadRequestException('Need 50 gems');
        kingdom.gems -= SHIELD_COST;
        kingdom.shieldUntil = new Date(Date.now() + 24 * 3600 * 1000);
        kingdom.shieldExpiredNotifiedAt = null;
        await this.kingdomRepo.save(kingdom);
        return { shieldUntil: kingdom.shieldUntil };
    }
    async hireWorker(kingdomId) {
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        const thBuilding = await this.buildingRepo.findOne({ where: { kingdom: { id: kingdomId }, type: 'town_hall' } });
        const thLevel = thBuilding?.level ?? 1;
        const maxWorkers = 3 + thLevel;
        if ((kingdom.workers || 0) >= maxWorkers)
            throw new common_1.BadRequestException(`MAX_WORKERS:${maxWorkers}`);
        const HIRE_COST = 50;
        if (kingdom.gold < HIRE_COST)
            throw new common_1.BadRequestException('NOT_ENOUGH_GOLD_WORKER');
        await this.kingdomRepo
            .createQueryBuilder()
            .update()
            .set({ workers: () => 'workers + 1', maxWorkers, gold: () => `gold - ${HIRE_COST}` })
            .where('id = :id AND workers < :max AND gold >= :cost', { id: kingdomId, max: maxWorkers, cost: HIRE_COST })
            .execute();
        const updated = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        return { workers: updated.workers, maxWorkers };
    }
    async fireWorker(kingdomId) {
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        if (!kingdom.workers || kingdom.workers <= 0)
            throw new common_1.BadRequestException('NO_WORKERS_TO_FIRE');
        await this.kingdomRepo
            .createQueryBuilder()
            .update()
            .set({ workers: () => 'workers - 1', gold: () => 'gold + 25' })
            .where('id = :id AND workers > 0', { id: kingdomId })
            .execute();
        const updated = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        return { workers: updated.workers };
    }
    async renameKingdom(kingdomId, name) {
        const clean = name.trim().slice(0, 25);
        if (clean.length < 3)
            throw new common_1.BadRequestException('Name too short');
        await this.kingdomRepo.update({ id: kingdomId }, { name: clean });
        return { name: clean };
    }
    async buyTitanHero(kingdomId) {
        const COST = 0.1;
        const TRAINING_TIME = 300;
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        if (!kingdom)
            throw new common_1.BadRequestException('Kingdom not found');
        if ((kingdom.usdtBalance ?? 0) < COST)
            throw new common_1.BadRequestException('נדרש 0.1 USDT לרכישת Titan');
        kingdom.usdtBalance = parseFloat(((kingdom.usdtBalance || 0) - COST).toFixed(6));
        await this.kingdomRepo.save(kingdom);
        let titan = await this.unitRepo.findOne({ where: { kingdom: { id: kingdomId }, type: unit_entity_1.UnitType.TITAN } });
        if (!titan)
            titan = this.unitRepo.create({ kingdom: { id: kingdomId }, type: unit_entity_1.UnitType.TITAN, count: 0, trainingCount: 0, woundedCount: 0 });
        const existingEnd = titan.trainingEndsAt && new Date(titan.trainingEndsAt) > new Date() ? new Date(titan.trainingEndsAt) : new Date();
        titan.trainingCount = (titan.trainingCount || 0) + 1;
        titan.trainingEndsAt = new Date(existingEnd.getTime() + TRAINING_TIME * 1000);
        await this.unitRepo.save(titan);
        return { trainingCount: titan.trainingCount, trainingEndsAt: titan.trainingEndsAt, usdtBalance: kingdom.usdtBalance };
    }
    async buyGiantHero(kingdomId) {
        const COST = 0.5;
        const TRAINING_TIME = 600;
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        if (!kingdom)
            throw new common_1.BadRequestException('Kingdom not found');
        if ((kingdom.usdtBalance ?? 0) < COST)
            throw new common_1.BadRequestException('נדרש 0.5 USDT לרכישת Giant');
        kingdom.usdtBalance = parseFloat(((kingdom.usdtBalance || 0) - COST).toFixed(6));
        await this.kingdomRepo.save(kingdom);
        let giant = await this.unitRepo.findOne({ where: { kingdom: { id: kingdomId }, type: unit_entity_1.UnitType.GIANT } });
        if (!giant)
            giant = this.unitRepo.create({ kingdom: { id: kingdomId }, type: unit_entity_1.UnitType.GIANT, count: 0, trainingCount: 0, woundedCount: 0 });
        const existingEnd = giant.trainingEndsAt && new Date(giant.trainingEndsAt) > new Date() ? new Date(giant.trainingEndsAt) : new Date();
        giant.trainingCount = (giant.trainingCount || 0) + 1;
        giant.trainingEndsAt = new Date(existingEnd.getTime() + TRAINING_TIME * 1000);
        await this.unitRepo.save(giant);
        return { trainingCount: giant.trainingCount, trainingEndsAt: giant.trainingEndsAt, usdtBalance: kingdom.usdtBalance };
    }
    async buyGems(kingdomId, gems) {
        if (!gems || gems < 1 || gems > 10000)
            throw new common_1.BadRequestException('Invalid gems amount');
        const cost = parseFloat((gems / 100).toFixed(6));
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        if (!kingdom)
            throw new common_1.BadRequestException('Kingdom not found');
        if ((kingdom.usdtBalance ?? 0) < cost)
            throw new common_1.BadRequestException(`נדרש $${cost.toFixed(2)} USDT`);
        kingdom.usdtBalance = parseFloat(((kingdom.usdtBalance || 0) - cost).toFixed(6));
        kingdom.gems = (kingdom.gems || 0) + gems;
        await this.kingdomRepo.save(kingdom);
        return { gemsAdded: gems, gems: kingdom.gems, usdtBalance: kingdom.usdtBalance };
    }
    async buildGemForge(kingdomId) {
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        if (!kingdom)
            throw new common_1.BadRequestException('Kingdom not found');
        const existingForges = await this.buildingRepo.count({ where: { kingdom: { id: kingdomId }, type: building_entity_1.BuildingType.GEM_FORGE } });
        if (existingForges >= 3)
            throw new common_1.BadRequestException('Max 3 gem mines');
        const COST = 0.1;
        if ((kingdom.usdtBalance ?? 0) < COST)
            throw new common_1.BadRequestException(`נדרש $${COST} USDT`);
        kingdom.usdtBalance = parseFloat(((kingdom.usdtBalance || 0) - COST).toFixed(6));
        await this.kingdomRepo.save(kingdom);
        const forge = this.buildingRepo.create({
            kingdom: { id: kingdomId },
            type: building_entity_1.BuildingType.GEM_FORGE,
            level: 1,
            slot: existingForges,
        });
        await this.buildingRepo.save(forge);
        return { id: forge.id, level: forge.level, usdtBalance: kingdom.usdtBalance };
    }
    async upgradeGemForge(kingdomId, buildingId) {
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        if (!kingdom)
            throw new common_1.BadRequestException('Kingdom not found');
        const forge = await this.buildingRepo.findOne({ where: { id: buildingId }, relations: ['kingdom'] });
        if (!forge || forge.kingdom?.id !== kingdomId || forge.type !== building_entity_1.BuildingType.GEM_FORGE)
            throw new common_1.BadRequestException('Gem mine not found');
        if (forge.level >= 10)
            throw new common_1.BadRequestException('Max level reached');
        const COST = parseFloat(((forge.level + 1) * 0.1).toFixed(2));
        if ((kingdom.usdtBalance ?? 0) < COST)
            throw new common_1.BadRequestException(`נדרש $${COST} USDT`);
        kingdom.usdtBalance = parseFloat(((kingdom.usdtBalance || 0) - COST).toFixed(6));
        forge.level += 1;
        await this.kingdomRepo.save(kingdom);
        await this.buildingRepo.save(forge);
        return { id: forge.id, newLevel: forge.level, usdtBalance: kingdom.usdtBalance };
    }
    async expandStorage(kingdomId) {
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        const COST = 100;
        if (kingdom.gems < COST)
            throw new common_1.BadRequestException('Need 100 gems');
        kingdom.gems -= COST;
        kingdom.maxGold = Math.floor(kingdom.maxGold * 1.5);
        kingdom.maxWood = Math.floor(kingdom.maxWood * 1.5);
        kingdom.maxStone = Math.floor(kingdom.maxStone * 1.5);
        kingdom.maxFood = Math.floor(kingdom.maxFood * 1.5);
        await this.kingdomRepo.save(kingdom);
        return { maxGold: kingdom.maxGold, maxWood: kingdom.maxWood };
    }
};
exports.KingdomService = KingdomService;
exports.KingdomService = KingdomService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(kingdom_entity_1.Kingdom)),
    __param(1, (0, typeorm_1.InjectRepository)(building_entity_1.Building)),
    __param(2, (0, typeorm_1.InjectRepository)(unit_entity_1.Unit)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        economy_service_1.EconomyService,
        notification_service_1.NotificationService])
], KingdomService);
//# sourceMappingURL=kingdom.service.js.map