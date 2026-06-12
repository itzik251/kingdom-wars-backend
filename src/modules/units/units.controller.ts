import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { IsEnum, IsInt, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AntiBotGuard, AntiBotAction } from '../antibot/antibot.guard';
import { UnitsService } from './units.service';
import { UnitType } from './unit.entity';
import { KingdomService } from '../kingdom/kingdom.service';
import { QuestService } from '../quest/quest.service';

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
    private questService: QuestService,
  ) {}

  @Post('train')
  @UseGuards(AntiBotGuard)
  @AntiBotAction('units_train')
  async train(@Request() req, @Body() dto: TrainDto) {
    const myKingdom = await this.kingdomService.getKingdomByUser(req.user.userId);
    const result = await this.unitsService.trainUnits(myKingdom.kingdom.id, dto.type, dto.amount);
    await this.questService.incrementQuest(myKingdom.kingdom.id, 'train_500_soldiers', dto.amount).catch(() => {});
    return result;
  }
}
