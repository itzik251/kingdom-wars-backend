import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';

type Lang = 'en' | 'he' | 'es' | 'fr' | 'de' | 'ru' | 'pt' | 'ar';
const VALID_LANGS: Lang[] = ['en', 'he', 'es', 'fr', 'de', 'ru', 'pt', 'ar'];

const BOT_MESSAGES: Record<string, Record<Lang, string>> = {
  welcome: {
    en:
      '⚔️ <b>Welcome to Kingdom Wars!</b>\n\n' +
      '🏰 Build your kingdom\n' +
      '⚔️ Train your army\n' +
      '🗡️ Attack other players\n' +
      '🏆 Rise in the rankings\n\n' +
      'Press the button to start!',
    he:
      '⚔️ <b>ברוך הבא ל-Kingdom Wars!</b>\n\n' +
      '🏰 בנה ממלכה\n' +
      '⚔️ גייס צבא\n' +
      '🗡️ תקוף שחקנים\n' +
      '🏆 עלה בדירוג\n\n' +
      'לחץ על הכפתור כדי להתחיל!',
    es:
      '⚔️ <b>¡Bienvenido a Kingdom Wars!</b>\n\n' +
      '🏰 Construye tu reino\n' +
      '⚔️ Entrena tu ejército\n' +
      '🗡️ Ataca a otros jugadores\n' +
      '🏆 Sube en el ranking\n\n' +
      '¡Pulsa el botón para empezar!',
    fr:
      '⚔️ <b>Bienvenue dans Kingdom Wars!</b>\n\n' +
      '🏰 Construisez votre royaume\n' +
      '⚔️ Entraînez votre armée\n' +
      '🗡️ Attaquez d\'autres joueurs\n' +
      '🏆 Montez dans le classement\n\n' +
      'Appuyez sur le bouton pour commencer!',
    de:
      '⚔️ <b>Willkommen bei Kingdom Wars!</b>\n\n' +
      '🏰 Baue dein Königreich\n' +
      '⚔️ Trainiere deine Armee\n' +
      '🗡️ Greife andere Spieler an\n' +
      '🏆 Steige in der Rangliste auf\n\n' +
      'Drücke den Knopf um zu starten!',
    ru:
      '⚔️ <b>Добро пожаловать в Kingdom Wars!</b>\n\n' +
      '🏰 Стройте своё королевство\n' +
      '⚔️ Тренируйте армию\n' +
      '🗡️ Атакуйте других игроков\n' +
      '🏆 Поднимайтесь в рейтинге\n\n' +
      'Нажмите кнопку, чтобы начать!',
    pt:
      '⚔️ <b>Bem-vindo ao Kingdom Wars!</b>\n\n' +
      '🏰 Construa seu reino\n' +
      '⚔️ Treine seu exército\n' +
      '🗡️ Ataque outros jogadores\n' +
      '🏆 Suba no ranking\n\n' +
      'Pressione o botão para começar!',
    ar:
      '⚔️ <b>مرحباً بك في Kingdom Wars!</b>\n\n' +
      '🏰 ابنِ مملكتك\n' +
      '⚔️ درّب جيشك\n' +
      '🗡️ هاجم لاعبين آخرين\n' +
      '🏆 ارتقِ في التصنيف\n\n' +
      'اضغط على الزر للبدء!',
  },
  open_game: {
    en: '🏰 Open Kingdom Wars',
    he: '🏰 פתח את Kingdom Wars',
    es: '🏰 Abrir Kingdom Wars',
    fr: '🏰 Ouvrir Kingdom Wars',
    de: '🏰 Kingdom Wars öffnen',
    ru: '🏰 Открыть Kingdom Wars',
    pt: '🏰 Abrir Kingdom Wars',
    ar: '🏰 افتح Kingdom Wars',
  },
  kingdom_btn: {
    en: '🏰 View your kingdom:',
    he: '🏰 פתח את המשחק כדי לראות את הממלכה שלך:',
    es: '🏰 Abre el juego para ver tu reino:',
    fr: '🏰 Ouvrez le jeu pour voir votre royaume:',
    de: '🏰 Öffne das Spiel, um dein Königreich zu sehen:',
    ru: '🏰 Откройте игру, чтобы увидеть своё королевство:',
    pt: '🏰 Abra o jogo para ver seu reino:',
    ar: '🏰 افتح اللعبة لرؤية مملكتك:',
  },
  open_btn: {
    en: '🏰 Open', he: '🏰 פתח', es: '🏰 Abrir', fr: '🏰 Ouvrir',
    de: '🏰 Öffnen', ru: '🏰 Открыть', pt: '🏰 Abrir', ar: '🏰 فتح',
  },
  leaderboard_msg: {
    en: '🏆 View the global leaderboard:',
    he: '🏆 ראה את הדירוג העולמי:',
    es: '🏆 Ver el ranking global:',
    fr: '🏆 Voir le classement mondial:',
    de: '🏆 Weltrangliste ansehen:',
    ru: '🏆 Посмотреть глобальный рейтинг:',
    pt: '🏆 Ver o ranking global:',
    ar: '🏆 عرض التصنيف العالمي:',
  },
  leaderboard_btn: {
    en: '🏆 Leaderboard', he: '🏆 דירוג', es: '🏆 Ranking', fr: '🏆 Classement',
    de: '🏆 Rangliste', ru: '🏆 Рейтинг', pt: '🏆 Ranking', ar: '🏆 تصنيف',
  },
  referral_msg: {
    en: '🔗 Invite friends and earn rewards!\nOpen the game for your personal link:',
    he: '🔗 הזמן חברים וקבל פרסים!\nפתח את המשחק לקישור האישי שלך:',
    es: '🔗 ¡Invita amigos y gana recompensas!\nAbre el juego para tu enlace personal:',
    fr: '🔗 Invitez des amis et gagnez des récompenses!\nOuvrez le jeu pour votre lien personnel:',
    de: '🔗 Lade Freunde ein und erhalte Belohnungen!\nÖffne das Spiel für deinen persönlichen Link:',
    ru: '🔗 Приглашайте друзей и получайте награды!\nОткройте игру для вашей личной ссылки:',
    pt: '🔗 Convide amigos e ganhe recompensas!\nAbra o jogo para seu link pessoal:',
    ar: '🔗 ادعُ أصدقاءك واكسب مكافآت!\nافتح اللعبة للحصول على رابطك الشخصي:',
  },
  referral_btn: {
    en: '🔗 Invite Friends', he: '🔗 הזמן חברים', es: '🔗 Invitar Amigos',
    fr: '🔗 Inviter des amis', de: '🔗 Freunde einladen',
    ru: '🔗 Пригласить друзей', pt: '🔗 Convidar Amigos', ar: '🔗 دعوة الأصدقاء',
  },
};

