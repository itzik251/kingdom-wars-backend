import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { fmt, timeLeft, BUILDING_NAMES } from '../utils/format';
import { api } from '../api/client';

const BUILDING_ICONS: Record<string, string> = {
  town_hall: '🏛️', gold_mine: '⛏️', lumber_mill: '🪵', stone_quarry: '🪨',
  farm: '🌾', barracks: '⚔️', academy: '📚', wall: '🧱', watch_tower: '🗼',
};

const BUILDING_COLORS: Record<string, string> = {
  town_hall: '#f4d03f', gold_mine: '#ffd700', lumber_mill: '#8B5E3C',
  stone_quarry: '#aaa', farm: '#7dbb3f', barracks: '#e74c3c',
  academy: '#9b59b6', wall: '#95a5a6', watch_tower: '#3498db',
};

export default function BuildScreen() {
  const { buildings, kingdom, refresh } = useGameStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  async function upgrade(type: string) {
    setLoading(type);
    setMsg('');
    try {
      await api.post('/buildings/upgrade', { type });
      await refresh();
      setMsg('⬆️ שדרוג התחיל!');
    } catch (e: any) {
      setMsg(e.response?.data?.message || 'שגיאה');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="screen">
      <div className="screen-title">🏗️ בניית מבנים</div>

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 12,
          background: msg.startsWith('⬆️') ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)',
          border: `1px solid ${msg.startsWith('⬆️') ? '#27ae60' : '#e74c3c'}44`,
          color: msg.startsWith('⬆️') ? '#27ae60' : '#e74c3c',
          fontSize: 13, textAlign: 'center',
        }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {buildings.map(b => {
          const color = BUILDING_COLORS[b.type] || '#f4d03f';
          const isUpg = b.upgradeEndsAt && new Date() < new Date(b.upgradeEndsAt);

          return (
            <div key={b.id} style={{
              background: 'linear-gradient(135deg,var(--bg-card),var(--bg-card2))',
              border: `1px solid ${isUpg ? '#3498db' : color}33`,
              borderRadius: 12,
              padding: 14,
              boxShadow: isUpg ? '0 0 12px rgba(52,152,219,0.2)' : 'none',
            }} className={isUpg ? 'upgrading-building' : ''}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 9,
                    background: `${color}22`,
                    border: `1px solid ${color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20,
                  }}>
                    {isUpg
                      ? <span className="hammer-icon">🔨</span>
                      : BUILDING_ICONS[b.type] || '🏠'
                    }
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color }}>{BUILDING_NAMES[b.type] || b.type}</div>
                    <div style={{ color: '#a0845a', fontSize: 11 }}>רמה {b.level} → {b.level + 1}</div>
                  </div>
                </div>
                <div style={{
                  background: `${color}22`, border: `1px solid ${color}44`,
                  borderRadius: 8, padding: '3px 10px',
                  fontSize: 12, fontWeight: 700, color,
                }}>
                  Lv.{b.level}
                </div>
              </div>

              {/* Level progress bar */}
              <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${Math.min((b.level / 30) * 100, 100)}%`,
                  background: `linear-gradient(90deg,${color}88,${color})`,
                  borderRadius: 3, transition: 'width 0.4s',
                }} />
              </div>

              {isUpg ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(52,152,219,0.1)', border: '1px solid rgba(52,152,219,0.3)',
                  color: '#3498db', fontSize: 13,
                }}>
                  <span>⏳</span>
                  <span>משדרג... {timeLeft(b.upgradeEndsAt)}</span>
                </div>
              ) : (
                <button
                  className="btn btn-gold"
                  style={{ width: '100%', padding: '10px', fontSize: 13 }}
                  disabled={loading === b.type}
                  onClick={() => upgrade(b.type)}
                >
                  {loading === b.type ? '⏳ מעבד...' : `⬆️ שדרג לרמה ${b.level + 1}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
