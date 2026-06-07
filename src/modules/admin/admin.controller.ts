import { Controller, Get, Post, Param, Body, Headers, UnauthorizedException, Res } from '@nestjs/common';
import { Response } from 'express';
import { join, resolve } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from '../notifications/notification.service';
import { TronService } from './tron.service';
import { VIP_DURATION_DAYS } from '../../constants/game.constants';

const WALLET_CFG_PATH = resolve(process.cwd(), 'wallet_config.json');

type ResourceType = 'gems' | 'gold' | 'wood' | 'stone' | 'food' | 'usdt' | 'vip';

@Controller('admin')
export class AdminController {
  constructor(
    @InjectRepository(User)    private userRepo: Repository<User>,
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
    private config: ConfigService,
    private notifService: NotificationService,
    private tronService: TronService,
  ) {}

  @Get()
  dashboard(@Res() res: Response) {
    res.sendFile(join(__dirname, 'admin-dashboard.html'));
  }

  private getWalletConfig(): { address: string } {
    try {
      if (existsSync(WALLET_CFG_PATH)) {
        return JSON.parse(readFileSync(WALLET_CFG_PATH, 'utf-8'));
      }
    } catch {}
    return { address: this.config.get('GAME_WALLET_ADDRESS') || '' };
  }

  private guard(headers: any) {
    const secret = this.config.get('ADMIN_SECRET') || 'kw_admin_2026';
    if (headers['x-admin-secret'] !== secret) throw new UnauthorizedException('Forbidden');
  }

  @Get('stats')
  async stats(@Headers() headers: any) {
    this.guard(headers);
    const [totalUsers, totalKingdoms] = await Promise.all([
      this.userRepo.count(),
      this.kingdomRepo.count(),
    ]);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const activeUsers = await this.userRepo
      .createQueryBuilder('u')
      .where('u.last_login > :d', { d: sevenDaysAgo })
      .getCount();

    const topKingdoms = await this.kingdomRepo.find({
      order: { score: 'DESC' },
      take: 10,
      relations: ['user'],
    });

    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const newToday = await this.userRepo
      .createQueryBuilder('u')
      .where('u.created_at > :d', { d: todayStart })
      .getCount();

    const gemsResult = await this.kingdomRepo
      .createQueryBuilder('k')
      .select('SUM(k.gems)', 'total')
      .getRawOne();

    const usdtResult = await this.kingdomRepo
      .createQueryBuilder('k')
      .select('SUM(k.usdt_balance)', 'total')
      .getRawOne();

    const now = new Date();
    const vipCount = await this.kingdomRepo
      .createQueryBuilder('k')
      .where('k.vip_expires_at > :now', { now })
      .getCount();

    const walletCfg = this.getWalletConfig();

    return {
      totalUsers,
      totalKingdoms,
      activeUsers7d: activeUsers,
      newUsersToday: newToday,
      totalGemsInGame: parseInt(gemsResult?.total || '0'),
      totalUsdtInGame: parseFloat(usdtResult?.total || '0').toFixed(4),
      vipCount,
      gameWalletAddress: walletCfg.address,
      topKingdoms: topKingdoms.map(k => ({
        name: k.name,
        score: k.score,
        gems: k.gems,
        gold: k.gold,
        usdtBalance: (k.usdtBalance ?? 0).toFixed(4),
        username: k.user?.username || k.user?.firstName,
      })),
    };
  }

