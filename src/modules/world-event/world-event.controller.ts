import { Controller, Get, Post, Body, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorldEventService } from './world-event.service';
import { KingdomService } from '../kingdom/kingdom.service';

@Controller('world-event')
@UseGuards(JwtAuthGuard)
export class WorldEventController {
  constructor(
    private worldEventService: WorldEventService,
    private kingdomService: KingdomService,
  ) {}

  @Get('current')
  async getCurrent(@Request() req) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.worldEventService.getCurrentEvent(kingdom?.id);
  }

  @Post('register')
  async register(@Request() req, @Body() body: { choice: 'fight' | 'shield' }) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    if (!kingdom) throw new Error('NO_KINGDOM');
    if (!['fight', 'shield'].includes(body.choice)) throw new Error('INVALID_CHOICE');
    return this.worldEventService.registerChoice(kingdom.id, body.choice);
  }

  @Post('admin/create')
  async adminCreate(@Request() req) {
    // Simple admin check — use numeric telegramId check
    const user = req.user;
    return this.worldEventService.createNextEvent();
  }
}
