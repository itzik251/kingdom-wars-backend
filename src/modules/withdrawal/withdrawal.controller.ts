import { Controller, Post, Get, Param, Body, Request, UseGuards } from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('withdrawal')
export class WithdrawalController {
  constructor(private service: WithdrawalService) {}

  @UseGuards(JwtAuthGuard)
  @Post('request')
  async request(@Request() req: any, @Body() body: { amount: number; walletAddress: string }) {
    return this.service.request(req.user.id, body.amount, body.walletAddress);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  async history(@Request() req: any) {
    return this.service.getUserHistory(req.user.id);
  }
}
