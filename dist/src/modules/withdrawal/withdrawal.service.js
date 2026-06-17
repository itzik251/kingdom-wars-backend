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
var WithdrawalService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const withdrawal_entity_1 = require("./withdrawal.entity");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const ton_service_1 = require("../ton/ton.service");
const MIN_WITHDRAWAL = 1;
const MAX_WITHDRAWAL = 500;
let WithdrawalService = WithdrawalService_1 = class WithdrawalService {
    constructor(repo, kingdomRepo, dataSource, tonService) {
        this.repo = repo;
        this.kingdomRepo = kingdomRepo;
        this.dataSource = dataSource;
        this.tonService = tonService;
        this.logger = new common_1.Logger(WithdrawalService_1.name);
    }
    async request(userId, amount, walletAddress) {
        if (!amount || amount < MIN_WITHDRAWAL)
            throw new common_1.BadRequestException(`סכום מינימלי: $${MIN_WITHDRAWAL}`);
        if (amount > MAX_WITHDRAWAL)
            throw new common_1.BadRequestException(`סכום מקסימלי: $${MAX_WITHDRAWAL}`);
        if (!this.tonService.isValidAddress(walletAddress))
            throw new common_1.BadRequestException('כתובת ארנק TON לא תקינה');
        const result = await this.kingdomRepo
            .createQueryBuilder()
            .update()
            .set({ usdtBalance: () => `usdt_balance - ${amount}` })
            .where('user_id = :uid AND usdt_balance >= :amount', { uid: userId, amount })
            .execute();
        if (!result.affected || result.affected === 0)
            throw new common_1.BadRequestException('יתרת USDT לא מספיקה');
        const w = this.repo.create({ userId, amount, walletAddress, status: 'pending' });
        await this.repo.save(w);
        this.logger.log(`Withdrawal requested: userId=${userId} amount=${amount} to=${walletAddress}`);
        return { success: true, id: w.id, amount, status: 'pending' };
    }
    async listPending() {
        return this.repo
            .createQueryBuilder('w')
            .leftJoinAndSelect('w.user', 'u')
            .where('w.status = :s', { s: 'pending' })
            .orderBy('w.created_at', 'ASC')
            .getMany();
    }
    async listAll(limit = 50) {
        return this.repo
            .createQueryBuilder('w')
            .leftJoinAndSelect('w.user', 'u')
            .orderBy('w.created_at', 'DESC')
            .limit(limit)
            .getMany();
    }
    async approve(id) {
        const w = await this.repo.findOne({ where: { id } });
        if (!w)
            throw new common_1.BadRequestException('בקשה לא נמצאה');
        if (w.status !== 'pending')
            throw new common_1.BadRequestException(`סטטוס: ${w.status} — לא ניתן לאשר`);
        w.status = 'approved';
        await this.repo.save(w);
        const result = await this.tonService.sendUsdt(w.walletAddress, w.amount);
        if (result.error) {
            w.status = 'pending';
            w.adminNote = `שגיאת שליחה: ${result.error}`;
            await this.repo.save(w);
            throw new common_1.BadRequestException(`שגיאה בשליחה: ${result.error}`);
        }
        w.status = 'paid';
        w.txId = result.txId || null;
        await this.repo.save(w);
        this.logger.log(`Withdrawal paid: id=${id} amount=${w.amount} txId=${w.txId}`);
        return { success: true, txId: w.txId };
    }
    async reject(id, reason) {
        const w = await this.repo.findOne({ where: { id } });
        if (!w)
            throw new common_1.BadRequestException('בקשה לא נמצאה');
        if (w.status !== 'pending')
            throw new common_1.BadRequestException(`סטטוס: ${w.status} — לא ניתן לדחות`);
        await this.kingdomRepo
            .createQueryBuilder()
            .update()
            .set({ usdtBalance: () => `usdt_balance + ${w.amount}` })
            .where('user_id = :uid', { uid: w.userId })
            .execute();
        w.status = 'rejected';
        w.rejectReason = reason || 'נדחה על ידי אדמין';
        await this.repo.save(w);
        this.logger.log(`Withdrawal rejected: id=${id} reason=${w.rejectReason}`);
        return { success: true };
    }
    async getUserHistory(userId) {
        return this.repo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 20,
        });
    }
};
exports.WithdrawalService = WithdrawalService;
exports.WithdrawalService = WithdrawalService = WithdrawalService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(withdrawal_entity_1.Withdrawal)),
    __param(1, (0, typeorm_1.InjectRepository)(kingdom_entity_1.Kingdom)),
    __param(2, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        ton_service_1.TonService])
], WithdrawalService);
//# sourceMappingURL=withdrawal.service.js.map