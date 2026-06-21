import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { fmt } from '../utils/format';
import { api } from '../api/client';
import KingdomProfileSheet, { KingdomProfile, AttackSquad } from '../components/KingdomProfileSheet';
import { useT } from '../i18n/useT';
import { ResIcon } from '../components/ResIcon';

interface Target {
  id: string; name: string; score: number;
  gold: number; wood: number; stone: number;
  user?: { username?: string; firstName?: string };
}

interface BattleReport {
  attackerWins: boolean;
  attackerPower: number;
  defenderPower: number;
  loot: { gold: number; wood: number; stone: number; usdt?: number };
  attackerLosses?: Record<string, number>;
  defenderLosses?: Record<string, number>;
  attackerWounded?: Record<string, number>;
  defenderWounded?: Record<string, number>;
  winStreak?: number;
  streakBonus?: number;
  buildingDamaged?: { type: string; newLevel: number };
}

const KINGDOM_AVATARS = ['🏰','🗺️','⚔️','🏯','🛡️','👑','🌋','🏔️','🗡️','⚡'];

// Module-level: tracks marches already running so remount never starts a duplicate
const runningMarches = new Set<string>();

export default function AttackScreen() {
  const { refresh, kingdom, addMarchingSquad, removeMarchingSquad, marchingSquads, setPendingBattleReport, setPendingError } = useGameStore();
  // Reactive subscription — re-renders component (and re-runs display effect) when marches change
  const marchMeta = useGameStore(s => s.marchMeta);

  const attackBoostActive = !!(
    kingdom?.attackSpeedBoostUntil &&
    new Date() < new Date(kingdom.attackSpeedBoostUntil)
  );
  const [targets, setTargets]     = useState<Target[]>([]);
  const [loading, setLoading]     = useState(true);
  // marches: kingdomId → countdown seconds — driven entirely by the display effect below
  const [marches, setMarches]     = useState<Record<string, number>>({});
  const [profileId, setProfileId] = useState<string | null>(null);
  const [history, setHistory]     = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const t = useT();
  // per-kingdom cancel flags — intentionally NOT cleared on unmount
  const cancelRefs = useRef<Record<string, boolean>>({});

  // ── Display ticker ──────────────────────────────────────────────────
  // Completely independent of runCountdownAndAttack — survives component remount.
  // Re-runs whenever marchMeta changes (march added or removed).
  useEffect(() => {
    if (Object.keys(marchMeta).length === 0) {
      setMarches({});
      return;
    }
    const snap = { ...marchMeta };
    const tick = () => {
      const n = Date.now();
      setMarches(Object.fromEntries(
        Object.entries(snap).map(([k, m]) => [k, Math.max(0, Math.ceil((m.endsAt - n) / 1000))])
      ));
    };
    tick(); // immediate render
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [marchMeta]);

  // ── Mount: load data + resume any background marches ───────────────
  useEffect(() => {
    loadTargets();
    loadHistory();
    // Resume marches not already running (e.g. app restart within session)
    Object.entries(marchMeta).forEach(([kId, meta]) => {
      if (runningMarches.has(kId)) return;
      cancelRefs.current[kId] = false;
      runCountdownAndAttack(kId, meta.squad, meta.heroType, meta.endsAt);
    });
  }, []);

  async function loadHistory() {
    try { setHistory(await api.get('/combat/history')); } catch (_) {}
  }

  async function loadTargets() {
    setLoading(true);
    try { setTargets(await api.get('/combat/targets')); }
    finally { setLoading(false); }
  }

  // Core march logic — called both on new attack and on resume after navigation.
  // endsAt is epoch-ms so the countdown stays accurate even if JS was suspended (Telegram background).
  async function runCountdownAndAttack(
    kingdomId: string,
    squad: Record<string, number> | undefined,
    heroType: string | undefined,
    endsAt: number,
  ) {
    if (runningMarches.has(kingdomId)) return; // prevent duplicate from remount
    runningMarches.add(kingdomId);

    const removeMarch = () => {
      runningMarches.delete(kingdomId);
      removeMarchingSquad(kingdomId); // updates marchMeta in store → display effect clears countdown
      delete cancelRefs.current[kingdomId];
    };

    try {
      // Wait until wall-clock reaches endsAt (accurate even after JS suspension)
      if (Date.now() < endsAt) {
        await new Promise<void>((res, rej) => {
          const tick = setInterval(() => {
            if (cancelRefs.current[kingdomId]) { clearInterval(tick); rej(new Error('CANCELLED')); return; }
            if (Date.now() >= endsAt) { clearInterval(tick); res(); }
          }, 500);
        });
      }

      const result = await api.post('/combat/attack', { defenderKingdomId: kingdomId, heroType, squad });
      removeMarch();
      setProfileId(null);
      setPendingBattleReport(result);
      await refresh();
      setTargets(prev => prev.filter(t => t.id !== kingdomId));
    } catch (e: any) {
      removeMarch();
      if (e?.message !== 'CANCELLED') {
        { const code = (e as any)?.response?.data?.message; setPendingError(code === 'STRIKE_ACTIVE' ? t('strike_attack_blocked') : code || t('error')); }
      }
    }
  }

  async function attack(profile: KingdomProfile, squadOptions?: AttackSquad) {
    if (runningMarches.has(profile.id)) return; // already marching to this kingdom

    const baseMarch = profile.marchSeconds ?? 5;

    // marchSeconds=0 → immediate attack (from battle screen "סיים קרב")
    if (baseMarch === 0) {
      runningMarches.add(profile.id);
      try {
        const result = await api.post('/combat/attack', {
          defenderKingdomId: profile.id,
          heroType: squadOptions?.heroType,
          squad: squadOptions?.squad,
        });
        runningMarches.delete(profile.id);
        setProfileId(null);
        setPendingBattleReport(result);
        await refresh();
        setTargets(prev => prev.filter(t => t.id !== profile.id));
      } catch (e: any) {
        runningMarches.delete(profile.id);
        { const code = (e as any)?.response?.data?.message; setPendingError(code === 'STRIKE_ACTIVE' ? t('strike_attack_blocked') : code || t('error')); }
      }
      return;
    }

    const marchSecs = attackBoostActive ? Math.max(1, Math.ceil(baseMarch / 2)) : baseMarch;
    const endsAt = Date.now() + marchSecs * 1000;

    cancelRefs.current[profile.id] = false;
    addMarchingSquad(profile.id, squadOptions?.squad, squadOptions?.heroType, endsAt);
    runCountdownAndAttack(profile.id, squadOptions?.squad, squadOptions?.heroType, endsAt);
  }

  return (
    <div style={{ background: 'linear-gradient(180deg,#0a0a1a 0%,#0d1529 100%)', minHeight: '100vh', paddingBottom: 130 }}>

      {showHistory && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#f4d03f' }}>{t('battle_history_title')}</div>
            <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', color: '#666', fontSize: 24, cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#a0845a', paddingTop: 60 }}>{t('no_battles')}</div>
            ) : history.map((h: any) => (
              <div key={h.id} style={{ background: h.won ? 'rgba(39,174,96,0.1)' : 'rgba(231,76,60,0.1)', border: `1px solid ${h.won ? 'rgba(39,174,96,0.3)' : 'rgba(231,76,60,0.3)'}`, borderRadius: 12, padding: '12px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: h.won ? '#27ae60' : '#e74c3c', fontSize: 14 }}>
                    {h.won ? `🏆 ${t('victory')}` : `💀 ${t('defeat')}`} · {h.isAttacker ? t('attacked_target', { name: h.defenderName }) : t('was_attacked', { name: h.attackerName })}
                  </span>
                  <span style={{ fontSize: 11, color: '#666' }}>{new Date(h.createdAt).toLocaleDateString()}</span>
                </div>
                {h.loot && (h.loot.gold > 0 || h.loot.wood > 0) && (
                  <div style={{ fontSize: 12, color: '#a0845a' }}>
                    {h.isAttacker && h.won ? '🎁 ' : '💸 '}
                    <ResIcon type="gold" />{fmt(h.loot.gold)} <ResIcon type="wood" />{fmt(h.loot.wood)} <ResIcon type="stone" />{fmt(h.loot.stone)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Battle result popup moved to App.tsx (global) so it survives navigation */}

      {profileId && (
        <KingdomProfileSheet
          kingdomId={profileId}
          attacking={profileId !== null && marches[profileId] !== undefined}
          marchCountdown={profileId !== null ? (marches[profileId] ?? 0) : 0}
          sentSquad={profileId !== null ? marchingSquads[profileId] : undefined}
          onClose={() => setProfileId(null)}
          onAttack={attack}
        />
      )}

      <div style={{ padding: '16px', textAlign: 'center', background: 'rgba(0,0,0,0.4)' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#e74c3c' }}>{t('attack_title')}</div>
        <div style={{ fontSize: 12, color: '#a0845a', marginTop: 2 }}>{t('choose_kingdom')}</div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌍</div>
          <div style={{ color: '#a0845a' }}>{t('scanning')}</div>
        </div>
      ) : targets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🕊️</div>
          <div style={{ color: '#a0845a', fontSize: 15 }}>{t('no_targets')}</div>
          <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={loadTargets}>{t('search_again')}</button>
        </div>
      ) : (
        <>
          <div style={{ padding: '12px 16px' }}>
            <div style={{
              background: 'radial-gradient(ellipse at center, #1a2a4a 0%, #0a0f1a 100%)',
              borderRadius: 16, padding: 16, border: '1px solid rgba(100,150,255,0.2)',
              position: 'relative', minHeight: 200,
            }}>
              {[...Array(20)].map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: `${(i * 17 + 5) % 90}%`, top: `${(i * 13 + 3) % 80}%`,
                  width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2,
                  background: 'white', borderRadius: '50%', opacity: 0.4 + (i % 5) * 0.1,
                }} />
              ))}

              {targets.slice(0, 8).map((tgt, i) => {
                const avatar = KINGDOM_AVATARS[i % KINGDOM_AVATARS.length];
                const x = 5 + (i % 4) * 23;
                const y = 10 + Math.floor(i / 4) * 45;
                return (
                  <div
                    key={tgt.id}
                    onClick={() => setProfileId(tgt.id)}
                    style={{
                      position: 'absolute', left: `${x}%`, top: `${y}%`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      cursor: 'pointer', transform: marches[tgt.id] !== undefined ? 'scale(0.9)' : 'scale(1)',
                      transition: 'transform 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 32, filter: 'drop-shadow(0 0 6px rgba(255,100,100,0.6))' }}>
                      {marches[tgt.id] !== undefined ? '💥' : avatar}
                    </div>
                    <div style={{ fontSize: 9, color: '#f4d03f', fontWeight: 700, background: 'rgba(0,0,0,0.7)', borderRadius: 4, padding: '1px 5px', marginTop: 2, whiteSpace: 'nowrap' }}>
                      {(tgt.user?.firstName || tgt.name).substring(0, 8)}
                    </div>
                    <div style={{ fontSize: 8, color: '#e74c3c', marginTop: 1, display:'flex', alignItems:'center', gap:1 }}><ResIcon type="gold" size={8} />{fmt(tgt.gold)}</div>
                  </div>
                );
              })}

              <div style={{ position: 'absolute', left: '42%', top: '35%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 36, filter: 'drop-shadow(0 0 8px rgba(244,208,63,0.8))' }}>👑</div>
                <div style={{ fontSize: 10, color: '#f4d03f', fontWeight: 700, background: 'rgba(0,0,0,0.7)', borderRadius: 4, padding: '1px 5px' }}>{t('you_label')}</div>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: '#a0845a' }}>{t('kingdoms_available', { n: targets.length })}</div>
              {history.length > 0 && (
                <button onClick={() => setShowHistory(true)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '5px 10px', color: '#a0845a', fontSize: 11, cursor: 'pointer' }}>
                  {t('history_btn', { n: history.length })}
                </button>
              )}
            </div>
            {targets.map((tgt, i) => (
              <div key={tgt.id} style={{
                background: 'linear-gradient(135deg, rgba(30,0,0,0.8), rgba(50,10,10,0.8))',
                border: '1px solid rgba(231,76,60,0.3)',
                borderRadius: 12, padding: '12px 14px', marginBottom: 10,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ fontSize: 32 }}>{KINGDOM_AVATARS[i % KINGDOM_AVATARS.length]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{tgt.name}</div>
                  <div style={{ fontSize: 11, color: '#a0845a' }}>@{tgt.user?.username || tgt.user?.firstName || '?'}</div>
                  <div style={{ display: 'flex', gap: 10, fontSize: 12, marginTop: 4 }}>
                    <span style={{ display:'flex', alignItems:'center', gap:3 }}><ResIcon type="gold" /> {fmt(tgt.gold)}</span>
                    <span style={{ display:'flex', alignItems:'center', gap:3 }}><ResIcon type="wood" /> {fmt(tgt.wood)}</span>
                    <span>🏆 {fmt(tgt.score)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setProfileId(tgt.id)}
                  style={{
                    background: marches[tgt.id] !== undefined
                      ? 'linear-gradient(135deg,#b8860b,#f4d03f)'
                      : 'linear-gradient(135deg,#c0392b,#e74c3c)',
                    border: 'none', borderRadius: 10, padding: '10px 16px',
                    color: marches[tgt.id] !== undefined ? '#000' : 'white',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    boxShadow: '0 3px 10px rgba(231,76,60,0.4)',
                  }}
                >
                  {marches[tgt.id] !== undefined ? `⚔️ ${marches[tgt.id]}s` : t('check_btn')}
                </button>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', paddingBottom: 16 }}>
            <button className="btn btn-ghost" onClick={loadTargets} style={{ fontSize: 13 }}>
              {t('refresh_map')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
