import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Withdrawal } from './withdrawal.entity';
import { WithdrawalService } from './withdrawal.service';
import { WithdrawalController } from './withdrawal.controller';
import { Kingdom } from '../kingdom/kingdom.entity';
import { TonModule } from '../ton/ton.module';

@Module({
  imports: [TypeOrmModule.forFeature([Withdrawal, Kingdom]), TonModule],
  controllers: [WithdrawalController],
  providers: [WithdrawalService],
  exports: [WithdrawalService],
})
export class WithdrawalModule {}
