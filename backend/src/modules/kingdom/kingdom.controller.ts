import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { KingdomService } from './kingdom.service';

@Controller('kingdom')
@UseGuards(JwtAuthGuard)
export class KingdomController {
  constructor(private kingdomService: KingdomService) {}

  @Get()
  getMyKingdom(@Request() req) {
    return this.kingdomService.getKingdomByUser(req.user.userId);
  }
}
