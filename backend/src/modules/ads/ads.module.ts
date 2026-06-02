import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';
import { Kingdom } from '../kingdom/kingdom.entity';
import { KingdomModule } from '../kingdom/kingdom.module';

@Module({
  imports: [TypeOrmModule.forFeature([Kingdom]), KingdomModule],
  controllers: [AdsController],
  providers: [AdsService],
})
export class AdsModule {}
