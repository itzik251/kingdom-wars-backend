import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) {}

  @Get()
  getTop(@Query('all') all?: string) {
    return this.leaderboardService.getTop(50, all === 'true');
  }

  @Post('reset-scores')
  resetScores() {
    return this.leaderboardService.resetAllScores();
  }
}
