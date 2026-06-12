/**
 * AntiBotService — Enterprise-Grade Bot Detection & Protection
 *
 * Features:
 *  - Per-user request rate tracking (sliding window)
 *  - Abuse scoring (bot-like patterns → higher score)
 *  - Auto-ban when score exceeds threshold
 *  - DB-backed ban list (survives restarts)
 *  - Suspicious pattern analysis (interval regularity, burst detection)
 */
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';

interface UserWindow {
  timestamps: number[];    // request timestamps in last 60s
  failCount: number;       // failed requests (validation errors)
  abuseScore: number;      // cumulative score
  bannedUntil?: number;    // temp ban expiry (ms)
  lastSeen: number;
}

// Per-action window config: [maxRequests, windowSeconds, scoreOnViolation]
const ACTION_LIMITS: Record<string, [number, number, number]> = {
  'ads_reward':        [10,  60, 15],  // max 10/min → high score on violation
  'combat_attack':     [20,  60,  8],  // max 20/min
  'building_upgrade':  [15,  60,  5],
  'units_train':       [15,  60,  5],
  'auth_login':        [10,  60, 20],  // brute-force protection
  'default':           [60,  60,  2],
};

// Abuse score thresholds
const TEMP_BAN_SCORE   = 50;   // score → 5-minute ban
const PERM_BAN_SCORE   = 200;  // score → 24-hour ban
const SCORE_DECAY_RATE = 1;    // points removed per minute when inactive

