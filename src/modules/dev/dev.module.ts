import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevController } from './dev.controller';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Building } from '../building/building.entity';
import { Unit } from '../units/unit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Kingdom, Building, Unit])],
  controllers: [DevController],
})
export class DevModule {}
