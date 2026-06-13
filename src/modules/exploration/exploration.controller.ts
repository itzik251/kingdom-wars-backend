import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ExplorationService } from './exploration.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('exploration')
@UseGuards(JwtAuthGuard)
export class ExplorationController {
  constructor(private readonly explorationService: ExplorationService) {}

  @Get('map')
  getMap(@Req() req: any) {
    return this.explorationService.getMap(req.user.kingdomId);
  }

  @Post('hire-explorer')
  hireExplorer(@Req() req: any) {
    return this.explorationService.hireExplorer(req.user.kingdomId);
  }

  @Post('mission')
  sendMission(@Req() req: any, @Body() body: { targetX: number; targetY: number }) {
    return this.explorationService.sendMission(req.user.kingdomId, body.targetX, body.targetY);
  }

  @Post('raid/:nodeId')
  raidNode(@Req() req: any, @Param('nodeId') nodeId: string) {
    return this.explorationService.raidNode(req.user.kingdomId, nodeId);
  }

  @Post('recruit/:nodeId')
  recruitHero(@Req() req: any, @Param('nodeId') nodeId: string) {
    return this.explorationService.recruitHero(req.user.kingdomId, nodeId);
  }
}