  @Post('delete/:telegramId')
  async deleteUser(@Headers() headers: any, @Param('telegramId') telegramId: string) {
    this.guard(headers);
    const user = await this.userRepo.findOne({ where: { telegramId } });
    if (!user) return { error: 'User not found' };
    const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: user.id } } });
    if (kingdom) await this.kingdomRepo.remove(kingdom);
    await this.userRepo.remove(user);
    return { deleted: true, telegramId };
  }

  @Post('ban/:telegramId')
  async banUser(@Headers() headers: any, @Param('telegramId') telegramId: string) {
    this.guard(headers);
    const user = await this.userRepo.findOne({ where: { telegramId } });
    if (!user) return { error: 'User not found' };
    await this.userRepo.update({ telegramId }, { referralCode: 'BANNED_' + telegramId.slice(-4) });
    return { banned: true, telegramId };
  }

  @Post('give-gems/:telegramId')
  async giveGems(@Headers() headers: any, @Param('telegramId') telegramId: string, @Body() body: { gems: number }) {
    this.guard(headers);
    return this.giveResource(telegramId, 'gems', body.gems);
  }

  @Post('take-resource/:telegramId')
  async takeResource(
    @Param('telegramId') telegramId: string,
    @Body('type') type: ResourceType,
    @Body('amount') amount: number,
    @Headers() headers?: any,
  ) {
    if (headers) this.guard(headers);
    const user = await this.userRepo.findOne({ where: { telegramId } });
    if (!user) return { error: 'User not found' };
    const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: user.id } } });
    if (!kingdom) return { error: 'Kingdom not found' };

    if (type === 'gems')  kingdom.gems  = Math.max(0, (kingdom.gems  || 0) - amount);
    else if (type === 'gold')  kingdom.gold  = Math.max(0, (kingdom.gold  || 0) - amount);
    else if (type === 'wood')  kingdom.wood  = Math.max(0, (kingdom.wood  || 0) - amount);
    else if (type === 'stone') kingdom.stone = Math.max(0, (kingdom.stone || 0) - amount);
    else if (type === 'food')  kingdom.food  = Math.max(0, (kingdom.food  || 0) - amount);
    else if (type === 'usdt')  kingdom.usdtBalance = Math.max(0, parseFloat(((kingdom.usdtBalance || 0) - amount).toFixed(6)));

    await this.kingdomRepo.save(kingdom);
    return { success: true, type, amount };
  }

  @Post('give-resource/:telegramId')
  async giveResource(
    @Param('telegramId') telegramId: string,
    @Body('type') type: ResourceType,
    @Body('amount') amount: number,
    @Headers() headers?: any,
  ) {
    if (headers) this.guard(headers);
    const user = await this.userRepo.findOne({ where: { telegramId } });
    if (!user) return { error: 'User not found' };
    const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: user.id } } });
    if (!kingdom) return { error: 'Kingdom not found' };

    const resourceLabels: Record<string, string> = {
      gems: '💎 Gems', gold: '💰 זהב', wood: '🪵 עץ',
      stone: '🪨 אבן', food: '🌾 אוכל', usdt: '💵 USDT', vip: '👑 VIP',
    };

    if (type === 'vip') {
      const days = amount || VIP_DURATION_DAYS;
      const expiresAt = new Date(Math.max(Date.now(), kingdom.vipExpiresAt?.getTime() ?? 0) + days * 86_400_000);
      kingdom.vipExpiresAt = expiresAt;
      await this.kingdomRepo.save(kingdom);
      await this.notifService.create(user.id, 'admin_gift', {
        type: 'vip', amount: days, label: `👑 VIP ל-${days} ימים`,
        language: user.language,
      }).catch(() => {});
      return { success: true, type: 'vip', vipUntil: expiresAt };
    }

    if (type === 'gems')  { kingdom.gems  = Math.max(0, (kingdom.gems  || 0) + amount); }
    else if (type === 'gold')  { kingdom.gold  = Math.min(kingdom.maxGold,  Math.max(0, (kingdom.gold  || 0) + amount)); }
    else if (type === 'wood')  { kingdom.wood  = Math.min(kingdom.maxWood,  Math.max(0, (kingdom.wood  || 0) + amount)); }
    else if (type === 'stone') { kingdom.stone = Math.min(kingdom.maxStone, Math.max(0, (kingdom.stone || 0) + amount)); }
    else if (type === 'food')  { kingdom.food  = Math.min(kingdom.maxFood,  Math.max(0, (kingdom.food  || 0) + amount)); }
    else if (type === 'usdt')  { kingdom.usdtBalance = parseFloat(((kingdom.usdtBalance || 0) + amount).toFixed(6)); }

    await this.kingdomRepo.save(kingdom);

    await this.notifService.create(user.id, 'admin_gift', {
      type, amount, label: `${resourceLabels[type] || type} ×${amount}`,
      language: user.language,
    }).catch(() => {});

    return { success: true, type, amount };
  }

  @Get('wallet')
  getWallet(@Headers() headers: any) {
    this.guard(headers);
    return this.getWalletConfig();
  }

  @Post('wallet')
  updateWallet(@Headers() headers: any, @Body() body: { address: string }) {
    this.guard(headers);
    const cfg = { address: body.address?.trim() || '' };
    try { writeFileSync(WALLET_CFG_PATH, JSON.stringify(cfg, null, 2), 'utf-8'); } catch {}
    return { success: true, ...cfg };
  }

  @Get('wallet/balance')
  async getWalletBalance(@Headers() headers: any) {
    this.guard(headers);
    const cfg = this.getWalletConfig();
    if (!cfg.address) return { error: 'לא הוגדרה כתובת ארנק' };
    const [usdtBalance, trxBalance] = await Promise.all([
      this.tronService.getUsdtBalance(cfg.address),
      this.tronService.getTrxBalance(cfg.address),
    ]);
    return { address: cfg.address, usdtBalance, trxBalance };
  }

  @Get('withdrawals')
  async getPendingWithdrawals(@Headers() headers: any) {
    this.guard(headers);
    const kingdoms = await this.kingdomRepo
      .createQueryBuilder('k')
      .leftJoinAndSelect('k.user', 'u')
      .where('k.withdrawal_status = :s', { s: 'pending' })
      .orderBy('k.created_at', 'DESC')
      .getMany();

    return kingdoms.map(k => ({
      kingdomId: k.id,
      kingdomName: k.name,
      telegramId: k.user?.telegramId,
      username: k.user?.username || k.user?.firstName,
      amount: k.withdrawalPending,
      wallet: k.withdrawalWallet,
    }));
  }

  @Post('withdrawals/:kingdomId/approve')
  async approveWithdrawal(@Headers() headers: any, @Param('kingdomId') kingdomId: string) {
    this.guard(headers);
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId }, relations: ['user'] });
    if (!kingdom) return { error: 'Not found' };
    if (kingdom.withdrawalStatus !== 'pending') return { error: 'Not pending' };

    const amount = kingdom.withdrawalPending;
    const wallet = kingdom.withdrawalWallet;

    // Execute actual blockchain transfer
    const txResult = await this.tronService.sendUsdt(wallet, amount);
    if (txResult.error) {
      return { error: txResult.error, hint: 'ודא שמפתח GAME_WALLET_PRIVATE_KEY מוגדר ושיש מספיק TRX לעמלות' };
    }

    // Update DB only after successful transfer
    kingdom.usdtBalance = Math.max(0, (kingdom.usdtBalance ?? 0) - amount);
    kingdom.withdrawalPending = 0;
    kingdom.withdrawalStatus = 'approved';
    kingdom.withdrawalWallet = null;
    await this.kingdomRepo.save(kingdom);

    if (kingdom.user) {
      await this.notifService.create(kingdom.user.id, 'withdrawal_approved', {
        amount: amount.toFixed(4),
        language: kingdom.user.language,
      }).catch(() => {});
    }

    return { success: true, amount, wallet, txId: txResult.txId };
  }

  @Post('withdrawals/:kingdomId/reject')
  async rejectWithdrawal(@Headers() headers: any, @Param('kingdomId') kingdomId: string, @Body() body: { reason?: string }) {
    this.guard(headers);
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId }, relations: ['user'] });
    if (!kingdom) return { error: 'Not found' };

    kingdom.withdrawalPending = 0;
    kingdom.withdrawalStatus = 'rejected';
    kingdom.withdrawalWallet = null;
    await this.kingdomRepo.save(kingdom);

    if (kingdom.user) {
      await this.notifService.create(kingdom.user.id, 'withdrawal_rejected', {
        reason: body.reason ? ': ' + body.reason : '',
        language: kingdom.user.language,
      }).catch(() => {});
    }

    return { success: true };
  }

  @Post('give-vip/:telegramId')
  async giveVip(@Headers() headers: any, @Param('telegramId') telegramId: string, @Body() body: { days?: number }) {
    this.guard(headers);
    return this.giveResource(telegramId, 'vip', body.days || VIP_DURATION_DAYS);
  }

  @Get('users')
  async listUsers(@Headers() headers: any) {
    this.guard(headers);
    const users = await this.userRepo.find({
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const result = [];
    for (const u of users) {
      const k = await this.kingdomRepo.findOne({ where: { user: { id: u.id } } });

      // Count referrals: total invited + active (score > 0)
      const referredUsers = await this.userRepo.find({ where: { referredBy: { id: u.id } } });
      let activeReferrals = 0;
      for (const ru of referredUsers) {
        const rk = await this.kingdomRepo.findOne({ where: { user: { id: ru.id } } });
        if (rk && rk.score > 0) activeReferrals++;
      }

      result.push({
        telegramId: u.telegramId,
        name: u.firstName || u.username,
        username: u.username || '',
        language: u.language,
        joined: u.createdAt,
        lastLogin: u.lastLogin,
        termsAccepted: !!u.termsAcceptedAt,
        kingdomName: k?.name ?? '—',
        score: k?.score ?? 0,
        gems: k?.gems ?? 0,
        gold: k?.gold ?? 0,
        wood: k?.wood ?? 0,
        stone: k?.stone ?? 0,
        food: k?.food ?? 0,
        usdtBalance: (k?.usdtBalance ?? 0).toFixed(4),
        isVip: !!(k?.vipExpiresAt && new Date() < new Date(k.vipExpiresAt)),
        vipUntil: k?.vipExpiresAt ?? null,
        referralsTotal: referredUsers.length,
        referralsActive: activeReferrals,
      });
    }
    return result;
  }
}
