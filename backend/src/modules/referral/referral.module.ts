import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReferralController } from './referral.controller';
import { ReferralService } from './referral.service';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Kingdom])],
  controllers: [ReferralController],
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}
