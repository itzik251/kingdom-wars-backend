import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { TronService } from './tron.service';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Kingdom]),
    NotificationModule,
  ],
  controllers: [AdminController],
  providers: [TronService],
})
export class AdminModule {}
