import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllianceController } from './alliance.controller';
import { AllianceService } from './alliance.service';
import { Alliance } from './alliance.entity';
import { AllianceMember } from './alliance-member.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { KingdomModule } from '../kingdom/kingdom.module';

@Module({
  imports: [TypeOrmModule.forFeature([Alliance, AllianceMember, Kingdom]), KingdomModule],
  controllers: [AllianceController],
  providers: [AllianceService],
})
export class AllianceModule {}
