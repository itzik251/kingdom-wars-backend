import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
    private config: ConfigService,
  ) {}

  async create(userId: string, type: string, payload: Record<string, any>) {
    const notif = this.notifRepo.create({ user: { id: userId } as any, type, payload });
    await this.notifRepo.save(notif);

    // Fire Telegram message (non-blocking)
    this.sendTelegram(userId, type, payload).catch(() => {});
    return notif;
  }

  async getUnread(userId: string) {
    return this.notifRepo.find({
      where: { user: { id: userId }, read: false },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async markRead(userId: string) {
    await this.notifRepo
      .createQueryBuilder()
      .update()
      .set({ read: true })
      .where('user_id = :userId AND read = 0', { userId })
      .execute();
  }

  private async sendTelegram(userId: string, type: string, payload: any) {
    const botToken = this.config.get('TELEGRAM_BOT_TOKEN');
    if (!botToken || botToken === 'dev_token') return;

    const telegramId = payload.telegramId;
    if (!telegramId) return;

    const attackedMsg = payload.won
      ? `⚔️ הממלכה שלך הותקפה ונשדדה!\n👤 ${payload.attackerName}\n💰 ${payload.gold || 0} זהב | 🪵 ${payload.wood || 0} עץ | 🪨 ${payload.stone || 0} אבן${payload.buildingDamaged ? `\n💥 ${payload.buildingDamaged} נפגע!` : ''}`
      : `🛡️ תקיפה נהדפה!\n👤 ${payload.attackerName} ניסה לתקוף אותך ונכשל`;
    const messages: Record<string, string> = {
      attacked:       attackedMsg,
      shield_expired: '🛡️ המגן שלך פג! עכשיו אתה חשוף לתקיפות',
      build_done:     `🏗️ ${payload.building} הושלם — רמה ${payload.level}`,
      training_done:  `⚔️ אימון הושלם — ${payload.count} ${payload.unit} מוכנים`,
    };

    const text = messages[type] || `📢 ${type}`;
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramId,
        text,
        reply_markup: {
          inline_keyboard: [[{ text: '🏰 פתח את המשחק', url: `https://t.me/${this.config.get('TELEGRAM_BOT_USERNAME') || 'KingdomWarsBot'}` }]],
        },
      }),
    });
  }
}
