import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/user.entity';

type Lang = 'en' | 'he' | 'es' | 'fr' | 'de' | 'ru' | 'pt' | 'ar';

// Building names per language
const BUILDING_NAMES: Record<string, Record<Lang, string>> = {
  town_hall:    { en:'Town Hall',    he:'עירייה',       es:'Ayuntamiento',  fr:'Hôtel de ville', de:'Rathaus',       ru:'Ратуша',          pt:'Prefeitura',      ar:'بيت المدينة'  },
  gold_mine:    { en:'Gold Mine',    he:'מכרה זהב',     es:'Mina de oro',   fr:'Mine d\'or',     de:'Goldmine',      ru:'Золотая шахта',   pt:'Mina de ouro',    ar:'منجم الذهب'   },
  lumber_mill:  { en:'Lumber Mill',  he:'נגרייה',       es:'Aserradero',    fr:'Scierie',        de:'Sägemühle',     ru:'Лесопилка',       pt:'Serraria',        ar:'مطحنة الخشب'  },
  stone_quarry: { en:'Stone Quarry', he:'מחצבה',        es:'Cantera',       fr:'Carrière',       de:'Steinbruch',    ru:'Каменоломня',     pt:'Pedreira',        ar:'محجر الحجارة' },
  farm:         { en:'Farm',         he:'חווה',          es:'Granja',        fr:'Ferme',          de:'Bauernhof',     ru:'Ферма',           pt:'Fazenda',         ar:'مزرعة'        },
  barracks:     { en:'Barracks',     he:'בסיס צבאי',    es:'Cuartel',       fr:'Caserne',        de:'Kaserne',       ru:'Казарма',         pt:'Quartel',         ar:'ثكنة'         },
  academy:      { en:'Academy',      he:'אקדמיה',       es:'Academia',      fr:'Académie',       de:'Akademie',      ru:'Академия',        pt:'Academia',        ar:'الأكاديمية'   },
  wall:         { en:'Wall',         he:'חומה',          es:'Muralla',       fr:'Rempart',        de:'Mauer',         ru:'Стена',           pt:'Muralha',         ar:'سور'          },
  watch_tower:  { en:'Watch Tower',  he:'מגדל שמירה',   es:'Torre vigía',   fr:'Tour de guet',   de:'Wachturm',      ru:'Сторожевая башня',pt:'Torre de guarda', ar:'برج المراقبة' },
  hospital:     { en:'Hospital',     he:'בית חולים',    es:'Hospital',      fr:'Hôpital',        de:'Krankenhaus',   ru:'Больница',        pt:'Hospital',        ar:'مستشفى'       },
  arcane_tower: { en:'Arcane Tower', he:'מגדל ארקני',   es:'Torre arcana',  fr:'Tour arcanique', de:'Arkaner Turm',  ru:'Аркановая башня', pt:'Torre arcana',    ar:'برج السحر'    },
};

// Unit names per language
const UNIT_NAMES: Record<string, Record<Lang, string>> = {
  spearman:    { en:'Spearmen',     he:'חניתנים',      es:'Lanceros',      fr:'Lanciers',       de:'Speerträger',   ru:'Копейщики',       pt:'Lanceiros',       ar:'رماة الرماح'  },
  archer:      { en:'Archers',      he:'קשתים',        es:'Arqueros',      fr:'Archers',        de:'Bogenschützen', ru:'Лучники',         pt:'Arqueiros',       ar:'رماة'         },
  swordsman:   { en:'Swordsmen',    he:'חרבנים',       es:'Espadachines',  fr:'Épéistes',       de:'Schwertkämpfer',ru:'Мечники',         pt:'Espadachins',     ar:'السيافون'     },
  cavalry:     { en:'Cavalry',      he:'פרשים',        es:'Caballería',    fr:'Cavalerie',      de:'Kavallerie',    ru:'Кавалерия',       pt:'Cavalaria',       ar:'الفرسان'      },
  catapult:    { en:'Catapults',    he:'קטפולטות',     es:'Catapultas',    fr:'Catapultes',     de:'Katapulte',     ru:'Катапульты',      pt:'Catapultas',      ar:'المنجنيق'     },
  elite_guard: { en:'Elite Guards', he:'שומרי עילית',  es:'Guardias élite',fr:'Gardes d\'élite',de:'Elitegarden',   ru:'Элитная стража',  pt:'Guardas de elite',ar:'الحرس النخبوي'},
  paladin:     { en:'Paladins',     he:'פלדינים',      es:'Paladines',     fr:'Paladins',       de:'Paladine',      ru:'Паладины',        pt:'Paladinos',       ar:'الفرسان المقدسون'},
  dragon_rider:{ en:'Dragon Riders',he:'רוכבי דרקון',  es:'Jinetes dragón',fr:'Cavaliers dragons',de:'Drachenreiter',ru:'Всадники дракона',pt:'Cavaleiros dragão',ar:'راكبو التنانين'},
};

