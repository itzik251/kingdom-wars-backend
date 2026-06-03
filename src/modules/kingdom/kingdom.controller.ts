import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
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
}
