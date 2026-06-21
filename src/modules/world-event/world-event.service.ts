import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { WorldEvent, WorldEventRegistration } from './world-event.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Unit } from '../units/unit.entity';
import { Building } from '../building/building.entity';
import { User } from '../user/user.entity';
import { NotificationService } from '../notifications/notification.service';
import { UNIT_STATS, WALL_DEFENSE_BONUS_PER_LEVEL } from '../../constants/game.constants';
import { HERO_TYPES } from '../units/unit.entity';

const BARBARIAN_DIFFICULTY = 1.5;
const FIGHT_WIN_GEM_REWARD = 50;
const FIGHT_WIN_GOLD_REWARD = 5000;
const DEFEAT_RESOURCE_LOSS_PCT = 0.05; // 5% of each resource for losers & no-shows
const SHIELD_GEM_COST = 10;
const EVENT_DURATION_HOURS = 24;
const ANNOUNCE_BEFORE_HOURS = 24;
const MIN_INTERVAL_DAYS = 3;
const MAX_INTERVAL_DAYS = 7;

@Injectable()
export class WorldEventService {
  private readonly logger = new Logger(WorldEventService.name);

  constructor(
    @InjectRepository(WorldEvent) private eventRepo: Repository<WorldEvent>,
    @InjectRepository(WorldEventRegistration) private regRepo: Repository<WorldEventRegistration>,
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
    @InjectRepository(Unit) private unitRepo: Repository<Unit>,
    @InjectRepository(Building) private buildingRepo: Repository<Building>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private notifService: NotificationService,
    private config: ConfigService,
  ) {}

  // ─── Cron: every hour ────────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_HOUR)
  async tick() {
    const now = new Date();

    // scheduled → announced (24h before start)
    const toAnnounce = await this.eventRepo.find({ where: { status: 'scheduled' } });
    for (const ev of toAnnounce) {
      if (ev.announcedAt && ev.announcedAt <= now) {
        ev.status = 'announced';
        await this.eventRepo.save(ev);
        await this.broadcastNotification('barbarian_announced', { hours: ANNOUNCE_BEFORE_HOURS });
        this.logger.log(`WorldEvent ${ev.id} → announced`);
      }
    }

    // announced → active
    const toActivate = await this.eventRepo.find({ where: { status: 'announced' } });
    for (const ev of toActivate) {
      if (ev.startsAt <= now) {
        ev.status = 'active';
        await this.eventRepo.save(ev);
        await this.broadcastNotification('barbarian_start', {});
        this.logger.log(`WorldEvent ${ev.id} → active`);
      }
    }

    // active → finished
    const toFinish = await this.eventRepo.find({ where: { status: 'active' } });
    for (const ev of toFinish) {
      if (ev.endsAt <= now) {
        await this.finishEvent(ev);
        await this.scheduleNext();
      }
    }
  }

  // ─── Admin: trigger next event manually ──────────────────────────────────────

  async createNextEvent(): Promise<WorldEvent> {
    const existing = await this.eventRepo.findOne({
      where: [{ status: 'scheduled' }, { status: 'announced' }, { status: 'active' }],
    });
    if (existing) return existing;
    return this.scheduleNext();
  }

  // ─── Schedule next event randomly 3–7 days from now ──────────────────────────

  private async scheduleNext(): Promise<WorldEvent> {
    const existing = await this.eventRepo.findOne({
      where: [{ status: 'scheduled' }, { status: 'announced' }, { status: 'active' }],
    });
    if (existing) return existing;

    const randomDays = MIN_INTERVAL_DAYS + Math.random() * (MAX_INTERVAL_DAYS - MIN_INTERVAL_DAYS);
    const startsAt = new Date(Date.now() + randomDays * 24 * 3600 * 1000);
    const announcedAt = new Date(startsAt.getTime() - ANNOUNCE_BEFORE_HOURS * 3600 * 1000);
    const endsAt = new Date(startsAt.getTime() + EVENT_DURATION_HOURS * 3600 * 1000);
    const barbarianPower = await this.calcBarbarianPower();

    const ev = this.eventRepo.create({
      type: 'barbarian_invasion',
      status: 'scheduled',
      announcedAt,
      startsAt,
      endsAt,
      barbarianPower,
    });
    await this.eventRepo.save(ev);
    this.logger.log(`Next WorldEvent in ${randomDays.toFixed(1)} days, starts ${startsAt.toISOString()}`);
    return ev;
  }

