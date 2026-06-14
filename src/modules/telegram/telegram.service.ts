import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';

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
  leaderboard_title: {
    en: '🏆 <b>Global Leaderboard</b>',
    he: '🏆 <b>דירוג עולמי</b>',
    es: '🏆 <b>Clasificación Global</b>',
    fr: '🏆 <b>Classement Mondial</b>',
    de: '🏆 <b>Weltrangliste</b>',
    ru: '🏆 <b>Мировой рейтинг</b>',
    pt: '🏆 <b>Ranking Global</b>',
    ar: '🏆 <b>التصنيف العالمي</b>',
  },
  leaderboard_your_rank: {
    en: '\n\n📍 <b>Your rank: #{rank}</b> — {score} pts',
    he: '\n\n📍 <b>הדירוג שלך: #{rank}</b> — {score} נק׳',
    es: '\n\n📍 <b>Tu posición: #{rank}</b> — {score} pts',
    fr: '\n\n📍 <b>Votre rang: #{rank}</b> — {score} pts',
    de: '\n\n📍 <b>Dein Rang: #{rank}</b> — {score} Pkt',
    ru: '\n\n📍 <b>Ваше место: #{rank}</b> — {score} очков',
    pt: '\n\n📍 <b>Sua posição: #{rank}</b> — {score} pts',
    ar: '\n\n📍 <b>ترتيبك: #{rank}</b> — {score} نقطة',
  },
  leaderboard_msg: {
    en: '🏆 View the full leaderboard in the game:',
    he: '🏆 פתח את הדירוג המלא במשחק:',
    es: '🏆 Ver el ranking completo en el juego:',
    fr: '🏆 Voir le classement complet dans le jeu:',
    de: '🏆 Vollständige Rangliste im Spiel:',
    ru: '🏆 Полный рейтинг в игре:',
    pt: '🏆 Ver o ranking completo no jogo:',
    ar: '🏆 عرض التصنيف الكامل في اللعبة:',
  },
  leaderboard_btn: {
    en: '🏆 Open Leaderboard', he: '🏆 פתח דירוג', es: '🏆 Ver Ranking', fr: '🏆 Classement',
    de: '🏆 Rangliste', ru: '🏆 Открыть рейтинг', pt: '🏆 Ver Ranking', ar: '🏆 فتح التصنيف',
  },
  referral_link_msg: {
    en: '🔗 <b>Your referral link:</b>\n\n{link}\n\n👥 Friends invited: {count}\n💎 100 gems per active friend, +200 every 5, skin every 10, VIP every 20!',
    he: '🔗 <b>הקישור האישי שלך:</b>\n\n{link}\n\n👥 חברים שהוזמנו: {count}\n💎 100 Gems לכל חבר פעיל, +200 כל 5, סקין כל 10, VIP כל 20!',
    es: '🔗 <b>Tu enlace personal:</b>\n\n{link}\n\n👥 Invitados: {count}\n💎 100 gemas por amigo activo!',
    fr: '🔗 <b>Votre lien personnel:</b>\n\n{link}\n\n👥 Invites: {count}\n💎 100 gemmes par ami actif!',
    de: '🔗 <b>Dein Link:</b>\n\n{link}\n\n👥 Eingeladen: {count}\n💎 100 Edelsteine pro Freund!',
    ru: '🔗 <b>Ваша ссылка:</b>\n\n{link}\n\n👥 Приглашено: {count}\n💎 100 самоцветов за активного друга!',
    pt: '🔗 <b>Seu link:</b>\n\n{link}\n\n👥 Convidados: {count}\n💎 100 gemas por amigo ativo!',
    ar: '🔗 <b>رابطك:</b>\n\n{link}\n\n👥 المدعوون: {count}\n💎 100 جوهرة لكل صديق نشط!',
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
  help_msg: {
    en: '⚔️ <b>Kingdom Wars — How to Play</b>\n\n🏰 Build: Upgrade buildings for Gold, Wood, Stone, Food\n⚔️ Army: Train soldiers in the Barracks\n🗡️ Attack: Raid players for resources\n🛡️ Shield: Protects from attacks (buy with 50 gems)\n💎 Gems: Premium currency — buy shields, speed builds\n💵 USDT: Loot from VIP players / watch ads — withdraw at 20 USDT\n👑 VIP: +50% production, no ads, exclusive units\n\n/status — Your stats\n/referral — Invite link\n/leaderboard — Rankings',
    he: '⚔️ <b>Kingdom Wars — איך משחקים</b>\n\n🏰 בנה: שדרג מבנים לזהב, עץ, אבן, אוכל\n⚔️ צבא: אמן חיילים בבסיס\n🗡️ תקוף: בוז משאבים משחקנים\n🛡️ מגן: מגן מתקיפות (50 Gems)\n💎 Gems: מטבע פרמיום — מגנים, האצת בנייה\n💵 USDT: בוז מ-VIP / פרסומות — משיכה מ-20 USDT\n👑 VIP: +50% ייצור, ללא פרסומות, יחידות בלעדיות\n\n/status — סטטוס\n/referral — קישור הפניה\n/leaderboard — דירוג',
    es: '⚔️ <b>Kingdom Wars</b>\n\n🏰 Construye edificios\n⚔️ Entrena soldados\n🗡️ Ataca y saquea recursos\n🛡️ Escudo: protege de ataques\n💎 Gemas: moneda premium\n💵 USDT: saquea VIPs / ve anuncios\n👑 VIP: +50% produccion, sin anuncios\n\n/status /referral /leaderboard',
    fr: '⚔️ <b>Kingdom Wars</b>\n\n🏰 Construisez des batiments\n⚔️ Entrainez des soldats\n🗡️ Pillez dautres joueurs\n🛡️ Bouclier: protege des attaques\n💎 Gemmes: monnaie premium\n💵 USDT: pillez les VIP ou regardez des pubs\n👑 VIP: +50% production, sans pubs\n\n/status /referral /leaderboard',
    de: '⚔️ <b>Kingdom Wars</b>\n\n🏰 Gebaeude upgraden\n⚔️ Soldaten trainieren\n🗡️ Spieler angreifen und pluendern\n🛡️ Schild: schuetzt vor Angriffen\n💎 Edelsteine: Premium-Waehrung\n💵 USDT: VIP-Pluenderung oder Werbung\n👑 VIP: +50% Produktion, keine Werbung\n\n/status /referral /leaderboard',
    ru: '⚔️ <b>Kingdom Wars</b>\n\n🏰 Улучшайте здания\n⚔️ Обучайте солдат\n🗡️ Грабьте других игроков\n🛡️ Щит: защищает от атак\n💎 Самоцветы: премиум-валюта\n💵 USDT: грабь VIP или смотри рекламу\n👑 VIP: +50% производство, без рекламы\n\n/status /referral /leaderboard',
    pt: '⚔️ <b>Kingdom Wars</b>\n\n🏰 Melhore edificios\n⚔️ Treine soldados\n🗡️ Ataque outros jogadores\n🛡️ Escudo: protege de ataques\n💎 Gemas: moeda premium\n💵 USDT: saqueie VIPs ou assista anuncios\n👑 VIP: +50% producao, sem anuncios\n\n/status /referral /leaderboard',
    ar: '⚔️ <b>Kingdom Wars</b>\n\n🏰 طور المباني\n⚔️ درب الجنود\n🗡️ هاجم اللاعبين الآخرين\n🛡️ الدرع: يحمي من الهجمات\n💎 الجواهر: عملة مميزة\n💵 USDT: انهب لاعبي VIP / شاهد إعلانات\n👑 VIP: +50% إنتاج، بدون إعلانات\n\n/status /referral /leaderboard',
  },
  status_msg: {
    en: '🏰 <b>{name}</b>\n⚔️ Score: {score}\n\n💰 Gold: {gold}\n🪵 Wood: {wood}\n🪨 Stone: {stone}\n🌾 Food: {food}\n\n💎 Gems: {gems}\n💵 USDT: ${usdt}\n🛡️ Shield: {shield}',
    he: '🏰 <b>{name}</b>\n⚔️ ניקוד: {score}\n\n💰 זהב: {gold}\n🪵 עץ: {wood}\n🪨 אבן: {stone}\n🌾 אוכל: {food}\n\n💎 Gems: {gems}\n💵 USDT: ${usdt}\n🛡️ מגן: {shield}',
    es: '🏰 <b>{name}</b>\n⚔️ Puntos: {score}\n\n💰 Oro: {gold}\n🪵 Madera: {wood}\n🪨 Piedra: {stone}\n🌾 Comida: {food}\n\n💎 Gemas: {gems}\n💵 USDT: ${usdt}\n🛡️ Escudo: {shield}',
    fr: '🏰 <b>{name}</b>\n⚔️ Score: {score}\n\n💰 Or: {gold}\n🪵 Bois: {wood}\n🪨 Pierre: {stone}\n🌾 Nourriture: {food}\n\n💎 Gemmes: {gems}\n💵 USDT: ${usdt}\n🛡️ Bouclier: {shield}',
    de: '🏰 <b>{name}</b>\n⚔️ Punkte: {score}\n\n💰 Gold: {gold}\n🪵 Holz: {wood}\n🪨 Stein: {stone}\n🌾 Nahrung: {food}\n\n💎 Edelsteine: {gems}\n💵 USDT: ${usdt}\n🛡️ Schild: {shield}',
    ru: '🏰 <b>{name}</b>\n⚔️ Очки: {score}\n\n💰 Золото: {gold}\n🪵 Дерево: {wood}\n🪨 Камень: {stone}\n🌾 Еда: {food}\n\n💎 Самоцветы: {gems}\n💵 USDT: ${usdt}\n🛡️ Щит: {shield}',
    pt: '🏰 <b>{name}</b>\n⚔️ Pontos: {score}\n\n💰 Ouro: {gold}\n🪵 Madeira: {wood}\n🪨 Pedra: {stone}\n🌾 Comida: {food}\n\n💎 Gemas: {gems}\n💵 USDT: ${usdt}\n🛡️ Escudo: {shield}',
    ar: '🏰 <b>{name}</b>\n⚔️ النقاط: {score}\n\n💰 الذهب: {gold}\n🪵 الخشب: {wood}\n🪨 الحجر: {stone}\n🌾 الغذاء: {food}\n\n💎 الجواهر: {gems}\n💵 USDT: ${usdt}\n🛡️ الدرع: {shield}',
  },
  shield_active: { en: '✅ Active', he: '✅ פעיל', es: '✅ Activo', fr: '✅ Actif', de: '✅ Aktiv', ru: '✅ Активен', pt: '✅ Ativo', ar: '✅ نشط' },
  shield_none:   { en: '❌ No shield', he: '❌ אין מגן', es: '❌ Sin escudo', fr: '❌ Pas de bouclier', de: '❌ Kein Schild', ru: '❌ Нет щита', pt: '❌ Sem escudo', ar: '❌ لا درع' },
};

