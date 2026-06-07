import { Controller, Get, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdsService } from './ads.service';
import { KingdomService } from '../kingdom/kingdom.service';

class RewardDto {
  @IsEnum(['double_production', 'gems', 'gold_bonus', 'wood_bonus', 'stone_bonus', 'food_bonus'])
  type: 'double_production' | 'gems' | 'gold_bonus' | 'wood_bonus' | 'stone_bonus' | 'food_bonus';

  // AdsGram passes a token to verify the ad was actually watched
  @IsString()
  @IsOptional()
  adsgramToken?: string;
}

@Controller('ads')
@UseGuards(JwtAuthGuard)
export class AdsController {
  constructor(
    private adsService: AdsService,
    private kingdomService: KingdomService,
  ) {}

  @Get('status')
  async getStatus(@Request() req) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.adsService.getBoostStatus(kingdom.id);
  }

  @Post('reward')
  async claimReward(@Request() req, @Body() dto: RewardDto) {
    // Verify with AdsGram that the ad was actually watched
    if (dto.adsgramToken) {
      const valid = await this.adsService.verifyAdsgramToken(dto.adsgramToken);
      if (!valid) throw new BadRequestException('AD_NOT_VERIFIED');
    }
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.adsService.claimReward(req.user.userId, kingdom.id, dto.type);
  }
}
