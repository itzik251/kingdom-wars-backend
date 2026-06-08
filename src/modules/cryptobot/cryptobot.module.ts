import { Module } from '@nestjs/common';
import { CryptoBotService } from './cryptobot.service';

@Module({
  providers: [CryptoBotService],
  exports: [CryptoBotService],
})
export class CryptoBotModule {}
