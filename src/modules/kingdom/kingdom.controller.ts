import { Controller, Get, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { KingdomService } from './kingdom.service';

@Controller('kingdom')
@UseGuards(JwtAuthGuard)
export class KingdomController {
  constructor(private kingdomService: KingdomService) {}

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
    return this.kingdomService.getWithdrawalStatus(kingdom.id);
  }

  @Post('request-withdrawal')
  async requestWithdrawal(@Request() req, @Body() body: { walletAddress: string }) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.kingdomService.requestWithdrawal(kingdom.id, body.walletAddress);
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

  @Post('withdraw-usdt')
  withdrawUsdt() {
    throw new BadRequestException('נא להשתמש בטופס המשיכה החדש עם כתובת ארנק');
  }
}
