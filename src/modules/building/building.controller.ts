import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { IsEnum } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BuildingService } from './building.service';
import { BuildingType } from './building.entity';
import { KingdomService } from '../kingdom/kingdom.service';

class UpgradeDto {
  @IsEnum(BuildingType)
  type: BuildingType;
}

@Controller('buildings')
@UseGuards(JwtAuthGuard)
export class BuildingController {
  constructor(
    private buildingService: BuildingService,
    private kingdomService: KingdomService,
  ) {}

  @Get()
  async getCosts(@Request() req) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.buildingService.getAllUpgradeCosts(kingdom.id);
  }

  @Post('upgrade')
  async upgrade(@Request() req, @Body() dto: UpgradeDto) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.buildingService.upgradeBuilding(kingdom.id, dto.type);
  }

  @Post('speedup')
  async speedUp(@Request() req, @Body() dto: UpgradeDto) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.buildingService.speedUpUpgrade(kingdom.id, dto.type);
  }

  @Post('build')
  async buildNew(@Request() req, @Body() dto: UpgradeDto) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.buildingService.buildNew(kingdom.id, dto.type);
  }
}
