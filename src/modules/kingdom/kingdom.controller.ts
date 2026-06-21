import { Controller, Get, Post, Delete, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { KingdomService } from './kingdom.service';
import { WithdrawalService } from '../withdrawal/withdrawal.service';
import { ConfigService } from '@nestjs/config';

@Controller('kingdom')
@UseGuards(JwtAuthGuard)
export class KingdomController {
  constructor(
    private kingdomService: KingdomService,
    private withdrawalService: WithdrawalService,
    private config: ConfigService,
  ) {}

  @Get()
  getMyKingdom(@Request() req) {
    return this.kingdomService.getKingdomByUser(req.user.userId);
  }

  @Post('shield')
  async buyShield(@Request() req) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.kingdomService.buyShield(kingdom.id);
  }

  @Post('expand-storage')
  async expandStorage(@Request() req) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.kingdomService.expandStorage(kingdom.id);
  }

  @Post('hire-worker')
  async hireWorker(@Request() req) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.kingdomService.hireWorker(kingdom.id);
  }

  @Post('fire-worker')
  async fireWorker(@Request() req) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.kingdomService.fireWorker(kingdom.id);
  }

  @Post('rename')
  async renameKingdom(@Request() req, @Body() body: { name: string }) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.kingdomService.renameKingdom(kingdom.id, body.name);
  }

  @Get('usdt-balance')
  async getUsdtBalance(@Request() req) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    const history = await this.withdrawalService.getUserHistory(req.user.userId);
    const pending = history.find(w => w.status === 'pending');
    return {
      usdtBalance: kingdom.usdtBalance ?? 0,
      withdrawalStatus: pending ? 'pending' : 'none',
      withdrawalPending: pending?.amount ?? 0,
      withdrawalWallet: pending?.walletAddress ?? '',
      history: history.slice(0, 5),
    };
  }

  @Post('request-withdrawal')
  async requestWithdrawal(@Request() req, @Body() body: { walletAddress: string; amount: number }) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    const amount = body.amount ?? kingdom.usdtBalance;
    return this.withdrawalService.request(req.user.userId, amount, body.walletAddress);
  }

  @Post('build-gem-forge')
  async buildGemForge(@Request() req) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.kingdomService.buildGemForge(kingdom.id);
  }

  @Post('upgrade-gem-forge')
  async upgradeGemForge(@Request() req, @Body() body: { buildingId: string }) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.kingdomService.upgradeGemForge(kingdom.id, body.buildingId);
  }

  @Post('exchange-gems')
  async exchangeGems(@Request() req, @Body() body: { resource: 'gold' | 'wood' | 'stone' | 'food'; amount: number }) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.kingdomService.exchangeGems(kingdom.id, body.resource, body.amount);
  }

  @Post('buy-gems')
  async buyGems(@Request() req, @Body() body: { gems: number }) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.kingdomService.buyGems(kingdom.id, body.gems);
  }

  @Post('buy-titan')
  async buyTitan(@Request() req) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.kingdomService.buyTitanHero(kingdom.id);
  }

  @Post('buy-giant')
  async buyGiant(@Request() req) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.kingdomService.buyGiantHero(kingdom.id);
  }

  @Get('messages')
  async getMessages(@Request() req) {
    return this.kingdomService.getMessages(req.user.userId);
  }

  @Delete('messages')
  async clearMessages(@Request() req) {
    return this.kingdomService.clearMessages(req.user.userId);
  }

  @Post('withdraw-usdt')
  withdrawUsdt() {
    throw new BadRequestException('נא להשתמש בטופס המשיכה החדש עם כתובת ארנק');
  }

  @Post('use-magic')
  async useMagic(@Request() req, @Body() body: { amount: number }) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.kingdomService.useMagic(kingdom.id, body.amount ?? 1);
  }

  @Post('contact')
  async sendContact(@Request() req, @Body() body: { subject: string; message: string }) {
    const { subject, message } = body;
    if (!subject?.trim() || !message?.trim()) throw new BadRequestException('subject and message required');
    const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    const adminId = this.config.get<string>('ADMIN_TELEGRAM_ID');
    if (!botToken || !adminId) return { ok: true };
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    const text = `📩 <b>פנייה חדשה מהמשחק</b>\n\n👤 ממלכה: <b>${kingdom?.name ?? 'unknown'}</b>\n📌 נושא: ${subject}\n\n${message}`;
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: adminId, text, parse_mode: 'HTML' }),
    });
    return { ok: true };
  }
}
