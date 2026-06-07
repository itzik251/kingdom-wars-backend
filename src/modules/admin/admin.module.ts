import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Kingdom])],
  controllers: [AdminController],
})
export class AdminModule {}
