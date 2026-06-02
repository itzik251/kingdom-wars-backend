import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Building } from '../building/building.entity';
import { Unit } from '../units/unit.entity';
import { INITIAL_BUILDINGS, INITIAL_UNITS } from '../../constants/game.constants';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
    @InjectRepository(Building) private buildingRepo: Repository<Building>,
    @InjectRepository(Unit) private unitRepo: Repository<Unit>,
  ) {}

  // Validate Telegram WebApp initData
  // https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
  validateTelegramData(initData: string): Record<string, string> {
    // Dev bypass
    if (this.config.get('NODE_ENV') !== 'production' && initData === 'dev') {
      return {
        user: JSON.stringify({ id: 123456789, username: 'dev_user', first_name: 'Dev' }),
        auth_date: String(Math.floor(Date.now() / 1000)),
      };
    }

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) throw new UnauthorizedException('Missing hash');

    params.delete('hash');
    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    console.log('Hash check:', { received: hash?.substring(0,10), calculated: calculatedHash?.substring(0,10), match: calculatedHash === hash });
    if (calculatedHash !== hash) throw new UnauthorizedException('Invalid Telegram data');

    // Check data freshness (24 hours max)
    const authDate = parseInt(params.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) throw new UnauthorizedException('Telegram data expired');

    return Object.fromEntries(params.entries());
  }

  async loginOrRegister(initData: string, referralCode?: string) {
    const data = this.validateTelegramData(initData);
    const tgUser = JSON.parse(data.user);

    let user = await this.userRepo.findOne({ where: { telegramId: tgUser.id } });

    if (!user) {
      user = await this.createNewUser(tgUser, referralCode);
    } else {
      user.lastLogin = new Date();
      await this.userRepo.save(user);
    }

    const token = this.jwtService.sign({ sub: user.id, telegramId: user.telegramId });
    return { token, userId: user.id };
  }

  private async createNewUser(tgUser: any, referralCode?: string) {
    let referredBy: User | null = null;
    if (referralCode) {
      referredBy = await this.userRepo.findOne({ where: { referralCode } });
    }

    const user = this.userRepo.create({
      telegramId: tgUser.id,
      username: tgUser.username,
      firstName: tgUser.first_name,
      referralCode: this.generateReferralCode(),
      referredBy,
    });
    await this.userRepo.save(user);

    // Create kingdom
    const kingdom = this.kingdomRepo.create({
      user,
      name: `${tgUser.first_name}'s Kingdom`,
      // 72-hour newbie shield
      shieldUntil: new Date(Date.now() + 72 * 60 * 60 * 1000),
    });
    await this.kingdomRepo.save(kingdom);

    // Create initial buildings (all at level 1)
    await this.buildingRepo.save(
      INITIAL_BUILDINGS.map((type) =>
        this.buildingRepo.create({ kingdom, type, level: 1 }),
      ),
    );

    // Create unit slots (all at 0)
    await this.unitRepo.save(
      INITIAL_UNITS.map((type) =>
        this.unitRepo.create({ kingdom, type, count: 0 }),
      ),
    );

    return user;
  }

  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }
}
