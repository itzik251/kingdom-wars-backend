import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorldEvent, WorldEventRegistration } from './world-event.entity';
import { WorldEventService } from './world-event.service';
import { WorldEventController } from './world-event.controller';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Unit } from '../units/unit.entity';
import { Building } from '../building/building.entity';
import { User } from '../user/user.entity';
import { NotificationModule } from '../notifications/notification.module';
import { KingdomModule } from '../kingdom/kingdom.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorldEvent, WorldEventRegistration, Kingdom, Unit, Building, User]),
    NotificationModule,
    KingdomModule,
  ],
  controllers: [WorldEventController],
  providers: [WorldEventService],
  exports: [WorldEventService],
})
export class WorldEventModule {}
