import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Building } from '../building/building.entity';
import { Unit, UnitType } from '../units/unit.entity';
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
    // Dev bypass — supports 'dev' or 'dev_1'..'dev_5'
    if (this.config.get('NODE_ENV') !== 'production' && initData.startsWith('dev')) {
      const idx = initData === 'dev' ? 1 : (parseInt(initData.replace('dev_', ''), 10) || 1);
      const names = ['', 'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack', 'Kate'];
      const name = names[idx] || `Dev${idx}`;
      return {
        user: JSON.stringify({ id: 100000000 + idx, username: `dev_user_${idx}`, first_name: name }),
        auth_date: String(Math.floor(Date.now() / 1000)),
      };
    }

    // Parse raw pairs to preserve original encoding for hash verification
    const pairs = initData.split('&').map(p => {
      const eq = p.indexOf('=');
      return { key: decodeURIComponent(p.slice(0, eq)), value: decodeURIComponent(p.slice(eq + 1)) };
    });
    const hash = pairs.find(p => p.key === 'hash')?.value;
    if (!hash) throw new UnauthorizedException('Missing hash');

    const dataCheckString = pairs
      .filter(p => p.key !== 'hash')
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(p => `${p.key}=${p.value}`)
      .join('\n');

    const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      throw new UnauthorizedException('Invalid Telegram data signature');
    }

    const params = new URLSearchParams(initData);
    // Check data freshness (24 hours max)
    const authDate = parseInt(params.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) throw new UnauthorizedException('Telegram data expired');

    return Object.fromEntries(params.entries());
  }

  async loginOrRegister(initData: string, referralCode?: string) {
    const data = this.validateTelegramData(initData);
    const tgUser = JSON.parse(data.user);

    let user = await this.userRepo.findOne({
      where: { telegramId: String(tgUser.id) },
      relations: ['referredBy'],
    });

    let isNewUser = false;
    if (!user) {
      user = await this.createNewUser(tgUser, referralCode);
      isNewUser = true;
    } else {
      user.lastLogin = new Date();
      if (tgUser.language_code) user.language = tgUser.language_code.slice(0, 2);
      // Apply referral if the user has no referrer yet and a valid code was passed
      if (!user.referredBy && referralCode) {
        const referrer = await this.userRepo.findOne({ where: { referralCode } });
        if (referrer && referrer.id !== user.id) {
          user.referredBy = referrer;
        }
      }
      await this.userRepo.save(user);
    }

    const token = this.jwtService.sign({ sub: user.id, telegramId: user.telegramId });
    return { token, userId: user.id, termsAccepted: !!user.termsAcceptedAt, isNewUser };
  }

  private async createNewUser(tgUser: any, referralCode?: string) {
    let referredBy: User | null = null;
    if (referralCode) {
      referredBy = await this.userRepo.findOne({ where: { referralCode } });
    }

    const user = this.userRepo.create({
      telegramId: String(tgUser.id),
      username: tgUser.username,
      firstName: tgUser.first_name,
      language: tgUser.language_code ? tgUser.language_code.slice(0, 2) : 'en',
      referralCode: this.generateReferralCode(),
      referredBy,
      lastLogin: new Date(),
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

    // Create unit slots — knight starts at 1 (free starter hero), others at 0
    await this.unitRepo.save(
      INITIAL_UNITS.map((type) =>
        this.unitRepo.create({ kingdom, type, count: type === UnitType.KNIGHT ? 1 : 0 }),
      ),
    );

    return user;
  }

  async acceptTerms(userId: string) {
    await this.userRepo.update({ id: userId }, { termsAcceptedAt: new Date() });
    return { accepted: true };
  }

  async setLanguage(userId: string, language: string) {
    const VALID_LANGS = ['en', 'he', 'es', 'fr', 'de', 'ru', 'pt', 'ar'];
    const lang = VALID_LANGS.includes(language) ? language : 'en';
    await this.userRepo.update({ id: userId }, { language: lang });
    return { language: lang };
  }

  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }
}
