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
  dragon_rider:  { en:'Dragon Riders',  he:'רוכבי דרקון',   es:'Jinetes dragón',  fr:'Cavaliers dragons', de:'Drachenreiter',   ru:'Всадники дракона', pt:'Cavaleiros dragão', ar:'راكبو التنانين'   },
  ogre:          { en:'Forest Ogre',    he:'שמן היער',       es:'Ogro del bosque', fr:'Ogre des forêts',   de:'Waldoger',        ru:'Лесной огр',       pt:'Ogro da floresta',  ar:'وحش الغابة'       },
  mage:          { en:'White Wizard',   he:'קוסם לבן',       es:'Mago blanco',     fr:'Mage blanc',        de:'Weißer Magier',   ru:'Белый маг',        pt:'Mago branco',       ar:'الساحر الأبيض'    },
  dwarf_fighter: { en:'Dwarf Fighter',  he:'גמד לוחם',       es:'Guerrero enano',  fr:'Guerrier nain',     de:'Zwergenkämpfer',  ru:'Боец-гном',        pt:'Guerreiro anão',    ar:'محارب الأقزام'    },
};

const RESOURCE_ICONS: Record<string, string> = {
  gold: '💰', wood: '🪵', stone: '🪨', food: '🌾', magic: '🔮', gems: '💎',
};

const RESOURCE_NAMES: Record<string, Record<Lang, string>> = {
  gold:  { en:'Gold',  he:'זהב',   es:'Oro',     fr:'Or',     de:'Gold',   ru:'Золото',  pt:'Ouro',   ar:'ذهب'  },
  wood:  { en:'Wood',  he:'עץ',    es:'Madera',  fr:'Bois',   de:'Holz',   ru:'Дерево',  pt:'Madeira',ar:'خشب'  },
  stone: { en:'Stone', he:'אבן',   es:'Piedra',  fr:'Pierre', de:'Stein',  ru:'Камень',  pt:'Pedra',  ar:'حجر'  },
  food:  { en:'Food',  he:'אוכל',  es:'Comida',  fr:'Nourriture',de:'Nahrung',ru:'Еда',  pt:'Comida', ar:'طعام' },
  magic: { en:'Magic', he:'קסם',   es:'Magia',   fr:'Magie',  de:'Magie',  ru:'Магия',   pt:'Magia',  ar:'سحر'  },
  gems:  { en:'Gems',  he:'אבני חן',es:'Gemas',  fr:'Gemmes', de:'Edelsteine',ru:'Камни',pt:'Gemas',  ar:'جواهر'},
};

const HERO_LABEL: Record<Lang, string> = {
  en:'Hero', he:'גיבור', es:'Héroe', fr:'Héros', de:'Held', ru:'Герой', pt:'Herói', ar:'بطل',
};

