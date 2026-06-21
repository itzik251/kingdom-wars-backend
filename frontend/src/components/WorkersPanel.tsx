import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { fmt } from '../utils/format';
import { api } from '../api/client';
import { useT } from '../i18n/useT';
import { ResIcon } from './ResIcon';

interface Props { onClose: () => void; }

export default function WorkersPanel({ onClose }: Props) {
  const { kingdom, buildings, refresh } = useGameStore();
  const maxWorkers = useGameStore(s => s.kingdom?.maxWorkers ?? 5);
  const [loading, setLoading] = useState<'hire' | 'fire' | null>(null);
  const [msg, setMsg] = useState('');
  const t = useT();

  const workers = kingdom?.workers ?? 0;
  const workerBonus = workers * 4;
  const workerSalary = workers * 5;
  const workerFoodPerHour = workers * 2;

  const hasAcademy = (buildings ?? []).some(b => b.type === 'academy');
  const explorerCount = kingdom?.explorerCount ?? 0;
  const explorerGoldPerHour = explorerCount * 10;
  const explorerFoodPerHour = explorerCount * 3;

  async function hire() {
    setLoading('hire'); setMsg('');
    try {
      await api.post('/kingdom/hire-worker');
      await refresh();
      setMsg(t('worker_hired'));
    } catch (e: any) {
      const raw: string = e.response?.data?.message || '';
      const maxMatch = raw.match(/MAX_WORKERS:(\d+)/);
      if (maxMatch) setMsg('❌ ' + t('worker_max', { n: maxMatch[1] }));
      else if (raw === 'NOT_ENOUGH_GOLD_WORKER') setMsg('❌ ' + t('not_enough_gold_worker'));
      else setMsg('❌ ' + (raw || t('error')));
    } finally { setLoading(null); }
  }

  async function fire() {
    setLoading('fire'); setMsg('');
    try {
      await api.post('/kingdom/fire-worker');
      await refresh();
      setMsg(t('worker_fired'));
    } catch (e: any) {
      const raw: string = e.response?.data?.message || '';
      if (raw === 'NO_WORKERS_TO_FIRE') setMsg('❌ ' + t('no_workers_to_fire'));
      else setMsg('❌ ' + (raw || t('error')));
    } finally { setLoading(null); }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.85)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        overflowY: 'auto',
        background: 'linear-gradient(180deg,#0a1800,#060e04)',
        borderRadius: 0,
        border: 'none',
        padding: '20px 16px 30px',
        animation: 'slideUp 0.25s ease-out',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#27ae60' }}>{t('workers_title')}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.25)', borderRadius: 14, padding: '16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ color: '#a0845a', fontSize: 12 }}>{t('workers_active')}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#27ae60' }}>🧑 {workers} / {maxWorkers}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: '#a0845a' }}>
              <div>{t('production_bonus')}: <span style={{ color: '#f4d03f', fontWeight: 700 }}>+{workerBonus}%</span></div>
              <div>{t('salary')}: <span style={{ color: '#e74c3c', fontWeight: 700, display:'inline-flex', alignItems:'center', gap:3 }}>-{fmt(workerSalary)} <ResIcon type="gold" />{t('per_hour')}</span></div>
              {workerFoodPerHour > 0 && <div>אוכל: <span style={{ color: '#e74c3c', fontWeight: 700, display:'inline-flex', alignItems:'center', gap:3 }}>-{workerFoodPerHour} <ResIcon type="food" />{t('per_hour')}</span></div>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Array.from({ length: maxWorkers }).map((_, i) => (
              <div key={i} style={{
                width: 36, height: 36, borderRadius: 8,
                background: i < workers ? 'rgba(39,174,96,0.3)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${i < workers ? 'rgba(39,174,96,0.5)' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>
                {i < workers ? '👷' : '·'}
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#a0845a', marginBottom: 14, lineHeight: 1.6 }}>
          {t('workers_info')}
        </div>

        {hasAcademy && (<>
          <div style={{ background: 'rgba(144,80,200,0.08)', border: '1px solid rgba(144,80,200,0.25)', borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ color: '#a0845a', fontSize: 12 }}>{t('explorers_active')}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#9b59b6' }}>🧭 {explorerCount}</div>
              </div>
              {explorerCount > 0 && (
                <div style={{ textAlign: 'right', fontSize: 12, color: '#a0845a' }}>
                  <div>{t('salary')}: <span style={{ color: '#e74c3c', fontWeight: 700, display:'inline-flex', alignItems:'center', gap:3 }}>-{explorerGoldPerHour} <ResIcon type="gold" />{t('per_hour')}</span></div>
                  <div>{t('food')}: <span style={{ color: '#e74c3c', fontWeight: 700, display:'inline-flex', alignItems:'center', gap:3 }}>-{explorerFoodPerHour} <ResIcon type="food" />{t('per_hour')}</span></div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {explorerCount === 0
                ? <div style={{ fontSize: 12, color: '#666' }}>{t('exp_need_explorer')}</div>
                : Array.from({ length: explorerCount }).map((_, i) => (
                    <div key={i} style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(144,80,200,0.2)', border: '1px solid rgba(144,80,200,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                      🧭
                    </div>
                  ))
              }
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#a0845a', marginBottom: 14, lineHeight: 1.6 }}>
            {t('explorers_info')}
          </div>
        </>)}

        {msg && (
          <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 12, background: msg.startsWith('✅') ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)', border: `1px solid ${msg.startsWith('✅') ? '#27ae60' : '#e74c3c'}44`, color: msg.startsWith('✅') ? '#27ae60' : '#e74c3c', fontSize: 13, textAlign: 'center' }}>
            {msg}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-green"
            style={{ flex: 1, padding: '12px', fontSize: 14, opacity: workers < maxWorkers ? 1 : 0.4 }}
            disabled={!!loading || workers >= maxWorkers}
            onClick={hire}
          >
            {loading === 'hire' ? '...' : t('hire_worker')}
          </button>
          <button
            className="btn btn-red"
            style={{ flex: 1, padding: '12px', fontSize: 14, opacity: workers > 0 ? 1 : 0.4 }}
            disabled={!!loading || workers <= 0}
            onClick={fire}
          >
            {loading === 'fire' ? '...' : t('fire_worker')}
          </button>
        </div>
      </div>
    </div>
  );
}
