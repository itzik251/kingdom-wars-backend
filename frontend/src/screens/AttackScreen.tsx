import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { fmt } from '../utils/format';
import { api } from '../api/client';

interface Target {
  id: string; name: string; score: number;
  gold: number; wood: number; stone: number;
  user?: { username?: string; firstName?: string };
}

interface BattleReport {
  attackerWins: boolean;
  attackerPower: number;
  defenderPower: number;
  loot: { gold: number; wood: number; stone: number };
}

const KINGDOM_AVATARS = ['🏰','🗺️','⚔️','🏯','🛡️','👑','🌋','🏔️','🗡️','⚡'];

export default function AttackScreen() {
  const { refresh, kingdom } = useGameStore();
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [attacking, setAttacking] = useState<string | null>(null);
  const [report, setReport] = useState<BattleReport | null>(null);
  const [showBattle, setShowBattle] = useState(false);

  useEffect(() => { loadTargets(); }, []);

  async function loadTargets() {
    setLoading(true);
    try {
      const data = await api.get('/combat/targets');
      setTargets(data);
    } finally { setLoading(false); }
  }

  async function attack(target: Target) {
    setAttacking(target.id);
    setReport(null);
    setShowBattle(true);
    try {
      const result = await api.post('/combat/attack', { defenderKingdomId: target.id });
      setReport(result);
      await refresh();
      setTargets(prev => prev.filter(t => t.id !== target.id));
    } catch (e: any) {
      setShowBattle(false);
      alert(e.response?.data?.message || 'שגיאת תקיפה');
    } finally { setAttacking(null); }
  }

  return (
    <div style={{ background: 'linear-gradient(180deg,#0a0a1a 0%,#0d1529 100%)', minHeight: '100vh', paddingBottom: 80 }}>

      {/* Battle animation overlay */}
      {showBattle && report && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.92)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 16, padding: 24,
        }}>
          {/* Battle animation */}
          <div style={{ fontSize: 64, animation: 'pulse 0.5s infinite', textAlign: 'center' }}>
            {report.attackerWins ? '🏆' : '💀'}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: report.attackerWins ? '#f4d03f' : '#e74c3c' }}>
            {report.attackerWins ? 'ניצחת!' : 'הפסדת'}
          </div>

          {/* Power comparison */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', fontSize: 15 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#f4d03f', fontWeight: 700, fontSize: 20 }}>⚔️ {report.attackerPower}</div>
              <div style={{ color: '#a0845a', fontSize: 12 }}>הכוח שלך</div>
            </div>
            <div style={{ fontSize: 20, color: '#6b3a00' }}>VS</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#e74c3c', fontWeight: 700, fontSize: 20 }}>🛡️ {report.defenderPower}</div>
              <div style={{ color: '#a0845a', fontSize: 12 }}>כוח מגן</div>
            </div>
          </div>

          {/* Loot */}
          {report.attackerWins && (
            <div style={{
              background: 'rgba(244,208,63,0.1)', border: '1px solid rgba(244,208,63,0.3)',
              borderRadius: 12, padding: '14px 28px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 13, color: '#a0845a', marginBottom: 8 }}>🎁 שוד:</div>
              <div style={{ display: 'flex', gap: 20, fontSize: 16, fontWeight: 700 }}>
                <span>💰 {fmt(report.loot.gold)}</span>
                <span>🪵 {fmt(report.loot.wood)}</span>
                <span>🪨 {fmt(report.loot.stone)}</span>
              </div>
            </div>
          )}

          <button
            className="btn btn-gold"
            style={{ marginTop: 8, padding: '12px 36px', fontSize: 16 }}
            onClick={() => { setReport(null); setShowBattle(false); }}
          >
            המשך ⚔️
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '16px', textAlign: 'center', background: 'rgba(0,0,0,0.4)' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#e74c3c' }}>🗺️ מפת העולם</div>
        <div style={{ fontSize: 12, color: '#a0845a', marginTop: 2 }}>בחר ממלכה לתקוף</div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌍</div>
          <div style={{ color: '#a0845a' }}>סורק את המפה...</div>
        </div>
      ) : targets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🕊️</div>
          <div style={{ color: '#a0845a', fontSize: 15 }}>אין ממלכות פגיעות ברדיוס שלך</div>
          <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={loadTargets}>🔍 חפש מחדש</button>
        </div>
      ) : (
        <>
          {/* World map visual */}
          <div style={{ padding: '12px 16px' }}>
            <div style={{
              background: 'radial-gradient(ellipse at center, #1a2a4a 0%, #0a0f1a 100%)',
              borderRadius: 16, padding: 16, border: '1px solid rgba(100,150,255,0.2)',
              position: 'relative', minHeight: 200,
            }}>
              {/* Stars */}
              {[...Array(20)].map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: `${(i * 17 + 5) % 90}%`, top: `${(i * 13 + 3) % 80}%`,
                  width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2,
                  background: 'white', borderRadius: '50%', opacity: 0.4 + (i % 5) * 0.1,
                }} />
              ))}

              {/* Kingdoms on map */}
              {targets.slice(0, 8).map((t, i) => {
                const avatar = KINGDOM_AVATARS[i % KINGDOM_AVATARS.length];
                const x = 5 + (i % 4) * 23;
                const y = 10 + Math.floor(i / 4) * 45;
                return (
                  <div
                    key={t.id}
                    onClick={() => attack(t)}
                    style={{
                      position: 'absolute', left: `${x}%`, top: `${y}%`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      cursor: 'pointer', transform: attacking === t.id ? 'scale(0.9)' : 'scale(1)',
                      transition: 'transform 0.15s',
                    }}
                  >
                    <div style={{
                      fontSize: 32, filter: 'drop-shadow(0 0 6px rgba(255,100,100,0.6))',
                      animation: attacking === t.id ? 'none' : undefined,
                    }}>
                      {attacking === t.id ? '💥' : avatar}
                    </div>
                    <div style={{
                      fontSize: 9, color: '#f4d03f', fontWeight: 700,
                      background: 'rgba(0,0,0,0.7)', borderRadius: 4,
                      padding: '1px 5px', marginTop: 2, whiteSpace: 'nowrap',
                    }}>
                      {(t.user?.firstName || t.name).substring(0, 8)}
                    </div>
                    <div style={{ fontSize: 8, color: '#e74c3c', marginTop: 1 }}>
                      💰{fmt(t.gold)}
                    </div>
                  </div>
                );
              })}

              {/* My kingdom in center */}
              <div style={{
                position: 'absolute', left: '42%', top: '35%',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                <div style={{ fontSize: 36, filter: 'drop-shadow(0 0 8px rgba(244,208,63,0.8))' }}>👑</div>
                <div style={{ fontSize: 10, color: '#f4d03f', fontWeight: 700, background: 'rgba(0,0,0,0.7)', borderRadius: 4, padding: '1px 5px' }}>אתה</div>
              </div>
            </div>
          </div>

          {/* Target list */}
          <div style={{ padding: '0 12px' }}>
            <div style={{ fontSize: 13, color: '#a0845a', marginBottom: 8 }}>
              {targets.length} ממלכות זמינות לתקיפה
            </div>
            {targets.map((t, i) => (
              <div key={t.id} style={{
                background: 'linear-gradient(135deg, rgba(30,0,0,0.8), rgba(50,10,10,0.8))',
                border: '1px solid rgba(231,76,60,0.3)',
                borderRadius: 12, padding: '12px 14px', marginBottom: 10,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ fontSize: 32 }}>{KINGDOM_AVATARS[i % KINGDOM_AVATARS.length]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: '#a0845a' }}>@{t.user?.username || t.user?.firstName || '?'}</div>
                  <div style={{ display: 'flex', gap: 10, fontSize: 12, marginTop: 4 }}>
                    <span>💰 {fmt(t.gold)}</span>
                    <span>🪵 {fmt(t.wood)}</span>
                    <span>🏆 {fmt(t.score)}</span>
                  </div>
                </div>
                <button
                  onClick={() => attack(t)}
                  disabled={!!attacking}
                  style={{
                    background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
                    border: 'none', borderRadius: 10, padding: '10px 16px',
                    color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    boxShadow: '0 3px 10px rgba(231,76,60,0.4)',
                  }}
                >
                  {attacking === t.id ? '💥' : '⚔️ תקוף'}
                </button>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', paddingBottom: 16 }}>
            <button className="btn btn-ghost" onClick={loadTargets} style={{ fontSize: 13 }}>
              🔄 רענן מפה
            </button>
          </div>
        </>
      )}
    </div>
  );
}
