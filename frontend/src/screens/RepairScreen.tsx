import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { api } from '../api/client';
import { BUILDING_ICONS, fmt } from '../utils/format';
import { useT } from '../i18n/useT';
import Countdown from '../components/Countdown';
import { ResIcon } from '../components/ResIcon';

interface RepairCost { cost: { gold: number; wood: number; stone: number }; repairTimeSeconds: number; }

export default function RepairScreen() {
  const { buildings, refresh } = useGameStore();
  const [repairing, setRepairing] = useState<string | null>(null);
  const [costs, setCosts] = useState<Record<string, RepairCost>>({});
  const [msg, setMsg] = useState('');
  const t = useT();

  const damaged = buildings.filter((b: any) => b.needsRepair);

  // Load repair costs for all damaged buildings
  useEffect(() => {
    for (const b of damaged) {
      if (!costs[b.id]) {
        api.get(`/buildings/repair-cost/${b.id}`)
          .then(c => setCosts(prev => ({ ...prev, [b.id]: c })))
          .catch(() => {});
      }
    }
  }, [damaged.length]);

  async function repair(buildingId: string) {
    setRepairing(buildingId); setMsg('');
    try {
      await api.post(`/buildings/repair/${buildingId}`);
      await refresh();
      setMsg('✅ ' + t('repair_started'));
    } catch (e: any) {
      setMsg('❌ ' + (e.response?.data?.message || t('error')));
    } finally { setRepairing(null); }
  }

  // Buildings currently being repaired (repairEndsAt set, needsRepair still true)
  const repairing_list = buildings.filter((b: any) => b.needsRepair && b.repairEndsAt && new Date(b.repairEndsAt) > new Date());

  return (
    <div className="screen">
      <div className="screen-title">{t('repair_title')}</div>

      {msg && (
        <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 12, background: msg.startsWith('✅') ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)', border: `1px solid ${msg.startsWith('✅') ? '#27ae60' : '#e74c3c'}44`, color: msg.startsWith('✅') ? '#27ae60' : '#e74c3c', fontSize: 13, textAlign: 'center' }}>
          {msg}
        </div>
      )}

      {/* Currently repairing */}
      {repairing_list.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f4d03f', marginBottom: 8 }}>🔨 {t('repairing_now')}</div>
          {repairing_list.map((b: any) => (
            <div key={b.id} style={{ background: 'rgba(244,208,63,0.08)', border: '1px solid rgba(244,208,63,0.25)', borderRadius: 12, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 24 }}>{BUILDING_ICONS[b.type] || '🏠'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#f4d03f' }}>{t('b_' + b.type)} Lv.{b.level}</div>
                <div style={{ fontSize: 11, color: '#a0845a', marginTop: 3 }}>
                  🔨 {t('repair_done_in')}: <Countdown endsAt={b.repairEndsAt} onEnd={() => setTimeout(refresh, 1500)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {damaged.filter((b: any) => !b.repairEndsAt || new Date(b.repairEndsAt) <= new Date()).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#a0845a' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏗️</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{t('all_intact')}</div>
          <div style={{ fontSize: 13 }}>{t('repair_hint')}</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 12, color: '#e74c3c', marginBottom: 12 }}>
            {t('damaged_warning', { n: damaged.length })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {damaged
              .filter((b: any) => !b.repairEndsAt || new Date(b.repairEndsAt) <= new Date())
              .map((b: any) => {
                const rc = costs[b.id];
                return (
                  <div key={b.id} style={{ background: 'linear-gradient(135deg,rgba(60,10,10,0.9),rgba(40,5,5,0.8))', border: '1px solid rgba(231,76,60,0.35)', borderRadius: 12, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                          {BUILDING_ICONS[b.type] || '🏠'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#e74c3c' }}>{t('b_' + b.type)}</div>
                          <div style={{ fontSize: 11, color: '#a0845a' }}>{t('repair_level_battle', { n: b.level })}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 18 }}>💥</span>
                    </div>

                    {/* Cost display */}
                    {rc && (
                      <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12 }}>
                        <div style={{ color: '#a0845a', marginBottom: 5 }}>💸 {t('repair_cost')}:</div>
                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                          {rc.cost.gold  > 0 && <span style={{ display:'flex', alignItems:'center', gap:3 }}><ResIcon type="gold" /> {fmt(rc.cost.gold)}</span>}
                          {rc.cost.wood  > 0 && <span style={{ display:'flex', alignItems:'center', gap:3 }}><ResIcon type="wood" /> {fmt(rc.cost.wood)}</span>}
                          {rc.cost.stone > 0 && <span style={{ display:'flex', alignItems:'center', gap:3 }}><ResIcon type="stone" /> {fmt(rc.cost.stone)}</span>}
                        </div>
                        <div style={{ color: '#666', marginTop: 5 }}>
                          ⏱️ {t('repair_time')}: ~{Math.ceil(rc.repairTimeSeconds / 60)} {t('minutes')}
                        </div>
                      </div>
                    )}

                    <button
                      className="btn btn-gold"
                      style={{ width: '100%', fontSize: 13 }}
                      disabled={repairing === b.id}
                      onClick={() => repair(b.id)}
                    >
                      {repairing === b.id ? t('repair_fixing') : t('repair_btn')}
                    </button>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