@Injectable()
export class TelegramService {
  private readonly token: string;
  private readonly apiBase: string;

  constructor(
    private config: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {
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

  private getLang(tgLangCode?: string, dbLang?: string): Lang {
    const preferred = dbLang || tgLangCode?.slice(0, 2) || 'en';
    return VALID_LANGS.includes(preferred as Lang) ? (preferred as Lang) : 'en';
  }

  async handleUpdate(update: any) {
    const msg = update.message;
    if (!msg?.text) return;

    const chatId = msg.chat.id;
    const text = msg.text;
    const miniAppUrl = this.config.get('MINI_APP_URL', 'https://t.me/Kingdomw_bot');
    const tgLang = msg.from?.language_code;

    // Look up stored language for this user
    const user = await this.userRepo.findOne({ where: { telegramId: String(chatId) } }).catch(() => null);
    const lang = this.getLang(tgLang, user?.language);

    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      const param = parts[1] || '';
      // Pass the full param (e.g. ref_CODE) as ?ref= so the Mini App can read it
      const appUrl = param ? `${miniAppUrl}?ref=${encodeURIComponent(param)}` : miniAppUrl;

      await this.sendMessage(chatId, BOT_MESSAGES.welcome[lang], {
        reply_markup: {
          inline_keyboard: [[{
            text: BOT_MESSAGES.open_game[lang],
            web_app: { url: appUrl },
          }]],
        },
      });
    }

    if (text === '/kingdom') {
      await this.sendMessage(chatId, BOT_MESSAGES.kingdom_btn[lang], {
        reply_markup: {
          inline_keyboard: [[{ text: BOT_MESSAGES.open_btn[lang], web_app: { url: miniAppUrl } }]],
        },
      });
    }

    if (text === '/leaderboard') {
      await this.sendMessage(chatId, BOT_MESSAGES.leaderboard_msg[lang], {
        reply_markup: {
          inline_keyboard: [[{ text: BOT_MESSAGES.leaderboard_btn[lang], web_app: { url: miniAppUrl } }]],
        },
      });
    }

    if (text === '/referral') {
      await this.sendMessage(chatId, BOT_MESSAGES.referral_msg[lang], {
        reply_markup: {
          inline_keyboard: [[{ text: BOT_MESSAGES.referral_btn[lang], web_app: { url: miniAppUrl } }]],
        },
      });
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
