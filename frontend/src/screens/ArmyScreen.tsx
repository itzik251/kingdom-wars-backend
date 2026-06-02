import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { fmt, timeLeft, UNIT_NAMES } from '../utils/format';
import { api } from '../api/client';

const UNIT_CONFIG: Record<string, { icon: string; gold: number; power: number; color: string }> = {
  spearman:    { icon: '🗡️',  gold: 10,  power: 1,  color: '#aaa'    },
  archer:      { icon: '🏹',  gold: 20,  power: 2,  color: '#7dbb3f' },
  swordsman:   { icon: '⚔️',  gold: 40,  power: 4,  color: '#3498db' },
  cavalry:     { icon: '🐴',  gold: 80,  power: 9,  color: '#9b59b6' },
  catapult:    { icon: '💣',  gold: 200, power: 15, color: '#e67e22' },
  elite_guard: { icon: '🛡️',  gold: 500, power: 25, color: '#f4d03f' },
};

export default function ArmyScreen() {
  const { units, kingdom, refresh } = useGameStore();
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const totalPower = units.reduce((sum, u) => {
    return sum + u.count * (UNIT_CONFIG[u.type]?.power || 0);
  }, 0);

  async function train(type: string) {
    const amount = amounts[type] || 1;
    setLoading(type);
    setMsg('');
    try {
      await api.post('/units/train', { type, amount });
      await refresh();
      setMsg(`✅ מגייס ${amount} ${UNIT_NAMES[type] || type}`);
    } catch (e: any) {
      setMsg('❌ ' + (e.response?.data?.message || 'שגיאה'));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="screen">
      <div className="screen-title">⚔️ צבא</div>

      {/* Total power card */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(231,76,60,0.15),rgba(192,57,43,0.1))',
        border: '1px solid rgba(231,76,60,0.3)',
        borderRadius: 14, padding: '14px 20px', marginBottom: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ color: '#a0845a', fontSize: 12 }}>כוח כולל</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#e74c3c', textShadow: '0 0 10px rgba(231,76,60,0.4)' }}>
            ⚔️ {fmt(totalPower)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#a0845a', fontSize: 12 }}>חיילים</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            {fmt(units.reduce((s, u) => s + u.count, 0))}
          </div>
        </div>
      </div>

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 12,
          background: msg.startsWith('✅') ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)',
          border: `1px solid ${msg.startsWith('✅') ? '#27ae60' : '#e74c3c'}44`,
          color: msg.startsWith('✅') ? '#27ae60' : '#e74c3c',
          fontSize: 13, textAlign: 'center',
        }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {units.map(u => {
          const cfg = UNIT_CONFIG[u.type];
          const isTraining = u.trainingEndsAt && new Date() < new Date(u.trainingEndsAt);

          return (
            <div key={u.type} style={{
              background: 'linear-gradient(135deg,var(--bg-card),var(--bg-card2))',
              border: `1px solid ${cfg?.color || '#f4d03f'}33`,
              borderRadius: 12, padding: 14,
              boxShadow: isTraining ? '0 0 10px rgba(52,152,219,0.2)' : 'none',
            }} className={isTraining ? 'upgrading-building' : ''}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10,
                    background: `${cfg?.color || '#f4d03f'}18`,
                    border: `1px solid ${cfg?.color || '#f4d03f'}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}>
                    {cfg?.icon || '👤'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: cfg?.color || '#f4d03f' }}>
                      {UNIT_NAMES[u.type] || u.type}
                    </div>
                    <div style={{ color: '#a0845a', fontSize: 11, display: 'flex', gap: 8, marginTop: 1 }}>
                      <span>⚔️ {cfg?.power} כוח</span>
                      <span>💰 {cfg?.gold} זהב/יחידה</span>
                    </div>
                  </div>
                </div>
                <div style={{
                  background: `${cfg?.color || '#f4d03f'}22`,
                  border: `1px solid ${cfg?.color || '#f4d03f'}44`,
                  borderRadius: 8, padding: '4px 12px',
                  fontSize: 15, fontWeight: 800, color: cfg?.color || '#f4d03f',
                }}>
                  {fmt(u.count)}
                </div>
              </div>

              {isTraining ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(52,152,219,0.1)', border: '1px solid rgba(52,152,219,0.3)',
                  color: '#3498db', fontSize: 13,
                }}>
                  ⏳ מגייס {u.trainingCount}... {timeLeft(u.trainingEndsAt)}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    value={amounts[u.type] || ''}
                    placeholder="כמות"
                    onChange={e => setAmounts(prev => ({ ...prev, [u.type]: parseInt(e.target.value) || 1 }))}
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'var(--text)', fontSize: 14,
                      outline: 'none',
                    }}
                  />
                  <button
                    className="btn btn-gold"
                    style={{ padding: '9px 18px', fontSize: 13 }}
                    disabled={loading === u.type}
                    onClick={() => train(u.type)}
                  >
                    {loading === u.type ? '...' : 'גייס'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
