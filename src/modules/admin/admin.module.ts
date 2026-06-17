import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { NotificationModule } from '../notifications/notification.module';
import { TonModule } from '../ton/ton.module';
import { AuditModule } from '../audit/audit.module';
import { ExplorationModule } from '../exploration/exploration.module';
import { WithdrawalModule } from '../withdrawal/withdrawal.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Kingdom]),
    NotificationModule,
    TonModule,
    AuditModule,
    ExplorationModule,
    WithdrawalModule,
  ],
  controllers: [AdminController],
  providers: [],
})
export class AdminModule {}
