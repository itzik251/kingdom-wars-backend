import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VipController } from './vip.controller';
import { VipService } from './vip.service';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { TonModule } from '../ton/ton.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Kingdom]), TonModule],
  controllers: [VipController],
  providers: [VipService],
  exports: [VipService],
})
export class VipModule {}
