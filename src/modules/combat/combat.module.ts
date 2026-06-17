import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CombatController } from './combat.controller';
import { CombatService } from './combat.service';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Unit } from '../units/unit.entity';
import { Building } from '../building/building.entity';
import { User } from '../user/user.entity';
import { AllianceMember } from '../alliance/alliance-member.entity';
import { EconomyModule } from '../economy/economy.module';
import { KingdomModule } from '../kingdom/kingdom.module';
import { NotificationModule } from '../notifications/notification.module';
import { QuestModule } from '../quest/quest.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Kingdom, Unit, Building, User, AllianceMember]), EconomyModule, KingdomModule, NotificationModule, QuestModule, AuditModule],
  controllers: [CombatController],
  providers: [CombatService],
})
export class CombatModule {}
