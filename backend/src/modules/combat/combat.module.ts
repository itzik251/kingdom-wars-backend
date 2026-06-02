import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CombatController } from './combat.controller';
import { CombatService } from './combat.service';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Unit } from '../units/unit.entity';
import { Building } from '../building/building.entity';
import { User } from '../user/user.entity';
import { EconomyModule } from '../economy/economy.module';
import { KingdomModule } from '../kingdom/kingdom.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([Kingdom, Unit, Building, User]), EconomyModule, KingdomModule, NotificationModule],
  controllers: [CombatController],
  providers: [CombatService],
})
export class CombatModule {}
