import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Withdrawal } from './withdrawal.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { TonService } from '../ton/ton.service';

const MIN_WITHDRAWAL = 1;
const MAX_WITHDRAWAL = 500;

@Injectable()
export class WithdrawalService {
  private readonly logger = new Logger(WithdrawalService.name);

  constructor(
    @InjectRepository(Withdrawal) private repo: Repository<Withdrawal>,
    @InjectRepository(Kingdom)    private kingdomRepo: Repository<Kingdom>,
    @InjectDataSource()           private dataSource: DataSource,
    private tonService: TonService,
  ) {}

  async request(userId: string, amount: number, walletAddress: string) {
    if (!amount || amount < MIN_WITHDRAWAL) throw new BadRequestException(`סכום מינימלי: $${MIN_WITHDRAWAL}`);
    if (amount > MAX_WITHDRAWAL) throw new BadRequestException(`סכום מקסימלי: $${MAX_WITHDRAWAL}`);
    if (!this.tonService.isValidAddress(walletAddress)) throw new BadRequestException('כתובת ארנק TON לא תקינה');

    // Atomic deduct — only if balance >= amount
    const result = await this.kingdomRepo
      .createQueryBuilder()
      .update()
      .set({ usdtBalance: () => `usdt_balance - ${amount}` })
      .where('user_id = :uid AND usdt_balance >= :amount', { uid: userId, amount })
      .execute();

    if (!result.affected || result.affected === 0)
      throw new BadRequestException('יתרת USDT לא מספיקה');

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

  async approve(id: string) {
    const w = await this.repo.findOne({ where: { id } });
    if (!w) throw new BadRequestException('בקשה לא נמצאה');
    if (w.status !== 'pending') throw new BadRequestException(`סטטוס: ${w.status} — לא ניתן לאשר`);

    w.status = 'approved';
    await this.repo.save(w);

    // Send USDT on-chain
    const result = await this.tonService.sendUsdt(w.walletAddress, w.amount);
    if (result.error) {
      // Revert to pending so admin can retry
      w.status = 'pending';
      w.adminNote = `שגיאת שליחה: ${result.error}`;
      await this.repo.save(w);
      throw new BadRequestException(`שגיאה בשליחה: ${result.error}`);
    }

    w.status = 'paid';
    w.txId = result.txId || null;
    await this.repo.save(w);
    this.logger.log(`Withdrawal paid: id=${id} amount=${w.amount} txId=${w.txId}`);
    return { success: true, txId: w.txId };
  }

  async reject(id: string, reason?: string) {
    const w = await this.repo.findOne({ where: { id } });
    if (!w) throw new BadRequestException('בקשה לא נמצאה');
    if (w.status !== 'pending') throw new BadRequestException(`סטטוס: ${w.status} — לא ניתן לדחות`);

    // Refund balance
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

  async getUserHistory(userId: string) {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }
}
