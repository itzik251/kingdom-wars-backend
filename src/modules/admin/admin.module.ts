import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { NotificationModule } from '../notifications/notification.module';
import { TonModule } from '../ton/ton.module';
import { CryptoBotService } from '../cryptobot/cryptobot.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Kingdom]),
    NotificationModule,
    TonModule,
    AuditModule,
  ],
  controllers: [AdminController],
  providers: [CryptoBotService],
})
export class AdminModule {}