function translateBuilding(type: string, lang: Lang): string {
  return BUILDING_NAMES[type]?.[lang] ?? BUILDING_NAMES[type]?.['en'] ?? type;
}
function translateUnit(type: string, lang: Lang): string {
  return UNIT_NAMES[type]?.[lang] ?? UNIT_NAMES[type]?.['en'] ?? type;
}
function translateExplorerResult(foundNodes: { type: string; resourceType?: string; heroType?: string }[], lang: Lang): string {
  return foundNodes.map(n => {
    if (n.type === 'hero') {
      const heroName = UNIT_NAMES[n.heroType ?? '']?.[lang] ?? n.heroType ?? HERO_LABEL[lang];
      return `🦸 ${heroName}`;
    }
    const icon = RESOURCE_ICONS[n.resourceType ?? ''] ?? '📦';
    const name = RESOURCE_NAMES[n.resourceType ?? '']?.[lang] ?? n.resourceType ?? '?';
    return `${icon} ${name}`;
  }).join(', ');
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
  low_food: {
    en: '🌾 Food running out! Soldiers will desert if you don\'t produce more food',
    he: '🌾 האוכל אוזל! חיילים יברחו אם לא תייצר יותר אוכל',
    es: '🌾 ¡Se acaba la comida! Los soldados desertarán si no produces más comida',
    fr: '🌾 La nourriture s\'épuise! Les soldats déserteront si vous ne produisez pas plus',
    de: '🌾 Nahrung geht zur Neige! Soldaten desertieren, wenn du nicht mehr produzierst',
    ru: '🌾 Еда заканчивается! Солдаты дезертируют, если не производить больше еды',
    pt: '🌾 Comida acabando! Soldados vão desertar se não produzir mais comida',
    ar: '🌾 الطعام ينفد! سيهرب الجنود إذا لم تنتج المزيد من الطعام',
  },
  low_gems: {
    en: '💎 Gems low! {gems} left · Salary: {salary}/h · Production: {prod}/h',
    he: '💎 אבני חן אוזלות! נותרו {gems} · משכורת גיבורים: {salary}/שעה · ייצור: {prod}/שעה',
    es: '💎 ¡Gemas bajas! {gems} restantes · Salario: {salary}/h · Producción: {prod}/h',
    fr: '💎 Gemmes basses! {gems} restantes · Salaire: {salary}/h · Production: {prod}/h',
    de: '💎 Wenig Edelsteine! {gems} übrig · Gehalt: {salary}/h · Produktion: {prod}/h',
    ru: '💎 Мало камней! {gems} осталось · Зарплата: {salary}/ч · Добыча: {prod}/ч',
    pt: '💎 Gemas baixas! {gems} restantes · Salário: {salary}/h · Produção: {prod}/h',
    ar: '💎 الجواهر تنخفض! {gems} متبقية · الراتب: {salary}/س · الإنتاج: {prod}/س',
  },
  explorer_returned_found: {
    en: '🧭 Your explorer returned! Found: {result}',
    he: '🧭 החוקר שלך חזר! נמצא: {result}',
    es: '🧭 ¡Tu explorador regresó! Encontró: {result}',
    fr: '🧭 Votre explorateur est revenu! Trouvé: {result}',
    de: '🧭 Dein Entdecker ist zurück! Gefunden: {result}',
    ru: '🧭 Ваш исследователь вернулся! Найдено: {result}',
    pt: '🧭 Seu explorador voltou! Encontrou: {result}',
    ar: '🧭 عاد مستكشفك! وجد: {result}',
  },
  explorer_returned_empty: {
    en: '🧭 Your explorer returned... found nothing this time 😔',
    he: '🧭 החוקר שלך חזר... לא נמצא כלום הפעם 😔',
    es: '🧭 Tu explorador regresó... no encontró nada esta vez 😔',
    fr: '🧭 Votre explorateur est revenu... rien trouvé cette fois 😔',
    de: '🧭 Dein Entdecker ist zurück... diesmal nichts gefunden 😔',
    ru: '🧭 Исследователь вернулся... на этот раз ничего не нашёл 😔',
    pt: '🧭 Seu explorador voltou... não encontrou nada desta vez 😔',
    ar: '🧭 عاد مستكشفك... لم يجد شيئاً هذه المرة 😔',
  },
  shield_purchased: {
    en: '🛡️ Shield activated — protected for 24h',
    he: '🛡️ מגן הופעל — מוגן ל-24 שעות',
    es: '🛡️ Escudo activado — protegido por 24h',
    fr: '🛡️ Bouclier activé — protégé 24h',
    de: '🛡️ Schild aktiviert — 24h geschützt',
    ru: '🛡️ Щит активирован — защита 24ч',
    pt: '🛡️ Escudo ativado — protegido por 24h',
    ar: '🛡️ تم تفعيل الدرع — محمي لمدة 24 ساعة',
  },
  storage_expanded: {
    en: '📦 Storage expanded — capacity ×1.5 for 24h',
    he: '📦 האחסון הורחב — קיבולת ×1.5 ל-24 שעות',
    es: '📦 Almacenamiento ampliado — capacidad ×1.5 por 24h',
    fr: '📦 Stockage élargi — capacité ×1.5 pendant 24h',
    de: '📦 Lager erweitert — Kapazität ×1.5 für 24h',
    ru: '📦 Хранилище расширено — ёмкость ×1.5 на 24ч',
    pt: '📦 Armazenamento expandido — capacidade ×1.5 por 24h',
    ar: '📦 تم توسيع التخزين — السعة ×1.5 لمدة 24 ساعة',
  },
  worker_hired: {
    en: '👷 New worker hired — production +4%',
    he: '👷 עובד חדש גויס — ייצור +4%',
    es: '👷 Nuevo trabajador contratado — producción +4%',
    fr: '👷 Nouveau travailleur embauché — production +4%',
    de: '👷 Neuer Arbeiter eingestellt — Produktion +4%',
    ru: '👷 Нанят новый рабочий — производство +4%',
    pt: '👷 Novo trabalhador contratado — produção +4%',
    ar: '👷 تم توظيف عامل جديد — الإنتاج +4%',
  },
  worker_fired: {
    en: '👷 Worker dismissed — received 25 gold',
    he: '👷 עובד פוטר — קיבלת 25 זהב',
    es: '👷 Trabajador despedido — recibiste 25 de oro',
    fr: '👷 Travailleur licencié — vous avez reçu 25 or',
    de: '👷 Arbeiter entlassen — 25 Gold erhalten',
    ru: '👷 Рабочий уволен — получено 25 золота',
    pt: '👷 Trabalhador demitido — recebeu 25 de ouro',
    ar: '👷 تم فصل العامل — حصلت على 25 ذهباً',
  },
  strike_started: {
    en: '⚠️ STRIKE! Workers and soldiers have gone on strike — no resources. Pay up within 72h or units will leave!',
    he: '⚠️ שביתה! העובדים והחיילים יצאו לשביתה — נגמרו המשאבים. שלם תוך 72 שעות או שיחידות יעזבו!',
    es: '⚠️ ¡HUELGA! Trabajadores y soldados en huelga — sin recursos. ¡Paga en 72h o las unidades se irán!',
    fr: '⚠️ GRÈVE! Travailleurs et soldats en grève — plus de ressources. Payez sous 72h ou les unités partiront!',
    de: '⚠️ STREIK! Arbeiter und Soldaten streiken — keine Ressourcen. Zahle in 72h oder Einheiten verlassen dich!',
    ru: '⚠️ ЗАБАСТОВКА! Рабочие и солдаты бастуют — нет ресурсов. Заплатите в течение 72ч или юниты уйдут!',
    pt: '⚠️ GREVE! Trabalhadores e soldados em greve — sem recursos. Pague em 72h ou as unidades irão embora!',
    ar: '⚠️ إضراب! العمال والجنود في إضراب — لا موارد. ادفع خلال 72 ساعة أو ستغادر الوحدات!',
  },
  strike_removal_warning: {
    en: '🚨 6 hours left! Units will start leaving your kingdom in 6 hours if you don\'t restore resources!',
    he: '🚨 נותרו 6 שעות! יחידות יתחילו לעזוב את הממלכה בעוד 6 שעות אם לא תחזיר משאבים!',
    es: '🚨 ¡6 horas restantes! ¡Las unidades comenzarán a irse en 6 horas si no restauras recursos!',
    fr: '🚨 6 heures restantes! Les unités commenceront à partir dans 6h si vous ne restaurez pas les ressources!',
    de: '🚨 Noch 6 Stunden! Einheiten beginnen in 6h zu gehen, wenn du keine Ressourcen wiederherstellst!',
    ru: '🚨 Осталось 6 часов! Юниты начнут уходить через 6ч, если не восстановить ресурсы!',
    pt: '🚨 6 horas restantes! As unidades começarão a sair em 6h se não restaurar recursos!',
    ar: '🚨 6 ساعات متبقية! ستبدأ الوحدات في المغادرة خلال 6 ساعات إذا لم تستعد الموارد!',
  },
  soldiers_deserted: {
    en: '✊ {left} soldiers deserted due to strike. Still {remaining} more may leave until food production balances upkeep.',
    he: '✊ {left} חיילים עזבו בגלל השביתה. עוד {remaining} חיילים עלולים לעזוב עד שייצור האוכל יאזן את הצריכה.',
    es: '✊ {left} soldados desertaron por la huelga. Aún {remaining} más podrían irse hasta que la producción de comida equilibre el mantenimiento.',
    fr: '✊ {left} soldats ont déserté à cause de la grève. Encore {remaining} pourraient partir jusqu\'à l\'équilibre production/entretien.',
    de: '✊ {left} Soldaten desertierten wegen des Streiks. Noch {remaining} könnten gehen bis Produktion und Unterhalt ausgeglichen sind.',
    ru: '✊ {left} солдат дезертировали из-за забастовки. Ещё {remaining} могут уйти до выравнивания производства и расходов.',
    pt: '✊ {left} soldados desertaram por causa da greve. Ainda {remaining} podem ir embora até o equilíbrio produção/manutenção.',
    ar: '✊ غادر {left} جندياً بسبب الإضراب. قد يغادر {remaining} آخرون حتى يتوازن إنتاج الغذاء مع الصيانة.',
  },
  worker_deserted: {
    en: '👷 A worker left due to the gold strike! Restore gold to stop losing workers.',
    he: '👷 עובד עזב בגלל שביתת הזהב! החזר זהב כדי לעצור את הנטישה.',
    es: '👷 ¡Un trabajador se fue por la huelga de oro! Restaura el oro para detener las bajas.',
    fr: '👷 Un travailleur est parti à cause de la grève de l\'or ! Restaurez l\'or pour arrêter les départs.',
    de: '👷 Ein Arbeiter ist wegen des Goldstreiks gegangen! Stelle Gold wieder her, um weitere Abgänge zu stoppen.',
    ru: '👷 Рабочий ушёл из-за забастовки по золоту! Восстановите золото, чтобы остановить уход.',
    pt: '👷 Um trabalhador foi embora por causa da greve de ouro! Restaure o ouro para parar as saídas.',
    ar: '👷 غادر عامل بسبب إضراب الذهب! استعد الذهب لوقف المغادرة.',
  },
  heroes_deserted_gems: {
    en: '💎 Hero deserted! No gems to pay {hero} salary — they left the kingdom. Restore gems to keep your heroes.',
    he: '💎 גיבור עזב! אין אבני חן לשלם משכורת ל-{hero} — הם עזבו את הממלכה. החזר אבני חן כדי לשמור על גיבוריך.',
    es: '💎 ¡Héroe desertó! Sin gemas para pagar a {hero} — se fue del reino. Restaura gemas para conservar tus héroes.',
    fr: '💎 Héros déserté ! Pas de gemmes pour payer {hero} — il a quitté le royaume. Restaurez les gemmes pour garder vos héros.',
    de: '💎 Held desertiert! Keine Edelsteine für {hero} Gehalt — er hat das Königreich verlassen. Stelle Edelsteine wieder her.',
    ru: '💎 Герой дезертировал! Нет самоцветов для оплаты {hero} — они покинули королевство. Восстановите самоцветы.',
    pt: '💎 Herói desertou! Sem gemas para pagar {hero} — saiu do reino. Restaure gemas para manter seus heróis.',
    ar: '💎 غادر البطل! لا جواهر لدفع راتب {hero} — غادروا المملكة. استعد الجواهر للحفاظ على أبطالك.',
  },
  heroes_deserted_food: {
    en: '🍖 {left} hero(es) left due to food shortage! No soldiers remained to leave first.',
    he: '🍖 {left} גיבור/ים עזבו בגלל מחסור באוכל! לא נשארו חיילים רגילים לעזוב לפניהם.',
    es: '🍖 ¡{left} héroe(s) se fue(ron) por escasez de comida! No quedaban soldados regulares primero.',
    fr: '🍖 {left} héros ont quitté le royaume par manque de nourriture ! Plus de soldats réguliers à partir avant eux.',
    de: '💎 {left} Held(en) ging(en) wegen Nahrungsmangels! Keine regulären Soldaten mehr zuerst zu gehen.',
    ru: '🍖 {left} герой/ев ушли из-за нехватки еды! Обычных солдат для ухода первыми не осталось.',
    pt: '🍖 {left} herói/heróis foram por escassez de comida! Não sobraram soldados regulares para sair primeiro.',
    ar: '🍖 غادر {left} بطل/أبطال بسبب نقص الطعام! لم يتبق جنود عاديون يغادرون أولاً.',
  },
  barbarian_result: {
    en: '⚔️ Barbarian Invasion result: {won} — Reward: {gems} gems + {gold} gold added to your kingdom!',
    he: '⚔️ תוצאת פלישת הברברים: {won} — פרס: {gems} אבני חן + {gold} זהב נוספו לממלכה!',
    es: '⚔️ Resultado invasión bárbara: {won} — Recompensa: {gems} gemas + {gold} oro añadidos!',
    fr: '⚔️ Résultat invasion barbare: {won} — Récompense: {gems} gemmes + {gold} or ajoutés!',
    de: '⚔️ Barbareneinfall-Ergebnis: {won} — Belohnung: {gems} Edelsteine + {gold} Gold hinzugefügt!',
    ru: '⚔️ Итог нашествия варваров: {won} — Награда: {gems} камней + {gold} золота добавлено!',
    pt: '⚔️ Resultado invasão bárbara: {won} — Recompensa: {gems} gemas + {gold} ouro adicionados!',
    ar: '⚔️ نتيجة غزو البرابرة: {won} — المكافأة: {gems} جوهرة + {gold} ذهباً أضيفت!',
  },
  negative_production: {
    en: '📉 Production deficit! Food: {food} | Production: {prod}/h | Upkeep: {upkeep}/h — upgrade Farms or reduce your army',
    he: '📉 גירעון ייצור! אוכל: {food} | ייצור: {prod}/שעה | צריכה: {upkeep}/שעה — שדרג חוות או צמצם את הצבא',
    es: '📉 ¡Déficit! Comida: {food} | Producción: {prod}/h | Consumo: {upkeep}/h — mejora Granjas o reduce el ejército',
    fr: '📉 Déficit! Nourriture: {food} | Production: {prod}/h | Entretien: {upkeep}/h — améliorez les Fermes ou réduisez l\'armée',
    de: '📉 Defizit! Nahrung: {food} | Produktion: {prod}/h | Unterhalt: {upkeep}/h — verbessere Farmen oder reduziere das Heer',
    ru: '📉 Дефицит! Еда: {food} | Производство: {prod}/ч | Расходы: {upkeep}/ч — улучшайте фермы или уменьшайте армию',
    pt: '📉 Déficit! Comida: {food} | Produção: {prod}/h | Custo: {upkeep}/h — melhore Fazendas ou reduza o exército',
    ar: '📉 عجز! الطعام: {food} | الإنتاج: {prod}/س | الصيانة: {upkeep}/س — طوّر المزارع أو قلّل جيشك',
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

  async getMessages(userId: string, lang: Lang = 'en') {
    const notifs = await this.notifRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    const VALID: Lang[] = ['en', 'he', 'es', 'fr', 'de', 'ru', 'pt', 'ar'];
    if (!VALID.includes(lang)) lang = 'en';
    return notifs.map(n => {
      let text = '';
      try {
        if (n.type === 'explorer_returned') {
          const foundNodes = n.payload.foundNodes ?? [];
          const resolvedType = foundNodes.length > 0 ? 'explorer_returned_found' : 'explorer_returned_empty';
          const tpl = MESSAGES[resolvedType]?.[lang] ?? MESSAGES[resolvedType]?.['en'] ?? '';
          const result = translateExplorerResult(foundNodes, lang);
          text = formatMessage(tpl, { result });
        } else {
          const tpl = MESSAGES[n.type]?.[lang] ?? MESSAGES[n.type]?.['en'] ?? n.type;
          const translatedPayload = {
            ...n.payload,
            building: n.payload.building ? translateBuilding(n.payload.building, lang) : undefined,
            unit:     n.payload.unit     ? translateUnit(n.payload.unit, lang)         : undefined,
          };
          text = formatMessage(tpl, translatedPayload);
        }
      } catch { text = n.type; }
      return { id: n.id, type: n.type, text, read: n.read, createdAt: n.createdAt };
    });
  }

  async clearMessages(userId: string) {
    await this.notifRepo.createQueryBuilder()
      .delete()
      .where('user_id = :userId', { userId })
      .execute();
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
    // Dedup: skip if same user+type was sent within 5 minutes (matches cron interval)
    const key = `${userId}:${type}`;
    const lastSent = this.recentSends.get(key) ?? 0;
    if (Date.now() - lastSent < 300_000) return;
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

    // Special handling for explorer_returned — each mission gets its own dedup key
    if (type === 'explorer_returned') {
      const missionKey = `${userId}:explorer_returned:${payload.missionId ?? Date.now()}`;
      if (this.recentSends.get(missionKey)) return;
      this.recentSends.set(missionKey, Date.now());

      const foundNodes = payload.foundNodes ?? [];
      const resolvedType = foundNodes.length > 0 ? 'explorer_returned_found' : 'explorer_returned_empty';
      const msgTemplates = MESSAGES[resolvedType];
      const result = translateExplorerResult(foundNodes, lang);
      const text = formatMessage(msgTemplates[lang] ?? msgTemplates['en'], { result });
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramId, text,
          reply_markup: { inline_keyboard: [[{ text: OPEN_GAME[lang] ?? OPEN_GAME['en'], web_app: { url: this.config.get('FRONTEND_URL') || 'https://kingdomwars.cloud' } }]] },
        }),
      });
      return;
    }

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
            web_app: { url: this.config.get('FRONTEND_URL') || 'https://kingdomwars.cloud' },
          }]],
        },
      }),
    });
  }
}
