import { Controller, Get, Post, Query, Headers, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getTop(@Query('all') all?: string) {
    return this.leaderboardService.getTop(50, all === 'true');
  }

  @Post('reset-scores')
  resetScores(@Headers('x-admin-key') key: string) {
    if (key !== 'kw-reset-2026') throw new UnauthorizedException();
    return this.leaderboardService.resetAllScores();
  }
}
