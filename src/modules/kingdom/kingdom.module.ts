import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KingdomController } from './kingdom.controller';
import { KingdomService } from './kingdom.service';
import { Kingdom } from './kingdom.entity';
import { Building } from '../building/building.entity';
import { Unit } from '../units/unit.entity';
import { User } from '../user/user.entity';
import { EconomyModule } from '../economy/economy.module';
import { NotificationModule } from '../notifications/notification.module';
import { AuditModule } from '../audit/audit.module';
import { WithdrawalModule } from '../withdrawal/withdrawal.module';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Kingdom, Building, Unit, User]), EconomyModule, NotificationModule, AuditModule, WithdrawalModule],
  controllers: [KingdomController],
  providers: [KingdomService],
  exports: [KingdomService],
})
export class KingdomModule {}