function translateBuilding(type: string, lang: Lang): string {
  return BUILDING_NAMES[type]?.[lang] ?? BUILDING_NAMES[type]?.['en'] ?? type;
}
function translateUnit(type: string, lang: Lang): string {
  return UNIT_NAMES[type]?.[lang] ?? UNIT_NAMES[type]?.['en'] ?? type;
}

const MESSAGES: Record<string, Record<Lang, string>> = {
  attacked: {
    en: '⚔️ Your kingdom was attacked! {attackerName} looted {gold} gold',
    he: '⚔️ הממלכה שלך הותקפה! {attackerName} בזז {gold} זהב',
    es: '⚔️ ¡Tu reino fue atacado! {attackerName} saqueó {gold} de oro',
    fr: '⚔️ Votre royaume a été attaqué! {attackerName} a pillé {gold} or',
    de: '⚔️ Dein Königreich wurde angegriffen! {attackerName} plünderte {gold} Gold',
    ru: '⚔️ Ваше королевство атаковано! {attackerName} разграбил {gold} золота',
    pt: '⚔️ Seu reino foi atacado! {attackerName} saqueou {gold} de ouro',
    ar: '⚔️ تعرضت مملكتك للهجوم! {attackerName} نهب {gold} ذهباً',
  },
  shield_expired: {
    en: '🛡️ Your shield has expired! You are now vulnerable to attacks',
    he: '🛡️ המגן שלך פג! עכשיו אתה חשוף לתקיפות',
    es: '🛡️ ¡Tu escudo ha expirado! Ahora eres vulnerable a los ataques',
    fr: '🛡️ Votre bouclier a expiré! Vous êtes maintenant vulnérable aux attaques',
    de: '🛡️ Dein Schild ist abgelaufen! Du bist jetzt anfällig für Angriffe',
    ru: '🛡️ Ваш щит истёк! Вы уязвимы для атак',
    pt: '🛡️ Seu escudo expirou! Agora você está vulnerável a ataques',
    ar: '🛡️ انتهت صلاحية درعك! أنت الآن عرضة للهجمات',
  },
  build_done: {
    en: '🏗️ {building} ×{count} completed — Level {level}',
    he: '🏗️ {building} ×{count} הושלם — רמה {level}',
    es: '🏗️ {building} ×{count} completado — Nivel {level}',
    fr: '🏗️ {building} ×{count} terminé — Niveau {level}',
    de: '🏗️ {building} ×{count} abgeschlossen — Stufe {level}',
    ru: '🏗️ {building} ×{count} завершено — Уровень {level}',
    pt: '🏗️ {building} ×{count} concluído — Nível {level}',
    ar: '🏗️ اكتمل {building} ×{count} — المستوى {level}',
  },
  training_done: {
    en: '⚔️ Training complete — {count} {unit} ready for battle',
    he: '⚔️ אימון הושלם — {count} {unit} מוכנים לקרב',
    es: '⚔️ Entrenamiento completado — {count} {unit} listos para la batalla',
    fr: '⚔️ Entraînement terminé — {count} {unit} prêts pour la bataille',
    de: '⚔️ Training abgeschlossen — {count} {unit} bereit für den Kampf',
    ru: '⚔️ Обучение завершено — {count} {unit} готовы к бою',
    pt: '⚔️ Treinamento concluído — {count} {unit} prontos para batalha',
    ar: '⚔️ اكتمل التدريب — {count} {unit} جاهزون للقتال',
  },
  withdrawal_rejected: {
    en: '❌ Withdrawal request rejected{reason}',
    he: '❌ בקשת המשיכה נדחתה{reason}',
    es: '❌ Solicitud de retiro rechazada{reason}',
    fr: '❌ Demande de retrait refusée{reason}',
    de: '❌ Auszahlungsantrag abgelehnt{reason}',
    ru: '❌ Запрос на вывод отклонён{reason}',
    pt: '❌ Solicitação de saque rejeitada{reason}',
    ar: '❌ تم رفض طلب السحب{reason}',
  },
  withdrawal_approved: {
    en: '✅ Your withdrawal of {amount} USDT was sent to your wallet!',
    he: '✅ המשיכה שלך של {amount} USDT נשלחה לארנק!',
    es: '✅ Tu retiro de {amount} USDT fue enviado a tu billetera!',
    fr: '✅ Votre retrait de {amount} USDT a été envoyé à votre portefeuille!',
    de: '✅ Deine Auszahlung von {amount} USDT wurde an deine Wallet gesendet!',
    ru: '✅ Ваш вывод {amount} USDT отправлен на кошелёк!',
    pt: '✅ Seu saque de {amount} USDT foi enviado para sua carteira!',
    ar: '✅ تم إرسال سحبك البالغ {amount} USDT إلى محفظتك!',
  },
  admin_gift: {
    en: '🎁 You received a gift: {label}!',
    he: '🎁 קיבלת מתנה: {label}!',
    es: '🎁 ¡Recibiste un regalo: {label}!',
    fr: '🎁 Vous avez reçu un cadeau: {label}!',
    de: '🎁 Du hast ein Geschenk erhalten: {label}!',
    ru: '🎁 Вы получили подарок: {label}!',
    pt: '🎁 Você recebeu um presente: {label}!',
    ar: '🎁 تلقيت هدية: {label}!',
  },
};

