import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { fmt, timeLeft, BUILDING_NAMES } from '../utils/format';
import { api } from '../api/client';

const BUILDING_LAYOUT: Record<string, { col: number; row: number; size: number }> = {
  town_hall:    { col: 2, row: 2, size: 2 },
  barracks:     { col: 0, row: 0, size: 1 },
  gold_mine:    { col: 4, row: 0, size: 1 },
  lumber_mill:  { col: 0, row: 3, size: 1 },
  stone_quarry: { col: 4, row: 3, size: 1 },
  farm:         { col: 4, row: 4, size: 1 },
  academy:      { col: 0, row: 4, size: 1 },
  wall:         { col: 2, row: 5, size: 1 },
  watch_tower:  { col: 2, row: 0, size: 1 },
};

const BUILDING_CONFIG: Record<string, { icon: string; color: string; glow: string; bg: string }> = {
  town_hall:    { icon: '🏛️', color: '#f4d03f', glow: 'rgba(244,208,63,0.6)', bg: 'linear-gradient(145deg,#4a3000,#8b6914)' },
  gold_mine:    { icon: '⛏️', color: '#ffd700', glow: 'rgba(255,215,0,0.5)',   bg: 'linear-gradient(145deg,#3d2800,#7a5200)' },
  lumber_mill:  { icon: '🪵', color: '#8B5E3C', glow: 'rgba(139,94,60,0.5)',   bg: 'linear-gradient(145deg,#1a3300,#2d5a00)' },
  stone_quarry: { icon: '🪨', color: '#aaa',    glow: 'rgba(170,170,170,0.5)', bg: 'linear-gradient(145deg,#2a2a2a,#4a4a4a)' },
  farm:         { icon: '🌾', color: '#7dbb3f', glow: 'rgba(125,187,63,0.5)',  bg: 'linear-gradient(145deg,#1a3300,#3d6600)' },
  barracks:     { icon: '⚔️', color: '#e74c3c', glow: 'rgba(231,76,60,0.5)',   bg: 'linear-gradient(145deg,#3c0000,#7a1500)' },
  academy:      { icon: '📚', color: '#9b59b6', glow: 'rgba(155,89,182,0.5)',  bg: 'linear-gradient(145deg,#1a0033,#3d0066)' },
  wall:         { icon: '🧱', color: '#95a5a6', glow: 'rgba(149,165,166,0.5)', bg: 'linear-gradient(145deg,#2a2a2a,#555)' },
  watch_tower:  { icon: '🗼', color: '#3498db', glow: 'rgba(52,152,219,0.5)',  bg: 'linear-gradient(145deg,#001a3c,#003d7a)' },
};

const COLS = 5;
const ROWS = 6;

