import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VipService } from './vip.service';

class ActivateDto {
  @IsString() tonTxHash: string;
}

@Controller('vip')
@UseGuards(JwtAuthGuard)
export class VipController {
  constructor(private vipService: VipService) {}

  @Get()
  getStatus(@Request() req) {
    return this.vipService.getStatus(req.user.userId);
  }

  @Post('activate')
  activate(@Request() req, @Body() dto: ActivateDto) {
    return this.vipService.activateVip(req.user.userId, dto.tonTxHash);
  }
}
