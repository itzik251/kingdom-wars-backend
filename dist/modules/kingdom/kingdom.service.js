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
const economy_service_1 = require("../economy/economy.service");
let KingdomService = class KingdomService {
    constructor(kingdomRepo, buildingRepo, unitRepo, economyService) {
        this.kingdomRepo = kingdomRepo;
        this.buildingRepo = buildingRepo;
        this.unitRepo = unitRepo;
        this.economyService = economyService;
    }
    async getKingdomByUser(userId) {
        const kingdom = await this.kingdomRepo.findOne({
            where: { user: { id: userId } },
        });
        if (!kingdom)
            throw new common_1.NotFoundException('Kingdom not found');
        const updated = await this.economyService.tickKingdom(kingdom.id);
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
        const buildingsToSave = buildings.filter(b => b.upgradeEndsAt && now >= new Date(b.upgradeEndsAt));
        for (const b of buildingsToSave) {
            b.level += 1;
            b.upgradeEndsAt = null;
            if (b.type === 'town_hall') {
                const mult = 1 + (b.level - 1) * 0.3;
                updated.maxGold = Math.floor(5000 * mult);
                updated.maxWood = Math.floor(4000 * mult);
                updated.maxStone = Math.floor(3000 * mult);
                updated.maxFood = Math.floor(2000 * mult);
                await this.kingdomRepo.save(updated);
            }
        }
        if (buildingsToSave.length > 0)
            await this.buildingRepo.save(buildingsToSave);
        const unitsToSave = units.filter(u => u.trainingEndsAt && now >= new Date(u.trainingEndsAt) && u.trainingCount > 0);
        for (const u of unitsToSave) {
            u.count += u.trainingCount;
            u.trainingCount = 0;
            u.trainingEndsAt = null;
        }
        if (unitsToSave.length > 0)
            await this.unitRepo.save(unitsToSave);
        const productionRates = this.economyService.getProductionRates(buildings, updated);
        return {
            kingdom: updated,
            buildings,
            units,
            productionRates,
            shieldActive: updated.isShielded,
            shieldUntil: updated.shieldUntil,
            isVip: !!updated.isVip,
            workers: updated.workers || 0,
            maxWorkers: updated.maxWorkers || 5,
        };
    }
    async buyShield(kingdomId) {
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        const SHIELD_COST = 50;
        if (kingdom.gems < SHIELD_COST)
            throw new common_1.BadRequestException('Need 50 gems');
        kingdom.gems -= SHIELD_COST;
        kingdom.shieldUntil = new Date(Date.now() + 24 * 3600 * 1000);
        await this.kingdomRepo.save(kingdom);
        return { shieldUntil: kingdom.shieldUntil };
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
    async hireWorker(kingdomId) {
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        const thBuilding = await this.buildingRepo.findOne({ where: { kingdom: { id: kingdomId }, type: 'town_hall' } });
        const thLevel = (thBuilding === null || thBuilding === void 0 ? void 0 : thBuilding.level) || 1;
        const maxWorkers = 3 + thLevel;
        if ((kingdom.workers || 0) >= maxWorkers)
            throw new common_1.BadRequestException(`מקסימום ${maxWorkers} עובדים (שדרג בית עיר)`);
        const HIRE_COST = 50;
        if (kingdom.gold < HIRE_COST)
            throw new common_1.BadRequestException('דרוש 50 זהב לגיוס עובד');
        kingdom.gold -= HIRE_COST;
        kingdom.workers = (kingdom.workers || 0) + 1;
        kingdom.maxWorkers = maxWorkers;
        await this.kingdomRepo.save(kingdom);
        return { workers: kingdom.workers, maxWorkers };
    }
    async getUsdtBalance(kingdomId) {
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        return { usdtBalance: kingdom.usdtBalance || 0 };
    }
    async addUsdtBalance(kingdomId, amount) {
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        kingdom.usdtBalance = (kingdom.usdtBalance || 0) + amount;
        await this.kingdomRepo.save(kingdom);
        return { usdtBalance: kingdom.usdtBalance };
    }
    async withdrawUsdt(kingdomId, userId) {
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId }, relations: ['user'] });
        const balance = kingdom.usdtBalance || 0;
        if (balance < 20) throw new common_1.BadRequestException(`נדרש לפחות $20 USDT (יש לך $${balance.toFixed(2)})`);
        const token = process.env.CRYPTO_BOT_TOKEN;
        if (!token) throw new common_1.BadRequestException('CryptoBot לא מוגדר');
        const telegramId = kingdom.user?.telegramId;
        if (!telegramId) throw new common_1.BadRequestException('לא נמצא מזהה Telegram');
        const spendId = `withdrawal_${kingdomId}_${Date.now()}`;
        const res = await fetch('https://pay.crypt.bot/api/transfer', {
            method: 'POST',
            headers: { 'Crypto-Pay-API-Token': token, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: Number(telegramId),
                asset: 'USDT',
                amount: balance.toFixed(2),
                spend_id: spendId,
            }),
        });
        const data = await res.json();
        if (!data.ok) throw new common_1.BadRequestException('משיכה נכשלה: ' + (data.error?.name || 'שגיאה'));
        kingdom.usdtBalance = 0;
        await this.kingdomRepo.save(kingdom);
        return { success: true, amount: balance };
    }
    async fireWorker(kingdomId) {
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        if (!kingdom.workers || kingdom.workers <= 0)
            throw new common_1.BadRequestException('אין עובדים לפטר');
        kingdom.workers -= 1;
        kingdom.gold += 25;
        await this.kingdomRepo.save(kingdom);
        return { workers: kingdom.workers };
    }
};
exports.KingdomService = KingdomService;
exports.KingdomService = KingdomService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(kingdom_entity_1.Kingdom)),
    __param(1, (0, typeorm_1.InjectRepository)(building_entity_1.Building)),
    __param(2, (0, typeorm_1.InjectRepository)(unit_entity_1.Unit)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        economy_service_1.EconomyService])
], KingdomService);
//# sourceMappingURL=kingdom.service.js.map