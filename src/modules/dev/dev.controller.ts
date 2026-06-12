import { Controller, Post, Get, Param, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Building, BuildingType } from '../building/building.entity';
import { Unit, UnitType } from '../units/unit.entity';
import { INITIAL_BUILDINGS, INITIAL_UNITS } from '../../constants/game.constants';

const DEV_USERS = [
  { id: 100000001, username: 'dev_alice',   firstName: 'Alice'   },
  { id: 100000002, username: 'dev_bob',     firstName: 'Bob'     },
  { id: 100000003, username: 'dev_charlie', firstName: 'Charlie' },
  { id: 100000004, username: 'dev_diana',   firstName: 'Diana'   },
  { id: 100000005, username: 'dev_eve',     firstName: 'Eve'     },
  { id: 100000006, username: 'dev_frank',   firstName: 'Frank'   },
  { id: 100000007, username: 'dev_grace',   firstName: 'Grace'   },
  { id: 100000008, username: 'dev_henry',   firstName: 'Henry'   },
  { id: 100000009, username: 'dev_iris',    firstName: 'Iris'    },
  { id: 100000010, username: 'dev_jack',    firstName: 'Jack'    },
  { id: 100000011, username: 'dev_kate',    firstName: 'Kate'    },
];

@Controller('dev')
export class DevController {
  constructor(
    private config: ConfigService,
    @InjectRepository(User)     private userRepo:     Repository<User>,
    @InjectRepository(Kingdom)  private kingdomRepo:  Repository<Kingdom>,
    @InjectRepository(Building) private buildingRepo: Repository<Building>,
    @InjectRepository(Unit)     private unitRepo:     Repository<Unit>,
  ) {}

  private guard() {
    if (this.config.get('NODE_ENV') === 'production') {
      throw new ForbiddenException('Dev endpoints are disabled in production');
    }
  }

  @Get('status')
  status() {
    this.guard();
    return { dev: true, users: DEV_USERS.map(u => u.firstName) };
  }

  @Post('seed')
  async seed() {
    this.guard();

    const results: string[] = [];

    for (const tgUser of DEV_USERS) {
      const telegramId = String(tgUser.id);
      let user = await this.userRepo.findOne({ where: { telegramId } });

      const isNew = !user;
      if (!user) {
        user = this.userRepo.create({
          telegramId,
          username: tgUser.username,
          firstName: tgUser.firstName,
          language: 'he',
          referralCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
          lastLogin: new Date(),
          termsAcceptedAt: new Date(),
        });
        await this.userRepo.save(user);
      }

      let kingdom = await this.kingdomRepo.findOne({ where: { user: { id: user.id } } });
      if (!kingdom) {
        kingdom = this.kingdomRepo.create({
          user,
          name: `${tgUser.firstName}'s Kingdom`,
          shieldUntil: null, // no shield — attackable
          gold: 50000,
          wood: 30000,
          stone: 20000,
          food: 10000,
          gems: 500,
          score: 100,
        });
        await this.kingdomRepo.save(kingdom);

        // Buildings
        await this.buildingRepo.save(
          INITIAL_BUILDINGS.map(type =>
            this.buildingRepo.create({ kingdom, type, level: type === BuildingType.BARRACKS ? 3 : 2 }),
          ),
        );

        // Units — soldiers for testing
        const unitCounts: Partial<Record<UnitType, number>> = {
          [UnitType.SPEARMAN]:  100,
          [UnitType.ARCHER]:     80,
          [UnitType.SWORDSMAN]:  50,
          [UnitType.CAVALRY]:    30,
          [UnitType.CATAPULT]:   10,
        };
        await this.unitRepo.save(
          INITIAL_UNITS.map(type =>
            this.unitRepo.create({ kingdom, type, count: unitCounts[type] ?? 0 }),
          ),
        );

        results.push(`✅ ${tgUser.firstName}: נוצר`);
      } else {
        // Refresh existing kingdom resources & remove shield
        kingdom.shieldUntil = null;
        kingdom.gold  = Math.max(kingdom.gold,  50000);
        kingdom.wood  = Math.max(kingdom.wood,  30000);
        kingdom.stone = Math.max(kingdom.stone, 20000);
        kingdom.food  = Math.max(kingdom.food,  10000);
        kingdom.gems  = Math.max(kingdom.gems,    500);
        kingdom.score = Math.max(kingdom.score,   100);
        await this.kingdomRepo.save(kingdom);

        const units = await this.unitRepo.find({ where: { kingdom: { id: kingdom.id } } });
        const boosts: Partial<Record<string, number>> = {
          spearman: 100, archer: 80, swordsman: 50, cavalry: 30, catapult: 10,
        };
        for (const unit of units) {
          const boost = boosts[unit.type];
          if (boost) unit.count = Math.max(unit.count, boost);
        }
        await this.unitRepo.save(units);

        results.push(`🔄 ${tgUser.firstName}: ${isNew ? 'נוצר' : 'עודכן'}`);
      }
    }

    return { ok: true, results };
  }

  // Give a specific dev user VIP + heroes + max referrals for testing
  @Post('boost/:userIdx')
  async boost(@Param('userIdx') userIdx: string) {
    this.guard();
    const idx = parseInt(userIdx, 10) || 1;
    const tgUser = DEV_USERS[idx - 1];
    if (!tgUser) return { ok: false, error: 'invalid idx' };

    const user = await this.userRepo.findOne({ where: { telegramId: String(tgUser.id) } });
    if (!user) return { ok: false, error: 'user not found — run /seed first' };

    // Give VIP + max referrals claimed
    user.referralClaimedCount = 10;
    user.claimedReferralMilestones = [1, 3, 5, 10] as any;
    await this.userRepo.save(user);

    const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: user.id } } });
    if (!kingdom) return { ok: false, error: 'kingdom not found' };

    // VIP for 30 days + max resources + gems
    kingdom.vipExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    kingdom.gold  = 999999;
    kingdom.wood  = 999999;
    kingdom.stone = 999999;
    kingdom.food  = 99999;
    kingdom.gems  = 9999;
    kingdom.score = 5000;
    kingdom.shieldUntil = null;
    await this.kingdomRepo.save(kingdom);

    // Give all heroes
    const units = await this.unitRepo.find({ where: { kingdom: { id: kingdom.id } } });
    const heroBoosts: Partial<Record<string, number>> = {
      knight: 1, paladin: 1, dragon_rider: 1, ragnar: 1, titan: 1,
      spearman: 200, archer: 150, swordsman: 100, cavalry: 60, catapult: 20, elite_guard: 10,
    };
    for (const unit of units) {
      const boost = heroBoosts[unit.type];
      if (boost !== undefined) unit.count = boost;
    }
    await this.unitRepo.save(units);

    // Simulate 10 referrals by making other dev users refer to this user
    const otherUsers = DEV_USERS.filter(u => u.id !== tgUser.id);
    for (const other of otherUsers) {
      const otherUser = await this.userRepo.findOne({ where: { telegramId: String(other.id) } });
      if (otherUser && !otherUser.referredBy) {
        otherUser.referredBy = user;
        await this.userRepo.save(otherUser);
      }
    }

    return { ok: true, message: `${tgUser.firstName} boosted: VIP 30d, all heroes, 10 referrals, max resources` };
  }
}