@Injectable()
export class TelegramService {
  private readonly token: string;
  private readonly apiBase: string;

  constructor(
    private config: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
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

    // Helper: match command regardless of @botname suffix
    const cmd = (c: string) => text === c || text.startsWith(c + ' ') || text.startsWith(c + '@');

    if (cmd('/start')) {
      const parts = text.split(' ');
      const param = parts[1] || '';
      const appUrl = param ? `${miniAppUrl}?ref=${encodeURIComponent(param)}` : miniAppUrl;
      await this.sendMessage(chatId, BOT_MESSAGES.welcome[lang], {
        reply_markup: { inline_keyboard: [[{ text: BOT_MESSAGES.open_game[lang], web_app: { url: appUrl } }]] },
      });
      return;
    }

    if (cmd('/kingdom')) {
      await this.sendMessage(chatId, BOT_MESSAGES.kingdom_btn[lang], {
        reply_markup: { inline_keyboard: [[{ text: BOT_MESSAGES.open_btn[lang], web_app: { url: miniAppUrl } }]] },
      });
      return;
    }

    if (cmd('/leaderboard')) {
      const lbUrl = `${miniAppUrl}?screen=leaderboard`;
      const MEDALS = ['🥇', '🥈', '🥉'];
      // Fetch top 10 kingdoms ordered by score
      const top = await this.kingdomRepo
        .createQueryBuilder('k')
        .leftJoin('k.user', 'u')
        .select(['k.id', 'k.name', 'k.score'])
        .orderBy('k.score', 'DESC')
        .limit(10)
        .getMany().catch(() => []);

      let msg = BOT_MESSAGES.leaderboard_title[lang] + '\n';
      top.forEach((k, i) => {
        const medal = MEDALS[i] ?? `${i + 1}.`;
        msg += `\n${medal} ${k.name} — ${k.score}`;
      });

      // Show the user's own rank if they have a kingdom
      if (user) {
        const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: user.id } } }).catch(() => null);
        if (kingdom) {
          const rank = await this.kingdomRepo.createQueryBuilder('k')
            .where('k.score > :score', { score: kingdom.score })
            .getCount().catch(() => null);
          if (rank !== null) {
            msg += (BOT_MESSAGES.leaderboard_your_rank[lang] ?? BOT_MESSAGES.leaderboard_your_rank.en)
              .replace('{rank}', String(rank + 1))
              .replace('{score}', String(kingdom.score));
          }
        }
      }

      msg += '\n\n' + BOT_MESSAGES.leaderboard_msg[lang];
      await this.sendMessage(chatId, msg, {
        reply_markup: { inline_keyboard: [[{ text: BOT_MESSAGES.leaderboard_btn[lang], web_app: { url: lbUrl } }]] },
      });
      return;
    }

    if (cmd('/referral')) {
      // Send the referral link directly in the message
      if (user?.referralCode) {
        const botUsername = this.config.get('TELEGRAM_BOT_USERNAME') || 'KingdomWarsBot';
        const refLink = `https://t.me/${botUsername}?start=ref_${user.referralCode}`;
        const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: user.id } } }).catch(() => null);
        const referredUsers = await this.userRepo.find({ where: { referredBy: { id: user.id } } }).catch(() => []);
        const refCount = String(referredUsers.length);
        const refMsg = (BOT_MESSAGES.referral_link_msg[lang] ?? BOT_MESSAGES.referral_link_msg.en)
          .replace('{link}', refLink)
          .replace('{count}', refCount);
        await this.sendMessage(chatId, refMsg, {
          reply_markup: {
            inline_keyboard: [[{ text: BOT_MESSAGES.referral_btn[lang], url: `https://t.me/share/url?url=${encodeURIComponent(refLink)}` }]],
          },
        });
      } else {
        // No account yet — prompt to open game first
        const noAccountMsg: Record<Lang, string> = {
          en: '⚠️ You don\'t have a kingdom yet. Open the game to create one!',
          he: '⚠️ עדיין אין לך ממלכה. פתח את המשחק כדי ליצור אחת!',
          es: '⚠️ Aún no tienes reino. ¡Abre el juego para crear uno!',
          fr: '⚠️ Vous n\'avez pas encore de royaume. Ouvrez le jeu pour en créer un!',
          de: '⚠️ Du hast noch kein Königreich. Öffne das Spiel, um eines zu erstellen!',
          ru: '⚠️ У вас ещё нет королевства. Откройте игру, чтобы создать его!',
          pt: '⚠️ Você ainda não tem um reino. Abra o jogo para criar um!',
          ar: '⚠️ ليس لديك مملكة بعد. افتح اللعبة لإنشاء مملكة!',
        };
        await this.sendMessage(chatId, noAccountMsg[lang], {
          reply_markup: { inline_keyboard: [[{ text: BOT_MESSAGES.open_game[lang], web_app: { url: miniAppUrl } }]] },
        });
      }
      return;
    }

    if (cmd('/help')) {
      await this.sendMessage(chatId, BOT_MESSAGES.help_msg[lang], {
        reply_markup: {
          inline_keyboard: [[{ text: BOT_MESSAGES.open_btn[lang], web_app: { url: miniAppUrl } }]],
        },
      });
      return;
    }

    if (cmd('/status')) {
      const kingdom = user
        ? await this.kingdomRepo.findOne({ where: { user: { id: user.id } } }).catch(() => null)
        : null;
      if (!kingdom) {
        await this.sendMessage(chatId, BOT_MESSAGES.welcome[lang], {
          reply_markup: { inline_keyboard: [[{ text: BOT_MESSAGES.open_game[lang], web_app: { url: miniAppUrl } }]] },
        });
        return;
      }
      const shieldStr = kingdom.isShielded ? BOT_MESSAGES.shield_active[lang] : BOT_MESSAGES.shield_none[lang];
      const statusText = (BOT_MESSAGES.status_msg[lang] ?? BOT_MESSAGES.status_msg.en)
        .replace('{name}', kingdom.name)
        .replace('{score}', String(kingdom.score))
        .replace('{gold}', String(Math.floor(kingdom.gold)))
        .replace('{wood}', String(Math.floor(kingdom.wood)))
        .replace('{stone}', String(Math.floor(kingdom.stone)))
        .replace('{food}', String(Math.floor(kingdom.food)))
        .replace('{gems}', String(kingdom.gems))
        .replace('{usdt}', (kingdom.usdtBalance ?? 0).toFixed(2))
        .replace('{shield}', shieldStr);
      await this.sendMessage(chatId, statusText, {
        reply_markup: { inline_keyboard: [[{ text: BOT_MESSAGES.open_btn[lang], web_app: { url: miniAppUrl } }]] },
      });
      return;
    }
  }

  async setMyCommands() {
    if (!this.token || this.token === 'dev_token') return { ok: false, reason: 'no token' };
    const commands = [
      { command: 'start',       description: '🏰 Start / Open game' },
      { command: 'status',      description: '📊 Your kingdom status' },
      { command: 'kingdom',     description: '🏰 View your kingdom' },
      { command: 'referral',    description: '🔗 Invite friends & earn rewards' },
      { command: 'leaderboard', description: '🏆 Global rankings' },
      { command: 'help',        description: '❓ All commands' },
    ];
    const res = await fetch(`${this.apiBase}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands }),
    });
    return res.json();
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