@Injectable()
export class AntiBotService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AntiBotService.name);

  // userId → action → window
  private readonly windows = new Map<string, Map<string, UserWindow>>();

  // In-memory ban cache (backed by DB)
  private readonly banCache = new Map<string, number>(); // userId → bannedUntil ms

  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async onApplicationBootstrap() {
    await this.initBanTable();
  }

  private async initBanTable() {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS antibot_bans (
        user_id    VARCHAR(36) PRIMARY KEY,
        banned_until TIMESTAMPTZ NOT NULL,
        reason     TEXT,
        score      INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `).catch(() => {});
    // Load active bans into cache
    const bans = await this.dataSource.query(
      `SELECT user_id, EXTRACT(EPOCH FROM banned_until)*1000 as banned_ms FROM antibot_bans WHERE banned_until > NOW()`
    ).catch(() => []);
    for (const row of bans) {
      this.banCache.set(row.user_id, parseFloat(row.banned_ms));
    }
    this.logger.log(`Loaded ${bans.length} active bans`);
  }

  /**
   * Main check — call from guards before processing requests.
   * Returns: { allowed: true } or { allowed: false, reason, retryAfter }
   */
  check(userId: string, action: string, ip?: string): { allowed: boolean; reason?: string; retryAfter?: number } {
    const now = Date.now();

    // ── 1. Check ban ─────────────────────────────────────────────────────────
    const bannedUntil = this.banCache.get(userId);
    if (bannedUntil && now < bannedUntil) {
      const retryAfter = Math.ceil((bannedUntil - now) / 1000);
      return { allowed: false, reason: 'BANNED', retryAfter };
    }
    if (bannedUntil && now >= bannedUntil) {
      this.banCache.delete(userId); // ban expired
    }

    // ── 2. Get/create window ─────────────────────────────────────────────────
    if (!this.windows.has(userId)) this.windows.set(userId, new Map());
    const userMap = this.windows.get(userId)!;
    if (!userMap.has(action)) {
      userMap.set(action, { timestamps: [], failCount: 0, abuseScore: 0, lastSeen: now });
    }
    const win = userMap.get(action)!;
    win.lastSeen = now;

    // ── 3. Sliding window: keep only timestamps within window ─────────────────
    const [maxReq, windowSec, violationScore] = ACTION_LIMITS[action] ?? ACTION_LIMITS['default'];
    const windowMs = windowSec * 1000;
    win.timestamps = win.timestamps.filter(t => now - t < windowMs);
    win.timestamps.push(now);

    // ── 4. Rate check ─────────────────────────────────────────────────────────
    if (win.timestamps.length > maxReq) {
      win.abuseScore += violationScore;
      this.logger.warn(`Rate exceeded: user=${userId} action=${action} req=${win.timestamps.length}/${maxReq} score=${win.abuseScore}`);
      this.maybeBan(userId, win);
      const retryAfter = Math.ceil((win.timestamps[0] + windowMs - now) / 1000);
      return { allowed: false, reason: 'RATE_LIMIT', retryAfter };
    }

    // ── 5. Bot pattern analysis ───────────────────────────────────────────────
    if (win.timestamps.length >= 5) {
      const botScore = this.analyzeBotPattern(win.timestamps);
      if (botScore > 0) {
        win.abuseScore += botScore;
        if (botScore >= 5) {
          this.logger.warn(`Bot pattern: user=${userId} action=${action} patternScore=${botScore} totalScore=${win.abuseScore}`);
        }
        this.maybeBan(userId, win);
      }
    }

    return { allowed: true };
  }

  /**
   * Record a failed/suspicious request (validation error, injection attempt, etc.)
   */
  recordFailure(userId: string, action: string, severity: 'low' | 'medium' | 'high' = 'low') {
    const scoreMap = { low: 2, medium: 8, high: 25 };
    if (!this.windows.has(userId)) this.windows.set(userId, new Map());
    const userMap = this.windows.get(userId)!;
    if (!userMap.has(action)) {
      userMap.set(action, { timestamps: [], failCount: 0, abuseScore: 0, lastSeen: Date.now() });
    }
    const win = userMap.get(action)!;
    win.failCount++;
    win.abuseScore += scoreMap[severity];
    this.maybeBan(userId, win);
  }

  /**
   * Analyze timestamps for bot-like patterns (too regular, too fast)
   */
  private analyzeBotPattern(timestamps: number[]): number {
    if (timestamps.length < 3) return 0;
    let score = 0;

    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    // Check 1: Requests too fast (< 500ms between them)
    const tooFast = intervals.filter(i => i < 500).length;
    if (tooFast >= 3) score += tooFast * 2;

    // Check 2: Suspiciously regular intervals (bot-like)
    if (intervals.length >= 4) {
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / avg; // coefficient of variation
      // CV < 0.1 means very regular (suspicious for > 5 req/min)
      if (cv < 0.1 && intervals.length >= 5 && avg < 5000) {
        score += 10;
      }
    }

    // Check 3: Burst — many requests in < 2 seconds
    const recentMs = timestamps[timestamps.length - 1] - timestamps[Math.max(0, timestamps.length - 5)];
    if (timestamps.length >= 5 && recentMs < 2000) {
      score += 5;
    }

    return score;
  }

  private maybeBan(userId: string, win: UserWindow) {
    const now = Date.now();
    if (win.abuseScore >= PERM_BAN_SCORE) {
      const duration = 24 * 3600 * 1000; // 24 hours
      const bannedUntil = now + duration;
      this.banCache.set(userId, bannedUntil);
      this.saveBan(userId, bannedUntil, win.abuseScore, '24h auto-ban: abuse score exceeded');
      this.logger.error(`24h BAN: user=${userId} score=${win.abuseScore}`);
    } else if (win.abuseScore >= TEMP_BAN_SCORE) {
      const duration = 5 * 60 * 1000; // 5 minutes
      const bannedUntil = now + duration;
      this.banCache.set(userId, bannedUntil);
      this.saveBan(userId, bannedUntil, win.abuseScore, '5min auto-ban: abuse score exceeded');
      this.logger.warn(`5min BAN: user=${userId} score=${win.abuseScore}`);
    }
  }

  private async saveBan(userId: string, bannedUntil: number, score: number, reason: string) {
    const dt = new Date(bannedUntil).toISOString();
    await this.dataSource.query(
      `INSERT INTO antibot_bans(user_id, banned_until, reason, score)
       VALUES($1, $2, $3, $4)
       ON CONFLICT(user_id) DO UPDATE SET banned_until=$2, reason=$3, score=$4, created_at=NOW()`,
      [userId, dt, reason, score],
    ).catch(() => {});
  }

  // Manual ban by admin
  async banUser(userId: string, hours: number, reason: string) {
    const bannedUntil = Date.now() + hours * 3600 * 1000;
    this.banCache.set(userId, bannedUntil);
    this.saveBan(userId, bannedUntil, 999, reason);
  }

  async unbanUser(userId: string) {
    this.banCache.delete(userId);
    this.windows.delete(userId);
    await this.dataSource.query(`DELETE FROM antibot_bans WHERE user_id = $1`, [userId]).catch(() => {});
  }

  async getBanStatus(userId: string) {
    const bannedUntil = this.banCache.get(userId);
    const win = this.windows.get(userId);
    const totalScore = win
      ? Array.from(win.values()).reduce((s, w) => s + w.abuseScore, 0)
      : 0;
    return {
      isBanned: !!(bannedUntil && Date.now() < bannedUntil),
      bannedUntil: bannedUntil ? new Date(bannedUntil) : null,
      abuseScore: totalScore,
    };
  }

  // Decay scores every minute and clean up stale windows
  @Cron('* * * * *')
  private cleanup() {
    const now = Date.now();
    const staleMs = 10 * 60 * 1000; // 10 minutes

    for (const [userId, userMap] of this.windows) {
      for (const [action, win] of userMap) {
        // Decay score
        if (win.abuseScore > 0) {
          win.abuseScore = Math.max(0, win.abuseScore - SCORE_DECAY_RATE);
        }
        // Remove stale windows
        if (now - win.lastSeen > staleMs) {
          userMap.delete(action);
        }
      }
      if (userMap.size === 0) {
        this.windows.delete(userId);
      }
    }
  }
}
