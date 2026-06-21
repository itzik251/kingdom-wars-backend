import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TradeService } from './trade.service';
import { KingdomService } from '../kingdom/kingdom.service';
import { ResourceType } from './trade-offer.entity';

class CreateOfferDto {
  giveType: ResourceType;
  giveAmount: number;
  wantType: ResourceType;
  wantAmount: number;
}

@Controller('trade')
@UseGuards(JwtAuthGuard)
export class TradeController {
  constructor(
    private tradeService: TradeService,
    private kingdomService: KingdomService,
  ) {}

  @Get('offers')
  async listOffers(@Request() req) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.tradeService.listOffers(kingdom.id);
  }

  @Post('offers')
  async createOffer(@Request() req, @Body() dto: CreateOfferDto) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.tradeService.createOffer(kingdom.id, dto.giveType, dto.giveAmount, dto.wantType, dto.wantAmount);
  }

  @Post('offers/:id/accept')
  async acceptOffer(@Request() req, @Param('id') offerId: string) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.tradeService.acceptOffer(kingdom.id, offerId);
  }

  @Delete('offers/:id')
  async cancelOffer(@Request() req, @Param('id') offerId: string) {
    const { kingdom } = await this.kingdomService.getKingdomByUser(req.user.userId);
    return this.tradeService.cancelOffer(kingdom.id, offerId);
  }
}
