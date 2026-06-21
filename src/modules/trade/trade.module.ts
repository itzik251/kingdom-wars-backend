import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TradeController } from './trade.controller';
import { TradeService } from './trade.service';
import { TradeOffer } from './trade-offer.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Building } from '../building/building.entity';
import { AllianceMember } from '../alliance/alliance-member.entity';
import { KingdomModule } from '../kingdom/kingdom.module';

@Module({
  imports: [TypeOrmModule.forFeature([TradeOffer, Kingdom, Building, AllianceMember]), KingdomModule],
  controllers: [TradeController],
  providers: [TradeService],
})
export class TradeModule {}
