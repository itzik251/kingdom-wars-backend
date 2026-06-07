import { Controller, Get, Post, Param, Body, Headers, UnauthorizedException, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { ConfigService } from '@nestjs/config';

@Controller('admin')
export class AdminController {
  constructor(
    @InjectRepository(User)    private userRepo: Repository<User>,
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
    private config: ConfigService,
  ) {}

  @Get()
  dashboard(@Res() res: Response) {
    res.sendFile(join(__dirname, 'admin-dashboard.html'));
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

    // Active users: logged in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const activeUsers = await this.userRepo
      .createQueryBuilder('u')
      .where('u.last_login > :d', { d: sevenDaysAgo })
      .getCount();

    // Top kingdoms by score
    const topKingdoms = await this.kingdomRepo.find({
      order: { score: 'DESC' },
      take: 10,
      relations: ['user'],
    });

    // New users today
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const newToday = await this.userRepo
      .createQueryBuilder('u')
      .where('u.created_at > :d', { d: todayStart })
      .getCount();

    // Total gems in circulation
    const gemsResult = await this.kingdomRepo
      .createQueryBuilder('k')
      .select('SUM(k.gems)', 'total')
      .getRawOne();

    return {
      totalUsers,
      totalKingdoms,
      activeUsers7d: activeUsers,
      newUsersToday: newToday,
      totalGemsInGame: parseInt(gemsResult?.total || '0'),
      topKingdoms: topKingdoms.map(k => ({
        name: k.name,
        score: k.score,
        gems: k.gems,
        gold: k.gold,
        username: k.user?.username || k.user?.firstName,
      })),
    };
  }

  @Post('ban/:telegramId')
  async banUser(@Headers() headers: any, @Param('telegramId') telegramId: string) {
    this.guard(headers);
    const user = await this.userRepo.findOne({ where: { telegramId } });
    if (!user) return { error: 'User not found' };
    // Mark as banned by clearing referral code (simple flag)
    await this.userRepo.update({ telegramId }, { referralCode: 'BANNED_' + telegramId.slice(-4) });
    return { banned: true, telegramId };
  }

  @Post('give-gems/:telegramId')
  async giveGems(@Headers() headers: any, @Param('telegramId') telegramId: string, @Body() body: { gems: number }) {
    this.guard(headers);
    const user = await this.userRepo.findOne({ where: { telegramId } });
    if (!user) return { error: 'User not found' };
    const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: user.id } } });
    if (!kingdom) return { error: 'Kingdom not found' };
    kingdom.gems += body.gems;
    await this.kingdomRepo.save(kingdom);
    return { success: true, newGems: kingdom.gems };
  }

  @Get('users')
  async listUsers(@Headers() headers: any) {
    this.guard(headers);
    const users = await this.userRepo.find({
      order: { createdAt: 'DESC' },
      take: 50,
      relations: [],
    });
    const result = [];
    for (const u of users) {
      const k = await this.kingdomRepo.findOne({ where: { user: { id: u.id } } });
      result.push({
        telegramId: u.telegramId,
        name: u.firstName || u.username,
        language: u.language,
        joined: u.createdAt,
        lastLogin: u.lastLogin,
        termsAccepted: !!u.termsAcceptedAt,
        score: k?.score ?? 0,
        gems: k?.gems ?? 0,
      });
    }
    return result;
  }
}
