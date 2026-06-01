import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EconomyService } from './economy.service';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Building } from '../building/building.entity';
import { Unit } from '../units/unit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Kingdom, Building, Unit])],
  providers: [EconomyService],
  exports: [EconomyService],
})
export class EconomyModule {}