  // ─── Player: register choice ──────────────────────────────────────────────────

  async registerChoice(kingdomId: string, choice: 'fight' | 'shield'): Promise<WorldEventRegistration> {
    const ev = await this.getActiveOrAnnounced();
    if (!ev) throw new Error('NO_ACTIVE_EVENT');

    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    if (!kingdom) throw new Error('NO_KINGDOM');

    // Check if shield is free because player has an active game shield covering the invasion
    const shieldCoversEvent = choice === 'shield' &&
      kingdom.shieldUntil && new Date(kingdom.shieldUntil) >= ev.startsAt;

    if (choice === 'shield' && !shieldCoversEvent) {
      if ((kingdom.gems ?? 0) < SHIELD_GEM_COST) throw new Error('NOT_ENOUGH_GEMS');
    }

    const existing = await this.regRepo.findOne({ where: { eventId: ev.id, kingdomId } });

    if (existing) {
      const prevChoice = existing.choice;
      // Handle gem refund/deduct on choice switch
      if (prevChoice === 'shield' && choice === 'fight') {
        // Refund shield cost (unless it was free due to game shield)
        if (!shieldCoversEvent) {
          kingdom.gems = (kingdom.gems ?? 0) + SHIELD_GEM_COST;
        }
        await this.kingdomRepo.save(kingdom);
      } else if (prevChoice === 'fight' && choice === 'shield' && !shieldCoversEvent) {
        kingdom.gems = (kingdom.gems ?? 0) - SHIELD_GEM_COST;
        await this.kingdomRepo.save(kingdom);
      }
      existing.choice = choice;
      if (choice === 'fight') {
        const units = await this.unitRepo.find({ where: { kingdom: { id: kingdomId } } });
        const buildings = await this.buildingRepo.find({ where: { kingdom: { id: kingdomId } } });
        existing.defenderPower = this.calcDefenderPower(units, buildings);
      } else {
        existing.defenderPower = 0;
      }
      return this.regRepo.save(existing);
    }

    // New registration
    if (choice === 'shield' && !shieldCoversEvent) {
      kingdom.gems = (kingdom.gems ?? 0) - SHIELD_GEM_COST;
      await this.kingdomRepo.save(kingdom);
    }

    const units = await this.unitRepo.find({ where: { kingdom: { id: kingdomId } } });
    const buildings = await this.buildingRepo.find({ where: { kingdom: { id: kingdomId } } });
    const defPower = choice === 'fight' ? this.calcDefenderPower(units, buildings) : 0;

    const reg = this.regRepo.create({ eventId: ev.id, kingdomId, choice, defenderPower: defPower });
    return this.regRepo.save(reg);
  }

  // ─── Get current event + player registration ──────────────────────────────────

  async getCurrentEvent(kingdomId?: string) {
    // Return the most relevant event (active/announced first, then last finished)
    const ev = await this.eventRepo.findOne({
      where: [{ status: 'announced' }, { status: 'active' }],
    }) ?? await this.eventRepo.findOne({
      where: { status: 'finished' },
      order: { endsAt: 'DESC' },
    });
    if (!ev) return null;
    const reg = kingdomId
      ? await this.regRepo.findOne({ where: { eventId: ev.id, kingdomId } })
      : null;
    return { event: ev, registration: reg };
  }

  // ─── Internal: finish event ───────────────────────────────────────────────────

