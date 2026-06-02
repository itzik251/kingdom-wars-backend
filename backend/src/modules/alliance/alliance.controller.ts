import { Controller, Get, Post, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { IsString, MaxLength, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AllianceService } from './alliance.service';
import { KingdomService } from '../kingdom/kingdom.service';

class CreateAllianceDto {
  @IsString() @MaxLength(64) name: string;
  @IsString() @MaxLength(6)  tag: string;
  @IsString() @IsOptional()  description?: string;
}

class JoinAllianceDto {
  @IsString() allianceId: string;
}

@Controller('alliances')
@UseGuards(JwtAuthGuard)
export class AllianceController {
  constructor(
    private allianceService: AllianceService,
    private kingdomService: KingdomService,
  ) {}

  @Get()
  list() {
    return this.allianceService.listAlliances();
  }

  @Get('mine')
  async getMine(@Request() req) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.allianceService.getMyAlliance(kingdom.id);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateAllianceDto) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.allianceService.create(kingdom.id, dto.name, dto.tag, dto.description);
  }

  @Post('join')
  async join(@Request() req, @Body() dto: JoinAllianceDto) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.allianceService.join(kingdom.id, dto.allianceId);
  }

  @Delete('leave')
  async leave(@Request() req) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.allianceService.leave(kingdom.id);
  }
}