export default function HomeScreen() {
  const { kingdom, buildings, productionRates, refresh } = useGameStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const selectedBuilding = buildings.find(b => b.type === selected);

  async function upgrade() {
    if (!selected) return;
    setUpgrading(selected);
    setMsg('');
    try {
      await api.post('/buildings/upgrade', { type: selected });
      await refresh();
      setMsg('⬆️ שדרוג התחיל!');
      setSelected(null);
    } catch (e: any) {
      setMsg('❌ ' + (e.response?.data?.message || 'שגיאה'));
    } finally {
      setUpgrading(null);
    }
  }

  const totalPower = buildings.reduce((sum, b) => sum + b.level, 0);

  // Build terrain grid: which cells are "path" vs "grass"
  const pathCells = new Set([6,7,8, 11,13, 16,17,18, 21,23, 26,27,28]);

  return (
    <div style={{ background: 'linear-gradient(180deg,#0a1a0a 0%,#0d2010 50%,#0a1a0a 100%)', minHeight: '100vh', fontFamily: 'system-ui,sans-serif' }}>

      {/* Header */}
      <div style={{ padding: '10px 16px', background: 'linear-gradient(90deg,rgba(0,0,0,0.7),rgba(20,10,0,0.8))', borderBottom: '1px solid rgba(244,208,63,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#f4d03f', textShadow: '0 0 10px rgba(244,208,63,0.5)' }}>⚔️ {kingdom?.name}</div>
          <div style={{ fontSize: 11, color: '#a0845a', marginTop: 1 }}>⚡ כוח {totalPower} · 🏆 {fmt(kingdom?.score || 0)} נק׳</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {kingdom?.shieldActive && (
            <div style={{ background: 'rgba(52,152,219,0.2)', border: '1px solid #3498db', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: '#3498db' }}>
              🛡️ {timeLeft(kingdom.shieldUntil)}
            </div>
          )}
        </div>
      </div>

      {/* Production rates */}
      <div style={{ display: 'flex', gap: 4, padding: '5px 10px', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto' }}>
        {[
          { label: '💰', key: 'gold_mine', color: '#f4d03f' },
          { label: '🪵', key: 'lumber_mill', color: '#8B5E3C' },
          { label: '🪨', key: 'stone_quarry', color: '#aaa' },
          { label: '🌾', key: 'farm', color: '#7dbb3f' },
        ].map(({ label, key, color }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '3px 9px', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: 12 }}>{label}</span>
            <span style={{ fontSize: 11, color, fontWeight: 700 }}>+{fmt(productionRates[key] || 0)}/h</span>
          </div>
        ))}
      </div>

      {/* Map */}
      <div style={{ padding: '10px 8px' }}>
        <div style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          gap: 3,
          aspectRatio: `${COLS}/${ROWS}`,
          background: 'linear-gradient(135deg,#0d2208,#1a3d0f,#0d2208)',
          borderRadius: 14,
          padding: 6,
          border: '2px solid rgba(244,208,63,0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 0 40px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}>

          {/* Terrain tiles */}
          {Array.from({ length: COLS * ROWS }, (_, i) => {
            const isPath = pathCells.has(i);
            return (
              <div key={i} style={{
                background: isPath
                  ? 'linear-gradient(135deg,rgba(120,80,40,0.4),rgba(90,55,20,0.5))'
                  : 'linear-gradient(135deg,rgba(20,60,10,0.4),rgba(30,80,15,0.3))',
                borderRadius: 4,
                border: isPath
                  ? '1px solid rgba(150,100,50,0.2)'
                  : '1px solid rgba(30,80,20,0.3)',
              }} />
            );
          })}

          {/* Buildings */}
          {buildings.map(b => {
            const pos = BUILDING_LAYOUT[b.type];
            if (!pos) return null;
            const cfg = BUILDING_CONFIG[b.type] || { icon: '🏠', color: '#fff', glow: 'rgba(255,255,255,0.3)', bg: '#333' };
            const isSelected = selected === b.type;
            const isUpg = b.upgradeEndsAt && new Date() < new Date(b.upgradeEndsAt);
            const levelPct = Math.min((b.level / 30) * 100, 100);

            return (
              <div
                key={b.id}
                onClick={() => setSelected(isSelected ? null : b.type)}
                style={{
                  position: 'absolute',
                  left: `calc(${(pos.col / COLS) * 100}% + 6px)`,
                  top: `calc(${(pos.row / ROWS) * 100}% + 6px)`,
                  width: `calc(${(pos.size / COLS) * 100}% - 9px)`,
                  height: `calc(${(pos.size / ROWS) * 100}% - 9px)`,
                  background: isUpg
                    ? 'linear-gradient(145deg,#001a3c,#003366)'
                    : cfg.bg,
                  border: isSelected
                    ? `2px solid ${cfg.color}`
                    : isUpg
                    ? '2px solid #3498db'
                    : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: pos.size > 1 ? 10 : 7,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isSelected
                    ? `0 0 16px ${cfg.glow}, 0 0 4px rgba(0,0,0,0.5)`
                    : isUpg
                    ? '0 0 10px rgba(52,152,219,0.4)'
                    : '0 2px 6px rgba(0,0,0,0.4)',
                  transition: 'all 0.2s',
                  zIndex: 2,
                  overflow: 'hidden',
                  padding: 2,
                }}
              >
                {/* Level bar at bottom */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(0,0,0,0.4)' }}>
                  <div style={{ height: '100%', width: `${levelPct}%`, background: isUpg ? '#3498db' : cfg.color, borderRadius: 2, transition: 'width 0.3s' }} />
                </div>

                {/* Glow overlay when selected */}
                {isSelected && (
                  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle,${cfg.glow} 0%,transparent 70%)`, pointerEvents: 'none' }} />
                )}

                <span style={{
                  fontSize: pos.size > 1 ? 30 : 20,
                  filter: isUpg ? 'grayscale(0.3) brightness(0.7)' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                  lineHeight: 1,
                }}>
                  {isUpg ? '🔨' : cfg.icon}
                </span>

                <div style={{
                  fontSize: pos.size > 1 ? 9 : 8,
                  fontWeight: 700,
                  color: isUpg ? '#3498db' : cfg.color,
                  marginTop: 2,
                  textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                  textAlign: 'center',
                  lineHeight: 1.1,
                }}>
                  {isUpg
                    ? <span style={{ fontSize: 7 }}>{timeLeft(b.upgradeEndsAt)}</span>
                    : `Lv.${b.level}`
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected building panel */}
      {selected && selectedBuilding && (
        <div style={{
          margin: '0 10px 10px',
          background: 'linear-gradient(135deg,rgba(20,10,0,0.97),rgba(40,20,0,0.97))',
          border: `1px solid ${BUILDING_CONFIG[selected]?.color || '#f4d03f'}44`,
          borderRadius: 14,
          padding: 14,
          boxShadow: `0 4px 24px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)`,
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: BUILDING_CONFIG[selected]?.bg || '#333',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
                border: `1px solid ${BUILDING_CONFIG[selected]?.color || '#f4d03f'}44`,
                boxShadow: `0 0 10px ${BUILDING_CONFIG[selected]?.glow || 'transparent'}`,
              }}>
                {BUILDING_CONFIG[selected]?.icon}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: BUILDING_CONFIG[selected]?.color || '#f4d03f' }}>
                  {BUILDING_NAMES[selected] || selected}
                </div>
                <div style={{ fontSize: 12, color: '#a0845a' }}>רמה {selectedBuilding.level} / 30</div>
              </div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#6b3a00', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          </div>

          {/* Level progress */}
          <div style={{ height: 7, background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginBottom: 12, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(selectedBuilding.level / 30) * 100}%`,
              background: `linear-gradient(90deg,${BUILDING_CONFIG[selected]?.color || '#b8860b'}88,${BUILDING_CONFIG[selected]?.color || '#f4d03f'})`,
              borderRadius: 4,
              boxShadow: `0 0 6px ${BUILDING_CONFIG[selected]?.glow || 'transparent'}`,
            }} />
          </div>

          {selectedBuilding.upgradeEndsAt && new Date() < new Date(selectedBuilding.upgradeEndsAt) ? (
            <div style={{ textAlign: 'center', color: '#3498db', fontSize: 14, padding: '8px 0' }}>
              ⏳ משדרג... {timeLeft(selectedBuilding.upgradeEndsAt)}
            </div>
          ) : (
            <button
              className="btn btn-gold"
              style={{ width: '100%', fontSize: 14, padding: '12px' }}
              disabled={upgrading === selected}
              onClick={upgrade}
            >
              {upgrading === selected ? '⏳ שדרג...' : `⬆️ שדרג לרמה ${selectedBuilding.level + 1}`}
            </button>
          )}

          {msg && (
            <div style={{ textAlign: 'center', fontSize: 12, marginTop: 8, color: msg.startsWith('⬆️') ? '#27ae60' : '#e74c3c' }}>
              {msg}
            </div>
          )}
        </div>
      )}

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, padding: '0 10px 80px' }}>
        {[
          { label: 'בניינים', value: buildings.length, icon: '🏗️', color: '#f4d03f' },
          { label: 'בשדרוג', value: buildings.filter(b => b.upgradeEndsAt && new Date() < new Date(b.upgradeEndsAt)).length, icon: '⬆️', color: '#3498db' },
          { label: 'מגן', value: kingdom?.shieldActive ? 'פעיל' : 'כבוי', icon: '🛡️', color: kingdom?.shieldActive ? '#27ae60' : '#666' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{
            background: 'linear-gradient(135deg,rgba(0,0,0,0.5),rgba(20,10,0,0.6))',
            border: '1px solid rgba(244,208,63,0.1)',
            borderRadius: 10, padding: '10px 8px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 20 }}>{icon}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 10, color: '#7a5a30' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
