import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { IsEnum, IsInt, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UnitsService } from './units.service';
import { UnitType } from './unit.entity';
import { KingdomService } from '../kingdom/kingdom.service';

class TrainDto {
  @IsEnum(UnitType)
  type: UnitType;

  @IsInt()
  @Min(1)
  amount: number;
}

@Controller('units')
@UseGuards(JwtAuthGuard)
export class UnitsController {
  constructor(
    private unitsService: UnitsService,
    private kingdomService: KingdomService,
  ) {}

  @Post('train')
  async train(@Request() req, @Body() dto: TrainDto) {
    const myKingdom = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.unitsService.trainUnits(myKingdom.kingdom.id, dto.type, dto.amount);
  }
}
