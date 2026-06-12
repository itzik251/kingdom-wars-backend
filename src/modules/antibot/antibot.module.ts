import { Module, Global } from '@nestjs/common';
import { AntiBotService } from './antibot.service';
import { AntiBotGuard } from './antibot.guard';

@Global()  // Make available everywhere without re-importing
@Module({
  providers: [AntiBotService, AntiBotGuard],
  exports: [AntiBotService, AntiBotGuard],
})
export class AntiBotModule {}
