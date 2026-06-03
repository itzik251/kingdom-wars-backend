import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuildingController } from './building.controller';
import { BuildingService } from './building.service';
import { Building } from './building.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { KingdomModule } from '../kingdom/kingdom.module';
import { QuestModule } from '../quest/quest.module';

@Module({
  imports: [TypeOrmModule.forFeature([Building, Kingdom]), KingdomModule, QuestModule],
  controllers: [BuildingController],
  providers: [BuildingService],
  exports: [BuildingService],
})
export class BuildingModule {}
