import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ExplorationService } from './exploration.service';
import { KingdomService } from '../kingdom/kingdom.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('exploration')
@UseGuards(JwtAuthGuard)
export class ExplorationController {
  constructor(
    private readonly explorationService: ExplorationService,
    private readonly kingdomService: KingdomService,
  ) {}

  private async getKingdomId(req: any): Promise<string> {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return kingdom.id;
  }

  @Get('map')
  async getMap(@Req() req: any) {
    return this.explorationService.getMap(await this.getKingdomId(req));
  }

  @Post('hire-explorer')
  async hireExplorer(@Req() req: any) {
    return this.explorationService.hireExplorer(await this.getKingdomId(req));
  }

  @Post('mission')
  async sendMission(@Req() req: any, @Body() body: { targetX: number; targetY: number }) {
    return this.explorationService.sendMission(await this.getKingdomId(req), body.targetX, body.targetY);
  }

  @Post('raid/:nodeId')
  async raidNode(@Req() req: any, @Param('nodeId') nodeId: string) {
    return this.explorationService.raidNode(await this.getKingdomId(req), nodeId);
  }

  @Post('recruit/:nodeId')
  async recruitHero(@Req() req: any, @Param('nodeId') nodeId: string) {
    return this.explorationService.recruitHero(await this.getKingdomId(req), nodeId);
  }

  @Delete('missions/completed')
  async clearCompleted(@Req() req: any) {
    return this.explorationService.clearCompletedMissions(await this.getKingdomId(req));
  }
}
