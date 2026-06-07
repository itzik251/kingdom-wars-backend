import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EconomyService } from './economy.service';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Building } from '../building/building.entity';
import { Unit } from '../units/unit.entity';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([Kingdom, Building, Unit]), forwardRef(() => NotificationModule)],
  providers: [EconomyService],
  exports: [EconomyService],
})
export class EconomyModule {}
