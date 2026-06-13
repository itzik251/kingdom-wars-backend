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
import { TonService } from '../ton/ton.service';
import { CryptoBotService } from '../cryptobot/cryptobot.service';
import { AntiBotService } from '../antibot/antibot.service';
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
    private tonService: TonService,
    private cryptoBotService: CryptoBotService,
    private antiBotService: AntiBotService,
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
    const secret = this.config.get('ADMIN_SECRET');
    // ── SECURITY: Admin secret MUST be set in environment — no hardcoded fallback ──
    if (!secret) throw new UnauthorizedException('Admin access not configured');
    const provided = headers['x-admin-secret'] || '';
    // Constant-time comparison to prevent timing attacks
    const crypto = require('crypto');
    const secretBuf = Buffer.from(secret);
    const providedBuf = Buffer.from(provided.padEnd(secret.length, '\0').slice(0, Math.max(secret.length, provided.length)));
    if (secretBuf.length !== providedBuf.length || !crypto.timingSafeEqual(secretBuf, providedBuf)) {
      throw new UnauthorizedException('Forbidden');
    }
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
    return this.giveResource(telegramId, 'gems', body.gems, headers);
  }

  @Post('take-resource/:telegramId')
  async takeResource(
    @Param('telegramId') telegramId: string,
    @Body('type') type: ResourceType,
    @Body('amount') amount: number,
    @Headers() headers: any,
  ) {
    this.guard(headers);
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
    @Headers() headers: any,
  ) {
    this.guard(headers);
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
    else if (type === 'usdt')  { kingdom.usdtBalance = parseFloat(Math.max(0, (kingdom.usdtBalance || 0) + amount).toFixed(6)); }

    await this.kingdomRepo.save(kingdom);

    await this.notifService.create(user.id, 'admin_gift', {
      type, amount, label: `${resourceLabels[type] || type} ×${amount}`,
      language: user.language,
    }).catch(() => {});

    return { success: true, type, amount };
  }

  @Post('give-resource-all')
  async giveResourceAll(
    @Body('type') type: string,
    @Body('amount') amount: number,
    @Headers() headers: any,
  ) {
    this.guard(headers);
    if (!type || !amount || amount <= 0) return { error: 'Invalid params' };
    const kingdoms = await this.kingdomRepo.find({ relations: ['user'] });
    let count = 0;
    for (const kingdom of kingdoms) {
      if (type === 'gems')  kingdom.gems  = Math.max(0, (kingdom.gems  || 0) + amount);
      else if (type === 'gold')  kingdom.gold  = Math.min(kingdom.maxGold,  Math.max(0, (kingdom.gold  || 0) + amount));
      else if (type === 'wood')  kingdom.wood  = Math.min(kingdom.maxWood,  Math.max(0, (kingdom.wood  || 0) + amount));
      else if (type === 'stone') kingdom.stone = Math.min(kingdom.maxStone, Math.max(0, (kingdom.stone || 0) + amount));
      else if (type === 'food')  kingdom.food  = Math.min(kingdom.maxFood,  Math.max(0, (kingdom.food  || 0) + amount));
      else if (type === 'usdt')  kingdom.usdtBalance = parseFloat(Math.max(0, (kingdom.usdtBalance || 0) + amount).toFixed(6));
      await this.kingdomRepo.save(kingdom);
      count++;
    }
    return { success: true, type, amount, affectedKingdoms: count };
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
    // Primary: CryptoBot balance (no wallet address needed)
    const cryptoBalance = await this.cryptoBotService.getBalance();
    const result: any = {
      usdtBalance: parseFloat(cryptoBalance['USDT'] || '0'),
      tonBalance: parseFloat(cryptoBalance['TON'] || '0'),
      source: 'CryptoBot',
      network: 'TON/CryptoBot',
    };

    // Secondary: on-chain TON wallet (if configured)
    const cfg = this.getWalletConfig();
    if (cfg.address && this.tonService.isValidAddress(cfg.address)) {
      const [chainUsdt, chainTon] = await Promise.all([
        this.tonService.getUsdtBalance(cfg.address),
        this.tonService.getTonBalance(cfg.address),
      ]);
      result.chainAddress = cfg.address;
      result.chainUsdtBalance = chainUsdt;
      result.chainTonBalance = chainTon;
    }

    return result;
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
    if (kingdom.withdrawalStatus !== 'pending' && kingdom.withdrawalStatus !== 'processing') return { error: 'Not pending' };
    if (kingdom.withdrawalStatus === 'processing') return { error: 'Already being processed' };

    const amount = kingdom.withdrawalPending;
    const wallet = kingdom.withdrawalWallet;

    // Lock the row immediately to prevent double-send on concurrent approval clicks
    kingdom.withdrawalStatus = 'processing';
    await this.kingdomRepo.save(kingdom);

    // ⚠️ MANUAL TRANSFER REQUIRED:
    // Admin must manually send ${amount} USDT-TON from @wallet to: ${wallet}
    // After sending, click Approve to mark as done in DB.
    // (Automated transfer removed to avoid CryptoBot $3.5 fee)

    // Mark as approved + deduct balance (admin confirmed manual send)
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

    return { success: true, amount, wallet, note: `שלח ידנית ${amount} USDT-TON ל: ${wallet}` };
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
    return this.giveResource(telegramId, 'vip', body.days || VIP_DURATION_DAYS, headers);
  }

  @Post('remove-vip/:telegramId')
  async removeVip(@Headers() headers: any, @Param('telegramId') telegramId: string) {
    this.guard(headers);
    const user = await this.userRepo.findOne({ where: { telegramId } });
    if (!user) return { error: 'User not found' };
    const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: user.id } } });
    if (!kingdom) return { error: 'Kingdom not found' };
    kingdom.vipExpiresAt = null;
    await this.kingdomRepo.save(kingdom);
    return { success: true };
  }

  @Get('users')
  async listUsers(@Headers() headers: any) {
    this.guard(headers);

    // Fetch users + kingdoms + referral counts in 4 queries instead of ~2000
    const users = await this.userRepo.find({ order: { createdAt: 'DESC' }, take: 100 });
    const userIds = users.map(u => u.id);

    const kingdoms = userIds.length
      ? await this.kingdomRepo
          .createQueryBuilder('k')
          .select(['k', 'u.id'])
          .innerJoin('k.user', 'u')
          .where('u.id IN (:...ids)', { ids: userIds })
          .getMany()
      : [];
    // After the join, kingdom.user.id is populated
    const kingdomMap = new Map(kingdoms.map(k => [k.user?.id, k]));

    // Total referral count per user (one query)
    const totalRefRows = userIds.length
      ? await this.userRepo
          .createQueryBuilder('u')
          .select('u.referredBy', 'referrerId')
          .addSelect('COUNT(*)', 'cnt')
          .where('u.referredBy IN (:...ids)', { ids: userIds })
          .groupBy('u.referredBy')
          .getRawMany()
      : [];
    const totalRefMap = new Map(totalRefRows.map((r: any) => [r.referrerId, parseInt(r.cnt)]));

    // Active referral count per user (one query — kingdoms with score > 0)
    const activeRefRows = userIds.length
      ? await this.userRepo
          .createQueryBuilder('u')
          .select('u.referred_by', 'referrerId')
          .addSelect('COUNT(*)', 'cnt')
          .innerJoin('kingdoms', 'k', 'k.user_id = u.id')
          .where('u.referred_by IN (:...ids)', { ids: userIds })
          .andWhere(
            '((SELECT COUNT(*) FROM buildings b WHERE b.kingdom_id = k.id) > 6 OR (SELECT COUNT(*) FROM buildings b WHERE b.kingdom_id = k.id AND b.level > 1) > 0)',
          )
          .groupBy('u.referred_by')
          .getRawMany()
      : [];
    const activeRefMap = new Map(activeRefRows.map((r: any) => [r.referrerId, parseInt(r.cnt)]));

    const now = new Date();
    return users.map(u => {
      const k = kingdomMap.get(u.id);
      return {
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
        isVip: !!(k?.vipExpiresAt && now < new Date(k.vipExpiresAt)),
        vipUntil: k?.vipExpiresAt ?? null,
        referralsTotal: totalRefMap.get(u.id) ?? 0,
        referralsActive: activeRefMap.get(u.id) ?? 0,
      };
    });
  }

  @Get('users/:telegramId/referrals')
  async getUserReferrals(@Headers() headers: any, @Param('telegramId') telegramId: string) {
    this.guard(headers);
    const referrer = await this.userRepo.findOne({ where: { telegramId } });
    if (!referrer) return [];

    const referred = await this.userRepo.find({ where: { referredBy: { id: referrer.id } }, order: { createdAt: 'DESC' } });
    if (!referred.length) return [];

    const kingdomRows = await this.kingdomRepo
      .createQueryBuilder('k')
      .innerJoin('k.user', 'u')
      .select('u.id', 'userId')
      .addSelect('k.score', 'score')
      .addSelect('k.id', 'kingdomId')
      .where('u.id IN (:...ids)', { ids: referred.map(u => u.id) })
      .getRawMany();

    const scoreMap = new Map(kingdomRows.map((r: any) => [r.userId, { score: Number(r.score ?? 0), kingdomId: r.kingdomId }]));

    const result = [];
    for (const u of referred) {
      const kData = scoreMap.get(u.id);
      const score = kData?.score ?? 0;
      const kingdomId = kData?.kingdomId;
      let active = false;
      if (kingdomId) {
        const rows = await this.kingdomRepo.query(
          `SELECT COUNT(*) as total, SUM(CASE WHEN level > 1 THEN 1 ELSE 0 END) as upgraded FROM buildings WHERE kingdom_id = $1`,
          [kingdomId],
        );
        const total = parseInt(rows[0]?.total ?? '0');
        const upgraded = parseInt(rows[0]?.upgraded ?? '0');
        active = total > 6 || upgraded > 0;
      }
      result.push({ telegramId: u.telegramId, username: u.username || u.firstName, joinedAt: u.createdAt, score, active });
    }
    return result;
  }

  // ─── Anti-Bot Management ─────────────────────────────────────────────────

  @Get('antibot/status/:telegramId')
  async getAntiBotStatus(@Headers() headers: any, @Param('telegramId') telegramId: string) {
    this.guard(headers);
    const user = await this.userRepo.findOne({ where: { telegramId } });
    if (!user) return { error: 'User not found' };
    return this.antiBotService.getBanStatus(user.id);
  }

  @Post('antibot/ban/:telegramId')
  async antiBotBan(
    @Headers() headers: any,
    @Param('telegramId') telegramId: string,
    @Body() body: { hours?: number; reason?: string },
  ) {
    this.guard(headers);
    const user = await this.userRepo.findOne({ where: { telegramId } });
    if (!user) return { error: 'User not found' };
    const hours = body.hours ?? 24;
    await this.antiBotService.banUser(user.id, hours, body.reason || 'admin manual ban');
    return { success: true, bannedFor: `${hours}h`, userId: user.id };
  }

  @Post('antibot/unban/:telegramId')
  async antiBotUnban(@Headers() headers: any, @Param('telegramId') telegramId: string) {
    this.guard(headers);
    const user = await this.userRepo.findOne({ where: { telegramId } });
    if (!user) return { error: 'User not found' };
    await this.antiBotService.unbanUser(user.id);
    return { success: true };
  }
}
