import { Controller, Post, Body, UseGuards, Request, Get, Query, Param } from '@nestjs/common';
import { IsUUID, IsOptional, IsString, IsObject } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AntiBotGuard, AntiBotAction } from '../antibot/antibot.guard';
import { CombatService } from './combat.service';
import { KingdomService } from '../kingdom/kingdom.service';
import { QuestService } from '../quest/quest.service';

class AttackDto {
  @IsUUID()
  defenderKingdomId: string;

  @IsOptional()
  @IsString()
  heroType?: string;

  @IsOptional()
  @IsObject()
  squad?: Record<string, number>;
}

@Controller('combat')
@UseGuards(JwtAuthGuard)
export class CombatController {
  constructor(
    private combatService: CombatService,
    private kingdomService: KingdomService,
    private questService: QuestService,
  ) {}

  @Post('attack')
  @UseGuards(AntiBotGuard)
  @AntiBotAction('combat_attack')
  async attack(@Request() req, @Body() dto: AttackDto) {
    const myKingdom = await this.kingdomService.getKingdomByUser(req.user.userId);
    const report = await this.combatService.attack(myKingdom.kingdom.id, dto.defenderKingdomId, dto.heroType, dto.squad);

    const kid = myKingdom.kingdom.id;
    await Promise.all([
      this.questService.incrementQuest(kid, 'perform_attack', 1),
      report.loot?.gold > 0
        ? this.questService.incrementQuest(kid, 'collect_gold_1000', report.loot.gold)
        : Promise.resolve(),
      report.attackerWins
        ? this.questService.incrementQuest(kid, 'win_20_battles', 1)
        : Promise.resolve(),
    ]).catch(() => {});

    return report;
  }

  // List potential attack targets (excludes shielded, excludes self)
  @Get('targets')
  async getTargets(@Request() req) {
    const myKingdom = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.combatService.getTargets(myKingdom.kingdom);
  }

  // Full intel profile for a target kingdom before attacking
  @Get('profile/:kingdomId')
  async getProfile(@Request() req, @Param('kingdomId') targetId: string) {
    const myKingdom = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.combatService.getKingdomProfile(myKingdom.kingdom.id, targetId);
  }
}
