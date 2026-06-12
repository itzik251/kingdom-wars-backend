import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './modules/auth/auth.module';
import { KingdomModule } from './modules/kingdom/kingdom.module';
import { BuildingModule } from './modules/building/building.module';
import { CombatModule } from './modules/combat/combat.module';
import { AllianceModule } from './modules/alliance/alliance.module';
import { EconomyModule } from './modules/economy/economy.module';
import { UnitsModule } from './modules/units/units.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { QuestModule } from './modules/quest/quest.module';
import { ReferralModule } from './modules/referral/referral.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { VipModule } from './modules/vip/vip.module';
import { AdsModule } from './modules/ads/ads.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { AdminModule } from './modules/admin/admin.module';
import { CryptoBotFullModule } from './modules/cryptobot/cryptobot.full.module';
import { AntiBotModule } from './modules/antibot/antibot.module';
import { DevModule } from './modules/dev/dev.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDev = config.get('NODE_ENV') !== 'production';
        if (isDev) {
          return {
            type: 'sqljs',
            location: 'kingdom_wars_dev.db',
            autoSave: true,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true,
            logging: false,
          } as any;
        }
        return {
          type: 'postgres',
          url: config.get('DATABASE_URL'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: false,
          logging: false,
          ssl: { rejectUnauthorized: false },
          extra: { max: 15, idleTimeoutMillis: 30000 },
        };
      },
    }),

    ScheduleModule.forRoot(),

    AuthModule,
    KingdomModule,
    BuildingModule,
    CombatModule,
    AllianceModule,
    EconomyModule,
    UnitsModule,
    LeaderboardModule,
    QuestModule,
    ReferralModule,
    NotificationModule,
    VipModule,
    AdsModule,
    TelegramModule,
    AdminModule,
    CryptoBotFullModule,
    AntiBotModule,
    DevModule,
  ],
})
export class AppModule {}
