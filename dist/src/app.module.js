"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const auth_module_1 = require("./modules/auth/auth.module");
const kingdom_module_1 = require("./modules/kingdom/kingdom.module");
const building_module_1 = require("./modules/building/building.module");
const combat_module_1 = require("./modules/combat/combat.module");
const alliance_module_1 = require("./modules/alliance/alliance.module");
const economy_module_1 = require("./modules/economy/economy.module");
const units_module_1 = require("./modules/units/units.module");
const leaderboard_module_1 = require("./modules/leaderboard/leaderboard.module");
const quest_module_1 = require("./modules/quest/quest.module");
const referral_module_1 = require("./modules/referral/referral.module");
const notification_module_1 = require("./modules/notifications/notification.module");
const vip_module_1 = require("./modules/vip/vip.module");
const ads_module_1 = require("./modules/ads/ads.module");
const telegram_module_1 = require("./modules/telegram/telegram.module");
const admin_module_1 = require("./modules/admin/admin.module");
const antibot_module_1 = require("./modules/antibot/antibot.module");
const dev_module_1 = require("./modules/dev/dev.module");
const exploration_module_1 = require("./modules/exploration/exploration.module");
const withdrawal_module_1 = require("./modules/withdrawal/withdrawal.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const isDev = config.get('NODE_ENV') !== 'production';
                    if (isDev) {
                        return {
                            type: 'sqljs',
                            location: 'kingdom_wars_dev.db',
                            autoSave: true,
                            entities: [__dirname + '/**/*.entity{.ts,.js}'],
                            synchronize: true,
                            logging: false,
                        };
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
            schedule_1.ScheduleModule.forRoot(),
            auth_module_1.AuthModule,
            kingdom_module_1.KingdomModule,
            building_module_1.BuildingModule,
            combat_module_1.CombatModule,
            alliance_module_1.AllianceModule,
            economy_module_1.EconomyModule,
            units_module_1.UnitsModule,
            leaderboard_module_1.LeaderboardModule,
            quest_module_1.QuestModule,
            referral_module_1.ReferralModule,
            notification_module_1.NotificationModule,
            vip_module_1.VipModule,
            ads_module_1.AdsModule,
            telegram_module_1.TelegramModule,
            admin_module_1.AdminModule,
            antibot_module_1.AntiBotModule,
            dev_module_1.DevModule,
            exploration_module_1.ExplorationModule,
            withdrawal_module_1.WithdrawalModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map