  private async finishEvent(ev: WorldEvent) {
    const regs = await this.regRepo.find({ where: { eventId: ev.id } });
    let winnersCount = 0;

    // Process explicit registrations
    const registeredKingdomIds = new Set(regs.map(r => r.kingdomId));
    for (const reg of regs) {
      if (reg.choice === 'fight') {
        const won = reg.defenderPower >= ev.barbarianPower;
        reg.won = won;
        reg.barbarianKills = won ? Math.floor(ev.barbarianPower * 0.3) : 0;
        reg.gemReward = won ? FIGHT_WIN_GEM_REWARD : 0;
        reg.goldReward = won ? FIGHT_WIN_GOLD_REWARD : 0;
        if (won) winnersCount++;
        await this.giveReward(reg);
      } else if (reg.choice === 'shield') {
        // Shield: gems already deducted at registration, no reward
        reg.won = true;
        reg.rewardClaimed = true;
        await this.regRepo.save(reg);
      } else {
        // choice = 'none': treat as automatic loss
        reg.won = false;
        await this.applyDefeat(reg.kingdomId);
        reg.rewardClaimed = true;
        await this.regRepo.save(reg);
      }
    }

    // No-shows: all kingdoms that never registered also lose 5%
    const allKingdoms = await this.kingdomRepo.find({ select: ['id'] });
    for (const k of allKingdoms) {
      if (!registeredKingdomIds.has(k.id)) {
        await this.applyDefeat(k.id);
      }
    }

    ev.status = 'finished';
    ev.participantCount = regs.length;
    ev.winnersCount = winnersCount;
    ev.globalWin = regs.filter(r => r.choice === 'fight').length > 0 &&
      winnersCount >= Math.ceil(regs.filter(r => r.choice === 'fight').length * 0.3);
    await this.eventRepo.save(ev);

    await this.broadcastNotification('barbarian_ended', { globalWin: ev.globalWin });
    this.logger.log(`WorldEvent ${ev.id} finished. Winners: ${winnersCount}/${regs.length}`);
  }

  private async applyDefeat(kingdomId: string) {
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    if (!kingdom) return;
    kingdom.gold  = Math.max(0, Math.floor((kingdom.gold  ?? 0) * (1 - DEFEAT_RESOURCE_LOSS_PCT)));
    kingdom.wood  = Math.max(0, Math.floor((kingdom.wood  ?? 0) * (1 - DEFEAT_RESOURCE_LOSS_PCT)));
    kingdom.stone = Math.max(0, Math.floor((kingdom.stone ?? 0) * (1 - DEFEAT_RESOURCE_LOSS_PCT)));
    kingdom.food  = Math.max(0, Math.floor((kingdom.food  ?? 0) * (1 - DEFEAT_RESOURCE_LOSS_PCT)));
    await this.kingdomRepo.save(kingdom);
  }

  private async giveReward(reg: WorldEventRegistration) {
    const kingdom = await this.kingdomRepo.findOne({ where: { id: reg.kingdomId }, relations: ['user'] });
    if (!kingdom) return;
    if (reg.won && reg.gemReward > 0) {
      kingdom.gems = (kingdom.gems ?? 0) + reg.gemReward;
      kingdom.gold = Math.min(kingdom.maxGold ?? 999999, (kingdom.gold ?? 0) + reg.goldReward);
    } else if (!reg.won) {
      await this.applyDefeat(reg.kingdomId);
      return; // kingdom already saved in applyDefeat
    }
    await this.kingdomRepo.save(kingdom);
    reg.rewardClaimed = true;
    await this.regRepo.save(reg);

    const user = kingdom.user ?? null;
    if (user) {
      const wonLabels: Record<string, string> = {
        he: reg.won ? 'ניצחון!' : 'הפסד', en: reg.won ? 'Victory!' : 'Defeat',
        es: reg.won ? '¡Victoria!' : 'Derrota', fr: reg.won ? 'Victoire!' : 'Défaite',
        de: reg.won ? 'Sieg!' : 'Niederlage', ru: reg.won ? 'Победа!' : 'Поражение',
        pt: reg.won ? 'Vitória!' : 'Derrota', ar: reg.won ? 'نصر!' : 'هزيمة',
      };
      const lang = user.language || 'en';
      const payload = { telegramId: user.telegramId, language: lang, gems: reg.gemReward, gold: reg.goldReward, won: wonLabels[lang] ?? wonLabels['en'] };
      this.notifService.create(user.id, 'barbarian_result', payload).catch(() => {});
    }
  }

  private calcDefenderPower(units: Unit[], buildings: Building[]): number {
    const wall = buildings.find(b => b.type === 'wall');
    const wallBonus = 1 + (wall?.level ?? 0) * (WALL_DEFENSE_BONUS_PER_LEVEL ?? 0.05);
    let power = 0;
    for (const u of units) {
      if (HERO_TYPES.has(u.type as any)) continue;
      const stats = UNIT_STATS[u.type];
      if (stats) power += u.count * stats.defensePower;
    }
    return Math.floor(power * wallBonus);
  }

  private async calcBarbarianPower(): Promise<number> {
    const kingdoms = await this.kingdomRepo.find();
    if (kingdoms.length === 0) return 5000;
    const scores = await Promise.all(
      kingdoms.map(async k => {
        const units = await this.unitRepo.find({ where: { kingdom: { id: k.id } } });
        const buildings = await this.buildingRepo.find({ where: { kingdom: { id: k.id } } });
        return this.calcDefenderPower(units, buildings);
      })
    );
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.max(1000, Math.floor(avg * BARBARIAN_DIFFICULTY));
  }

