import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { IsEnum, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AntiBotGuard, AntiBotAction } from '../antibot/antibot.guard';
import { BuildingService } from './building.service';
import { BuildingType } from './building.entity';
import { KingdomService } from '../kingdom/kingdom.service';
import { QuestService } from '../quest/quest.service';

class UpgradeDto {
  @IsEnum(BuildingType)
  type: BuildingType;

  @IsOptional()
  @IsString()
  buildingId?: string;
}

@Controller('buildings')
@UseGuards(JwtAuthGuard)
export class BuildingController {
  constructor(
    private buildingService: BuildingService,
    private kingdomService: KingdomService,
    private questService: QuestService,
  ) {}

  @Get()
  async getCosts(@Request() req) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.buildingService.getAllUpgradeCosts(kingdom.id);
  }

  @Post('upgrade')
  @UseGuards(AntiBotGuard)
  @AntiBotAction('building_upgrade')
  async upgrade(@Request() req, @Body() dto: UpgradeDto) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    const result = await this.buildingService.upgradeBuilding(kingdom.id, dto.type, false, dto.buildingId);
    await this.questService.incrementQuest(kingdom.id, 'upgrade_building', 1).catch(() => {});
    return result;
  }

  @Post('speedup')
  async speedUp(@Request() req, @Body() dto: UpgradeDto) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.buildingService.speedUpUpgrade(kingdom.id, dto.type, dto.buildingId);
  }

  @Post('build')
  async buildNew(@Request() req, @Body() dto: UpgradeDto) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.buildingService.buildNew(kingdom.id, dto.type);
  }

  @Get('repair-cost/:id')
  async repairCost(@Request() req, @Param('id') buildingId: string) {
    const { buildings } = await this.kingdomService.getKingdomByUser(req.user.userId);
    const building = (buildings as any[]).find((b: any) => b.id === buildingId);
    if (!building) return { cost: { gold: 0, wood: 0, stone: 0 }, repairTimeSeconds: 0 };
    return this.buildingService.getRepairCost(building.type, building.level);
  }

  @Post('repair/:id')
  async repair(@Request() req, @Param('id') buildingId: string) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.buildingService.repairBuilding(kingdom.id, buildingId);
  }

  @Patch(':id/position')
  async moveBuilding(@Request() req, @Param('id') buildingId: string, @Body() dto: { gridX: number; gridY: number }) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.buildingService.moveBuilding(kingdom.id, buildingId, dto.gridX, dto.gridY);
  }
}
