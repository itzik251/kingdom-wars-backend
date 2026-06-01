import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QuestService } from './quest.service';
import { KingdomService } from '../kingdom/kingdom.service';

@Controller('quests')
@UseGuards(JwtAuthGuard)
export class QuestController {
  constructor(
    private questService: QuestService,
    private kingdomService: KingdomService,
  ) {}

  @Get('daily')
  async daily(@Request() req) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.questService.getDailyQuests(kingdom.id);
  }

  @Get('weekly')
  async weekly(@Request() req) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.questService.getWeeklyQuests(kingdom.id);
  }

  @Post(':id/claim')
  async claim(@Request() req, @Param('id') questId: string) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.questService.claimReward(kingdom.id, questId);
  }
}