const OPEN_GAME: Record<Lang, string> = {
  en: '🏰 Open Kingdom Wars',
  he: '🏰 פתח את Kingdom Wars',
  es: '🏰 Abrir Kingdom Wars',
  fr: '🏰 Ouvrir Kingdom Wars',
  de: '🏰 Kingdom Wars öffnen',
  ru: '🏰 Открыть Kingdom Wars',
  pt: '🏰 Abrir Kingdom Wars',
  ar: '🏰 افتح Kingdom Wars',
};

function formatMessage(template: string, vars: Record<string, string | number>): string {
  let result = Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(`{${k}}`, String(v)),
    template,
  );
  // Remove "×1" when there's only one item — looks cleaner
  result = result.replace(/ ×1(?!\d)/g, ''); // remove "×1" only when not followed by another digit
  return result;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private config: ConfigService,
  ) {}

  async create(userId: string, type: string, payload: Record<string, any>) {
    const notif = this.notifRepo.create({ user: { id: userId } as any, type, payload });
    await this.notifRepo.save(notif);
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

  private recentSends = new Map<string, number>();

  private async sendTelegram(userId: string, type: string, payload: any) {
    // Dedup: skip if same user+type was sent within 10 seconds
    const key = `${userId}:${type}`;
    const lastSent = this.recentSends.get(key) ?? 0;
    if (Date.now() - lastSent < 10_000) return;
    this.recentSends.set(key, Date.now());

    const botToken = this.config.get('TELEGRAM_BOT_TOKEN');
    if (!botToken || botToken === 'dev_token') return;

    let telegramId = payload.telegramId;
    let lang: Lang = (payload.language as Lang) || 'en';

    if (!telegramId) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user?.telegramId) return;
      telegramId = user.telegramId;
      lang = (user.language as Lang) || 'en';
    }

    const VALID: Lang[] = ['en', 'he', 'es', 'fr', 'de', 'ru', 'pt', 'ar'];
    if (!VALID.includes(lang)) lang = 'en';

    const msgTemplates = MESSAGES[type];
    if (!msgTemplates) return;

    // Translate building/unit names to user's language before filling template
    const translatedPayload = {
      ...payload,
      building: payload.building ? translateBuilding(payload.building, lang) : undefined,
      unit:     payload.unit     ? translateUnit(payload.unit, lang)         : undefined,
    };

    const text = formatMessage(msgTemplates[lang] ?? msgTemplates['en'], translatedPayload);
    const botUsername = this.config.get('TELEGRAM_BOT_USERNAME') || 'KingdomWarsBot';

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramId,
        text,
        reply_markup: {
          inline_keyboard: [[{
            text: OPEN_GAME[lang] ?? OPEN_GAME['en'],
            url: `https://t.me/${botUsername}`,
          }]],
        },
      }),
    });
  }
}
