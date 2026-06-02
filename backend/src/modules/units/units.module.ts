import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitsController } from './units.controller';
import { UnitsService } from './units.service';
import { Unit } from './unit.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Building } from '../building/building.entity';
import { KingdomModule } from '../kingdom/kingdom.module';

@Module({
  imports: [TypeOrmModule.forFeature([Unit, Kingdom, Building]), KingdomModule],
  controllers: [UnitsController],
  providers: [UnitsService],
})
export class UnitsModule {}
