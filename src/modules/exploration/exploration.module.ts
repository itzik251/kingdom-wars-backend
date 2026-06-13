import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MapNode } from './map-node.entity';
import { ExplorationMission } from './exploration-mission.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Building } from '../building/building.entity';
import { Unit } from '../units/unit.entity';
import { ExplorationService } from './exploration.service';
import { ExplorationController } from './exploration.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MapNode, ExplorationMission, Kingdom, Building, Unit])],
  providers: [ExplorationService],
  controllers: [ExplorationController],
  exports: [ExplorationService],
})
export class ExplorationModule {}
