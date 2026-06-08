import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptoBotService } from './cryptobot.service';
import { CryptoBotController } from './cryptobot.controller';
import { VipModule } from '../vip/vip.module';
import { Kingdom } from '../kingdom/kingdom.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Kingdom]), VipModule],
  providers: [CryptoBotService],
  controllers: [CryptoBotController],
  exports: [CryptoBotService],
})
export class CryptoBotFullModule {}
