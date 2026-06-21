import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useT, useLangStore } from '../i18n/useT';
import { LANGUAGES } from '../i18n/translations';

interface WorldEvent {
  id: string;
  type: string;
  status: 'announced' | 'active' | 'finished';
  barbarianPower: number;
  participantCount: number;
  winnersCount: number;
  startsAt: string;
  endsAt: string;
  globalWin: boolean;
}

interface Registration {
  choice: 'fight' | 'shield' | 'none';
  defenderPower: number;
  won: boolean;
  rewardClaimed: boolean;
  gemReward: number;
  goldReward: number;
}

function countdown(target: string): string {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return '00:00:00';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const FIGHT_WIN_GEM = 30;
const FIGHT_WIN_GOLD = 2000;
const FIGHT_LOSE_GEM = Math.floor(30 * 0.3);
const FIGHT_LOSE_GOLD = Math.floor(2000 * 0.3);
const SHIELD_GEM = 10;
const SHIELD_GOLD = 500;

export default function WorldEventScreen() {
  const { lang } = useLangStore();
  const t = useT();
  const isRtl = LANGUAGES.find(l => l.code === lang)?.rtl ?? false;
  const dir = isRtl ? 'rtl' : 'ltr';

  const [data, setData] = useState<{ event: WorldEvent; registration: Registration | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    loadEvent();
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  async function loadEvent() {
    try {
      const res = await api.get('/world-event/current');
      setData(res.data);
    } catch {}
    setLoading(false);
  }

  async function register(choice: 'fight' | 'shield') {
    setRegistering(true);
    try {
      await api.post('/world-event/register', { choice });
      await loadEvent();
    } catch {}
    setRegistering(false);
  }

  if (loading) return <div className="screen" dir={dir}><div style={{ padding: 20, textAlign: 'center' }}>⏳</div></div>;

  const ev = data?.event;
  const reg = data?.registration;

  if (!ev) {
    return (
      <div className="screen" dir={dir} style={{ padding: 16 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 8 }}>⚔️ {t('event_title')}</h2>
        <div style={{ background: '#1e2433', borderRadius: 12, padding: 20, textAlign: 'center', color: '#aaa' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏰</div>
          <div style={{ fontSize: 15, marginBottom: 6 }}>{t('event_no_event')}</div>
          <div style={{ fontSize: 13, color: '#666' }}>{t('event_next_event')}</div>
        </div>
        <HowItWorks t={t} dir={dir} />
        <DefenseTips t={t} dir={dir} />
      </div>
    );
  }

  const isActive = ev.status === 'active';
  const isAnnounced = ev.status === 'announced';
  const isFinished = ev.status === 'finished';
  const hasChoice = reg && reg.choice !== 'none';

  const statusLabel = isAnnounced ? t('event_status_announced') : isActive ? t('event_status_active') : t('event_status_finished');
  const statusColor = isAnnounced ? '#f0a500' : isActive ? '#ff4444' : '#44bb44';

  return (
    <div className="screen" dir={dir} style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#3a0a0a,#6b1010)', borderRadius: 14, padding: 16, marginBottom: 12, textAlign: 'center', border: '1px solid #a03030' }}>
        <div style={{ fontSize: 13, color: statusColor, fontWeight: 700, marginBottom: 4 }}>{statusLabel}</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>⚔️ {t('event_title')}</h2>
        {isAnnounced && (
          <div style={{ fontSize: 13, color: '#ddd' }}>
            {t('event_starts_in')} <span style={{ fontWeight: 700, color: '#f0a500' }}>{countdown(ev.startsAt)}</span>
          </div>
        )}
        {isActive && (
          <div style={{ fontSize: 13, color: '#ddd' }}>
            {t('event_ends_in')} <span style={{ fontWeight: 700, color: '#ff6666' }}>{countdown(ev.endsAt)}</span>
          </div>
        )}
        {isFinished && (
          <div style={{ fontSize: 12, color: '#888' }}>
            {t('event_ended_at')} {new Date(ev.endsAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Barbarian Power Bar */}
      <div style={{ background: '#1e2433', borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: '#ccc' }}>{t('event_barbarian_power')}</span>
          <span style={{ fontWeight: 700, color: '#ff6666' }}>💀 {ev.barbarianPower.toLocaleString()}</span>
        </div>
        {reg && reg.defenderPower > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: '#ccc' }}>{t('event_your_power')}</span>
            <span style={{ fontWeight: 700, color: reg.defenderPower >= ev.barbarianPower ? '#44ff88' : '#ff9944' }}>
              🛡️ {reg.defenderPower.toLocaleString()}
            </span>
          </div>
        )}
        {ev.participantCount > 0 && (
          <div style={{ fontSize: 12, color: '#666' }}>
            {t('event_participants')} {ev.participantCount}
          </div>
        )}
      </div>

      {/* Results (finished) */}
      {isFinished && reg && (
        <div style={{ background: reg.won ? '#0a2a0a' : '#2a0a0a', borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${reg.won ? '#44aa44' : '#aa4444'}`, textAlign: 'center' }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>
            {reg.choice === 'fight' && reg.won && t('event_result_win')}
            {reg.choice === 'fight' && !reg.won && t('event_result_lose')}
            {reg.choice === 'shield' && t('event_result_shield')}
            {!hasChoice && '🚫 לא השתתפת באירוע'}
          </div>
          {hasChoice && (
            <div style={{ fontSize: 13, color: '#aaffaa' }}>
              {t('event_reward_received').replace('{gems}', String(reg.gemReward)).replace('{gold}', String(reg.goldReward))}
            </div>
          )}
          {isFinished && (
            <div style={{ marginTop: 10, fontSize: 13, color: '#ccc' }}>
              {ev.globalWin ? t('event_global_win') : t('event_global_lose')}
            </div>
          )}
        </div>
      )}

      {/* Choice buttons (announced or active, no choice yet) */}
      {(isAnnounced || isActive) && !hasChoice && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, textAlign: 'center' }}>{t('event_choose_title')}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {/* Fight card */}
            <div style={{ flex: 1, background: '#2a1010', border: '1px solid #aa3333', borderRadius: 12, padding: 14, cursor: registering ? 'default' : 'pointer' }}
              onClick={() => !registering && register('fight')}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{t('event_fight_title')}</div>
              <div style={{ fontSize: 11, color: '#ccc', marginBottom: 8, lineHeight: 1.4 }}>{t('event_fight_desc')}</div>
              <div style={{ fontSize: 11, color: '#ffd700' }}>{t('event_fight_reward').replace('{gems}', String(FIGHT_WIN_GEM)).replace('{gold}', String(FIGHT_WIN_GOLD))}</div>
              <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{t('event_fight_reward_lose').replace('{gems}', String(FIGHT_LOSE_GEM)).replace('{gold}', String(FIGHT_LOSE_GOLD))}</div>
              <button style={{ marginTop: 10, width: '100%', padding: '8px 0', background: '#aa2222', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                disabled={registering}>
                {registering ? '...' : t('event_fight_btn')}
              </button>
            </div>
            {/* Shield card */}
            <div style={{ flex: 1, background: '#10102a', border: '1px solid #3333aa', borderRadius: 12, padding: 14, cursor: registering ? 'default' : 'pointer' }}
              onClick={() => !registering && register('shield')}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{t('event_shield_title')}</div>
              <div style={{ fontSize: 11, color: '#ccc', marginBottom: 8, lineHeight: 1.4 }}>{t('event_shield_desc')}</div>
              <div style={{ fontSize: 11, color: '#88aaff' }}>{t('event_shield_reward').replace('{gems}', String(SHIELD_GEM)).replace('{gold}', String(SHIELD_GOLD))}</div>
              <button style={{ marginTop: 20, width: '100%', padding: '8px 0', background: '#2233aa', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                disabled={registering}>
                {registering ? '...' : t('event_shield_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Already registered */}
      {(isAnnounced || isActive) && hasChoice && (
        <div style={{ background: '#111d11', border: '1px solid #447744', borderRadius: 12, padding: 14, marginBottom: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#88ff88', marginBottom: 6 }}>
            {reg!.choice === 'fight' ? t('event_registered_fight') : t('event_registered_shield')}
          </div>
          {reg!.choice === 'fight' && reg!.defenderPower > 0 && (
            <div style={{ fontSize: 12, color: reg!.defenderPower >= ev.barbarianPower ? '#44ff88' : '#ff9944' }}>
              {reg!.defenderPower >= ev.barbarianPower ? '✅' : '⚠️'} {t('event_your_power')} {reg!.defenderPower.toLocaleString()} / {ev.barbarianPower.toLocaleString()}
            </div>
          )}
          <button
            style={{ marginTop: 10, padding: '6px 16px', background: 'transparent', border: '1px solid #666', borderRadius: 8, color: '#aaa', fontSize: 12, cursor: 'pointer' }}
            onClick={() => register(reg!.choice === 'fight' ? 'shield' : 'fight')}
            disabled={registering}>
            {t('event_change_choice')}
          </button>
        </div>
      )}

      <HowItWorks t={t} dir={dir} />
      <DefenseTips t={t} dir={dir} />
    </div>
  );
}

function HowItWorks({ t, dir }: { t: (k: string) => string; dir: string }) {
  return (
    <div style={{ background: '#111820', borderRadius: 12, padding: 14, marginBottom: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>{t('event_how_title')}</div>
      {['event_how1','event_how2','event_how3','event_how4'].map(k => (
        <div key={k} style={{ fontSize: 12, color: '#ccc', marginBottom: 6, lineHeight: 1.4 }}>{t(k)}</div>
      ))}
    </div>
  );
}

function DefenseTips({ t, dir }: { t: (k: string) => string; dir: string }) {
  return (
    <div style={{ background: '#0a1a0a', border: '1px solid #2a5a2a', borderRadius: 12, padding: 14, marginBottom: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14, color: '#88ff88' }}>{t('event_tips_title')}</div>
      {['event_tip1','event_tip2','event_tip3','event_tip4','event_tip5'].map(k => (
        <div key={k} style={{ fontSize: 12, color: '#aaddaa', marginBottom: 6, lineHeight: 1.4 }}>{t(k)}</div>
      ))}
    </div>
  );
}
