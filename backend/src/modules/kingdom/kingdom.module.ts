import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KingdomController } from './kingdom.controller';
import { KingdomService } from './kingdom.service';
import { Kingdom } from './kingdom.entity';
import { Building } from '../building/building.entity';
import { Unit } from '../units/unit.entity';
import { EconomyModule } from '../economy/economy.module';

@Module({
  imports: [TypeOrmModule.forFeature([Kingdom, Building, Unit]), EconomyModule],
  controllers: [KingdomController],
  providers: [KingdomService],
  exports: [KingdomService],
})
export class KingdomModule {}
