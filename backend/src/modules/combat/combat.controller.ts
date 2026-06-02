import { Controller, Post, Body, UseGuards, Request, Get, Query } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CombatService } from './combat.service';
import { KingdomService } from '../kingdom/kingdom.service';

class AttackDto {
  @IsUUID()
  defenderKingdomId: string;
}

@Controller('combat')
@UseGuards(JwtAuthGuard)
export class CombatController {
  constructor(
    private combatService: CombatService,
    private kingdomService: KingdomService,
  ) {}

  @Post('attack')
  async attack(@Request() req, @Body() dto: AttackDto) {
    const myKingdom = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.combatService.attack(myKingdom.kingdom.id, dto.defenderKingdomId);
  }

  // List potential attack targets (excludes shielded, excludes self)
  @Get('targets')
  async getTargets(@Request() req) {
    const myKingdom = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.combatService.getTargets(myKingdom.kingdom);
  }
}
