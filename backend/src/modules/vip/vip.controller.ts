import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { IsString, IsOptional } from 'class-validator';
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

  @Post('purchase-with-usdt')
  purchaseWithUsdt(@Request() req) {
    return this.vipService.purchaseWithUsdt(req.user.userId);
  }

  @Get('payment-info')
  getPaymentInfo() {
    return this.vipService.getPaymentInfo();
  }

  @Get('invoice')
  getInvoice() {
    // Legacy endpoint — redirect to payment-info
    return this.vipService.getPaymentInfo();
  }
}
