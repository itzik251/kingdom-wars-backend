import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useT, useLangStore } from '../i18n/useT';
import { LANGUAGES } from '../i18n/translations';
import { useGameStore } from '../store/gameStore';

interface WorldEvent {
  id: string;
  status: 'announced' | 'active' | 'finished';
  barbarianPower: number;
  participantCount: number;
  startsAt: string;
  endsAt: string;
  globalWin: boolean;
}

interface Registration {
  choice: 'fight' | 'shield' | 'none';
  defenderPower: number;
  won: boolean;
  gemReward: number;
  goldReward: number;
}

const FIGHT_WIN_GEM = 50;
const FIGHT_WIN_GOLD = 5000;
const SHIELD_GEM_COST = 10;

function countdown(target: string): string {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return '00:00:00';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export default function WorldEventPopup({ onClose }: { onClose: () => void }) {
  const t = useT();
  const { lang } = useLangStore();
  const isRtl = LANGUAGES.find(l => l.code === lang)?.rtl ?? false;
  const dir = isRtl ? 'rtl' : 'ltr';
  const kingdom = useGameStore(s => s.kingdom);

  const [data, setData] = useState<{ event: WorldEvent; registration: Registration | null } | null | false>(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [, setTick] = useState(0);

  useEffect(() => {
    loadEvent();
    const iv = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  async function loadEvent() {
    try {
      const res = await api.get('/world-event/current');
      setData(res.data ?? null);
    } catch { setData(null); }
  }

  async function register(choice: 'fight' | 'shield') {
    setError('');
    setRegistering(true);
    try {
      await api.post('/world-event/register', { choice });
      await loadEvent();
    } catch (e: any) {
      const code = e?.response?.data?.message;
      if (code === 'NOT_ENOUGH_GEMS') setError(`❌ ${t('not_enough_gems')}`);
      else setError('❌ ' + (code || t('error')));
    }
    setRegistering(false);
  }

  const ev = data && (data as any).event ? (data as any).event as WorldEvent : null;
  const reg: Registration | null = data && (data as any).registration ? (data as any).registration : null;

  const isAnnounced = ev?.status === 'announced';
  const isActive = ev?.status === 'active';
  const isFinished = ev?.status === 'finished';
  const hasChoice = reg && reg.choice !== 'none';

  // Shield is free if kingdom already has an active game shield covering the invasion
  const shieldIsFree = ev && kingdom?.shieldUntil &&
    new Date(kingdom.shieldUntil).getTime() >= new Date(ev.startsAt).getTime();

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 700 }} />

      {/* Bottom sheet */}
      <div dir={dir} style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 701,
        background: '#0f1520', borderRadius: '20px 20px 0 0',
        border: '1px solid #3a1a1a', borderBottom: 'none',
        maxHeight: '90vh', overflowY: 'auto',
        padding: '0 0 32px',
      }}>
        {/* Handle + close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 0' }}>
          <div style={{ width: 40, height: 4, background: '#333', borderRadius: 2, margin: '0 auto' }} />
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888', fontSize: 20, cursor: 'pointer', position: 'absolute', top: 12, right: 14 }}>✕</button>
        </div>

        <div style={{ padding: '12px 16px 0' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <img src="/assets/fx_attack.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
              {t('event_title')}
              <img src="/assets/fx_attack.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
            </div>
            {ev && (
              <div style={{ fontSize: 12, color: ev.status === 'active' ? '#ff6666' : ev.status === 'announced' ? '#f0a500' : '#44bb44', fontWeight: 700 }}>
                {isAnnounced && `${t('event_starts_in')} ${countdown(ev.startsAt)}`}
                {isActive && `${t('event_ends_in')} ${countdown(ev.endsAt)}`}
                {isFinished && t('event_status_finished')}
              </div>
            )}
          </div>

          {/* Loading */}
          {data === false && <div style={{ textAlign: 'center', color: '#666', padding: 20 }}>⏳</div>}

          {/* No event */}
          {data === null && (
            <div style={{ textAlign: 'center', color: '#666', padding: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏰</div>
              <div>{t('event_no_event')}</div>
              <div style={{ fontSize: 12, color: '#444', marginTop: 4 }}>{t('event_next_event')}</div>
            </div>
          )}

          {ev && (
            <>
              {/* Power comparison */}
              <div style={{ background: '#1a2030', borderRadius: 12, padding: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#aaa' }}>{t('event_barbarian_power')}</span>
                  <span style={{ fontWeight: 700, color: '#ff6666' }}>💀 {ev.barbarianPower.toLocaleString()}</span>
                </div>
                {reg && reg.defenderPower > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#aaa' }}>{t('event_your_power')}</span>
                    <span style={{ fontWeight: 700, color: reg.defenderPower >= ev.barbarianPower ? '#44ff88' : '#ff9944' }}>
                      🛡️ {reg.defenderPower.toLocaleString()}
                      {reg.defenderPower >= ev.barbarianPower ? ' ✅' : ' ⚠️'}
                    </span>
                  </div>
                )}
                {ev.participantCount > 0 && (
                  <div style={{ fontSize: 11, color: '#555', marginTop: 6 }}>{t('event_participants')} {ev.participantCount}</div>
                )}
              </div>

              {/* Results (finished) */}
              {isFinished && (
                <div style={{ background: reg?.won ? '#0a200a' : reg?.choice === 'fight' ? '#200a0a' : '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 12, textAlign: 'center', border: `1px solid ${reg?.won ? '#447744' : '#774444'}` }}>
                  {!hasChoice && <div style={{ color: '#888' }}>{t('event_result_noshow')}</div>}
                  {reg?.choice === 'fight' && reg.won && <div style={{ color: '#88ff88', fontWeight: 700 }}>{t('event_result_win')}</div>}
                  {reg?.choice === 'fight' && !reg.won && <div style={{ color: '#ff8888', fontWeight: 700 }}>{t('event_result_lose')}</div>}
                  {reg?.choice === 'shield' && <div style={{ color: '#aaa' }}>{t('event_result_shield').replace('{cost}', String(SHIELD_GEM_COST))}</div>}
                  {reg?.won && reg.gemReward > 0 && (
                    <div style={{ fontSize: 13, color: '#aaffaa', marginTop: 6 }}>
                      {t('event_reward_received').replace('{gems}', String(reg.gemReward)).replace('{gold}', String(reg.goldReward))}
                    </div>
                  )}
                  {reg?.choice === 'fight' && !reg.won && (
                    <div style={{ fontSize: 12, color: '#ff9966', marginTop: 6 }}>{t('event_fight_reward_lose')}</div>
                  )}
                  <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
                    {ev.globalWin ? t('event_global_win') : t('event_global_lose')}
                  </div>
                </div>
              )}

              {/* Choice buttons */}
              {(isAnnounced || isActive) && !hasChoice && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', marginBottom: 10 }}>{t('event_choose_title')}</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {/* Fight */}
                    <div style={{ flex: 1, background: '#1e0808', border: '1px solid #882222', borderRadius: 12, padding: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t('event_fight_title')}</div>
                      <div style={{ fontSize: 10, color: '#ccc', marginBottom: 6, lineHeight: 1.4 }}>{t('event_fight_desc')}</div>
                      <div style={{ fontSize: 10, color: '#ffd700', marginBottom: 2 }}>{t('event_fight_reward').replace('{gems}',String(FIGHT_WIN_GEM)).replace('{gold}',String(FIGHT_WIN_GOLD.toLocaleString()))}</div>
                      <div style={{ fontSize: 9, color: '#cc5533' }}>{t('event_fight_reward_lose')}</div>
                      <button disabled={registering} onClick={() => register('fight')}
                        style={{ marginTop: 8, width: '100%', padding: '7px 0', background: '#881818', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                        {registering ? '...' : t('event_fight_btn')}
                      </button>
                    </div>
                    {/* Shield */}
                    <div style={{ flex: 1, background: '#080818', border: `1px solid ${shieldIsFree ? '#44aa44' : '#222288'}`, borderRadius: 12, padding: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t('event_shield_title')}</div>
                      <div style={{ fontSize: 10, color: '#ccc', marginBottom: 6, lineHeight: 1.4 }}>
                        {shieldIsFree ? t('event_shield_free_desc') : t('event_shield_desc').replace('{cost}', String(SHIELD_GEM_COST))}
                      </div>
                      <div style={{ fontSize: 10, color: shieldIsFree ? '#44ff88' : '#8888ff' }}>
                        {shieldIsFree ? `✅ ${t('event_shield_free')}` : t('event_shield_reward').replace('{cost}', String(SHIELD_GEM_COST))}
                      </div>
                      <button disabled={registering} onClick={() => register('shield')}
                        style={{ marginTop: 16, width: '100%', padding: '7px 0', background: shieldIsFree ? '#185a18' : '#182288', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                        {registering ? '...' : t('event_shield_btn')}
                      </button>
                    </div>
                  </div>
                  {error && <div style={{ color: '#ff6666', fontSize: 12, textAlign: 'center', marginTop: 8 }}>{error}</div>}
                </div>
              )}

              {/* Already registered */}
              {(isAnnounced || isActive) && hasChoice && (
                <div style={{ background: '#0d1d0d', border: '1px solid #336633', borderRadius: 12, padding: 12, marginBottom: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: '#88ff88', marginBottom: 4 }}>
                    {reg!.choice === 'fight' ? t('event_registered_fight') : t('event_registered_shield')}
                  </div>
                  {reg!.choice === 'fight' && reg!.defenderPower > 0 && (
                    <div style={{ fontSize: 11, color: reg!.defenderPower >= ev.barbarianPower ? '#44ff88' : '#ff9944' }}>
                      {t('event_your_power')} {reg!.defenderPower.toLocaleString()} / {ev.barbarianPower.toLocaleString()}
                    </div>
                  )}
                  {error && <div style={{ color: '#ff6666', fontSize: 12, marginTop: 6 }}>{error}</div>}
                  <button disabled={registering} onClick={() => register(reg!.choice === 'fight' ? 'shield' : 'fight')}
                    style={{ marginTop: 8, padding: '5px 14px', background: 'transparent', border: '1px solid #555', borderRadius: 8, color: '#aaa', fontSize: 11, cursor: 'pointer' }}>
                    {t('event_change_choice')}
                  </button>
                </div>
              )}
            </>
          )}

          {/* How it works */}
          <div style={{ background: '#111820', borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{t('event_how_title')}</div>
            {['event_how1','event_how2','event_how3','event_how4'].map(k => (
              <div key={k} style={{ fontSize: 11, color: '#bbb', marginBottom: 5, lineHeight: 1.4 }}>{t(k)}</div>
            ))}
          </div>

          {/* Defense tips */}
          <div style={{ background: '#0a180a', border: '1px solid #1e4a1e', borderRadius: 12, padding: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#88ff88', marginBottom: 8 }}>{t('event_tips_title')}</div>
            {['event_tip1','event_tip2','event_tip3','event_tip4','event_tip5'].map(k => (
              <div key={k} style={{ fontSize: 11, color: '#aaddaa', marginBottom: 5, lineHeight: 1.4 }}>{t(k)}</div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
