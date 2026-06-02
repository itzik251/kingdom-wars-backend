import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestController } from './quest.controller';
import { QuestService } from './quest.service';
import { Quest } from './quest.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { KingdomModule } from '../kingdom/kingdom.module';
import { EconomyModule } from '../economy/economy.module';

@Module({
  imports: [TypeOrmModule.forFeature([Quest, Kingdom]), KingdomModule, EconomyModule],
  controllers: [QuestController],
  providers: [QuestService],
  exports: [QuestService],
})
export class QuestModule {}
