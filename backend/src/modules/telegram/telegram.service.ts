import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private readonly token: string;
  private readonly apiBase: string;

  constructor(private config: ConfigService) {
    this.token = config.get('TELEGRAM_BOT_TOKEN');
    this.apiBase = `https://api.telegram.org/bot${this.token}`;
  }

  async sendMessage(chatId: number, text: string, extra?: any) {
    if (!this.token || this.token === 'dev_token') return;
    await fetch(`${this.apiBase}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...extra }),
    });
  }

  async handleUpdate(update: any) {
    const msg = update.message;
    if (!msg?.text) return;

    const chatId = msg.chat.id;
    const text = msg.text;
    const miniAppUrl = this.config.get('MINI_APP_URL', 'https://t.me/Kingdomw_bot');

    if (text.startsWith('/start')) {
      // Extract referral code if present: /start ref_CODE
      const parts = text.split(' ');
      const param = parts[1] || '';

      await this.sendMessage(chatId,
        `⚔️ <b>ברוך הבא ל-Kingdom Wars!</b>\n\n` +
        `🏰 בנה ממלכה\n` +
        `⚔️ גייס צבא\n` +
        `🗡️ תקוף שחקנים\n` +
        `🏆 עלה בדירוג\n\n` +
        `לחץ על הכפתור כדי להתחיל!`,
        {
          reply_markup: {
            inline_keyboard: [[
              {
                text: '🏰 פתח את Kingdom Wars',
                web_app: { url: param ? `${miniAppUrl}?ref=${param.replace('ref_', '')}` : miniAppUrl },
              },
            ]],
          },
        }
      );
    }

    if (text === '/kingdom') {
      await this.sendMessage(chatId,
        '🏰 פתח את המשחק כדי לראות את הממלכה שלך:',
        {
          reply_markup: {
            inline_keyboard: [[{ text: '🏰 פתח', web_app: { url: miniAppUrl } }]],
          },
        }
      );
    }

    if (text === '/leaderboard') {
      await this.sendMessage(chatId,
        '🏆 ראה את הדירוג העולמי:',
        {
          reply_markup: {
            inline_keyboard: [[{ text: '🏆 דירוג', web_app: { url: miniAppUrl } }]],
          },
        }
      );
    }

    if (text === '/referral') {
      await this.sendMessage(chatId,
        '🔗 הזמן חברים וקבל פרסים!\nפתח את המשחק לקישור האישי שלך:',
        {
          reply_markup: {
            inline_keyboard: [[{ text: '🔗 הזמן חברים', web_app: { url: miniAppUrl } }]],
          },
        }
      );
    }
  }

  async setWebhook(webhookUrl: string) {
    const res = await fetch(`${this.apiBase}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl, allowed_updates: ['message', 'callback_query'] }),
    });
    return res.json();
  }

  async deleteWebhook() {
    const res = await fetch(`${this.apiBase}/deleteWebhook`, { method: 'POST' });
    return res.json();
  }
}