  private async getActiveOrAnnounced(): Promise<WorldEvent | null> {
    return this.eventRepo.findOne({ where: [{ status: 'active' }, { status: 'announced' }] });
  }

  private async broadcastNotification(type: string, payload: Record<string, any>) {
    try {
      const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
      if (!botToken) return;
      const users = await this.userRepo.find({ where: { telegramId: Not(IsNull()) } });
      const targets = users.slice(0, 500);
      const msgs: Record<string, Record<string, string>> = {
        barbarian_announced: {
          he: `⚔️ פלישת ברברים בעוד ${payload.hours} שעות! פתחו את המשחק ובחרו את הצד שלכם.`,
          en: `⚔️ Barbarian Invasion in ${payload.hours} hours! Open the game and choose your side.`,
          es: `⚔️ ¡Invasión bárbara en ${payload.hours}h! Abre el juego y elige tu lado.`,
          fr: `⚔️ Invasion barbare dans ${payload.hours}h ! Ouvrez le jeu et choisissez votre camp.`,
          de: `⚔️ Barbareneinfall in ${payload.hours}h! Öffne das Spiel und wähle deine Seite.`,
          ru: `⚔️ Нашествие варваров через ${payload.hours}ч! Открой игру и выбери сторону.`,
          pt: `⚔️ Invasão bárbara em ${payload.hours}h! Abra o jogo e escolha seu lado.`,
          ar: `⚔️ غزو البرابرة خلال ${payload.hours} ساعة! افتح اللعبة واختر جانبك.`,
        },
        barbarian_start: {
          he: '⚔️ הברברים מגיעים! הקרב החל — פתחו עכשיו לבחור ולהתגונן!',
          en: '⚔️ The barbarians are here! Battle started — open now to choose and defend!',
          es: '⚔️ ¡Los bárbaros llegaron! La batalla empezó — ¡abre ahora para elegir!',
          fr: '⚔️ Les barbares arrivent ! La bataille a commencé — ouvrez maintenant !',
          de: '⚔️ Die Barbaren kommen! Der Kampf hat begonnen — jetzt öffnen!',
          ru: '⚔️ Варвары здесь! Битва началась — открой сейчас, выбери сторону!',
          pt: '⚔️ Os bárbaros chegaram! A batalha começou — abra agora para escolher!',
          ar: '⚔️ البرابرة وصلوا! بدأت المعركة — افتح الآن لتختار جانبك!',
        },
        barbarian_ended: {
          he: payload.globalWin ? '🏆 ניצחנו! הברברים נהדפו. בואו לאסוף את הפרס!' : '💔 הברברים גרמו נזק. בדקו את הממלכה שלכם!',
          en: payload.globalWin ? '🏆 We won! Barbarians repelled. Collect your reward!' : '💔 Barbarians struck hard. Check your kingdom!',
          es: payload.globalWin ? '🏆 ¡Ganamos! Recoge tu recompensa.' : '💔 Los bárbaros atacaron. ¡Revisa tu reino!',
          fr: payload.globalWin ? '🏆 Victoire ! Récupérez votre récompense.' : '💔 Les barbares ont frappé. Vérifiez votre royaume !',
          de: payload.globalWin ? '🏆 Sieg! Hol deine Belohnung.' : '💔 Barbaren haben zugeschlagen. Überprüfe dein Königreich!',
          ru: payload.globalWin ? '🏆 Победа! Заберите награду.' : '💔 Варвары нанесли удар. Проверьте королевство!',
          pt: payload.globalWin ? '🏆 Vitória! Colete sua recompensa.' : '💔 Os bárbaros atacaram. Verifique seu reino!',
          ar: payload.globalWin ? '🏆 انتصرنا! اجمع مكافأتك.' : '💔 ضرب البرابرة. تحقق من مملكتك!',
        },
      };
      const msgMap = msgs[type];
      if (!msgMap) return;
      for (const user of targets) {
        const lang = (user.language as keyof typeof msgMap) || 'en';
        const text = msgMap[lang] || msgMap['en'];
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: user.telegramId, text }),
        }).catch(() => {});
      }
    } catch {}
  }
}
