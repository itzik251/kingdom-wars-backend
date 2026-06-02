import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReferralService } from './referral.service';

@Controller('referral')
@UseGuards(JwtAuthGuard)
export class ReferralController {
  constructor(private referralService: ReferralService) {}

  @Get()
  getStats(@Request() req) {
    return this.referralService.getStats(req.user.userId);
  }

  @Post('claim/:count')
  claim(@Request() req, @Param('count') count: string) {
    return this.referralService.claimMilestone(req.user.userId, parseInt(count));
  }
}
