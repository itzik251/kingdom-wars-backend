import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { fmt } from '../utils/format';
import { useT, useLangStore } from '../i18n/useT';
import { LANGUAGES } from '../i18n/translations';

interface ReferralStats {
  referralCode: string;
  link: string;
  referredCount: number;
  totalReferredCount: number;
  claimedCount: number;
  pendingRewards: { gems: number; skins: number; vipDays: number };
  hasPending: boolean;
  nextMilestones: { gems100At: number; bonus200At: number; skinAt: number; vipAt: number };
  milestones: { count: number; gems: number; label: string; skin?: string; hero?: string; reached: boolean }[];
}

export default function ReferralScreen() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [msg, setMsg] = useState('');
  const t = useT();
  const { lang } = useLangStore();
  const isRtl = LANGUAGES.find(l => l.code === lang)?.rtl ?? true;
  const dir = isRtl ? 'rtl' : 'ltr';

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await api.get('/referral');
    setStats(data);
  }

  function copyLink() {
    navigator.clipboard.writeText(stats!.link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareLink() {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(stats!.link)}&text=${encodeURIComponent(`⚔️ ${t('share_invite_text')}`)}`);
    } else {
      copyLink();
    }
  }

  async function claimAll() {
    setClaiming(true);
    setMsg('');
    try {
      const result = await api.post('/referral/claim');
      if (result.error) { setMsg(result.error); return; }
      setMsg(t('ref_gems_received', { n: result.gems ?? result.newClaimedCount ?? 0 }));
      await load();
    } catch (e: any) {
      setMsg(e.response?.data?.message || t('error'));
    } finally {
      setClaiming(false);
    }
  }

  if (!stats) return <div className="screen" style={{ textAlign: 'center', paddingTop: 60, color: 'var(--text-dim)' }}>{t('loading')}</div>;

  const pendingActivation = Math.max(0, (stats.totalReferredCount ?? 0) - stats.referredCount);

  return (
    <div className="screen" dir={dir}>
      <div className="screen-title">{t('referral_title')}</div>

      {/* Active + Pending stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div className="card" style={{ flex: 1, textAlign: 'center', padding: '14px 10px' }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#27ae60' }}>{stats.referredCount}</div>
          <div style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 4 }}>{t('active_friends')}</div>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center', padding: '14px 10px' }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#f39c12' }}>{pendingActivation}</div>
          <div style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 4 }}>{t('pending_activation')}</div>
        </div>
      </div>


      {/* Share buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className="btn btn-gold" style={{ flex: 2 }} onClick={shareLink}>
          {t('send_invite')}
        </button>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={copyLink}>
          {copied ? t('copied') : t('copy_invite')}
        </button>
      </div>

      {/* Link display */}
      <div style={{
        background: 'var(--bg-card2)', borderRadius: 8, padding: '10px 14px',
        fontSize: 12, color: 'var(--text-dim)', marginBottom: 16,
        wordBreak: 'break-all', border: '1px solid var(--border)',
      }}>
        {stats.link}
      </div>

      {/* Pending rewards */}
      {stats.hasPending && (
        <div style={{ background: 'rgba(155,89,182,0.1)', border: '1px solid rgba(155,89,182,0.3)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{t('pending_rewards')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            {stats.pendingRewards.gems > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: '#9b59b6', fontWeight: 700 }}>
                <img src="/assets/icon_gem.png" style={{ width: 16, height: 16 }} />
                {fmt(stats.pendingRewards.gems)}
              </div>
            )}
            {stats.pendingRewards.vipDays > 0 && (
              <div style={{ fontSize: 13, color: '#f4d03f', fontWeight: 700 }}>
                👑 VIP ×{stats.pendingRewards.vipDays}
              </div>
            )}
          </div>
          <button
            className="btn btn-gold"
            style={{ width: '100%', fontSize: 13 }}
            disabled={claiming}
            onClick={claimAll}
          >
            {claiming ? t('processing') : t('claim_all_rewards')}
          </button>
        </div>
      )}

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, marginBottom: 12,
          background: msg.startsWith('✅') ? '#153c15' : '#3c1515',
          color: msg.startsWith('✅') ? '#27ae60' : '#e74c3c', fontSize: 13,
        }}>{msg}</div>
      )}

      {/* Anti-cheat note */}
      <div style={{ background: 'rgba(244,208,63,0.07)', border: '1px solid rgba(244,208,63,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#a0845a', lineHeight: 1.6 }}>
        ⚠️ {t('ref_anticheat_note')}
      </div>

      {/* Reward structure table */}
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: '#f4d03f' }}>📊 {t('reward_structure')}</div>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
        {[
          { every: 1,  labelKey: 'friend',  reward: <><img src="/assets/icon_gem.png" style={{ width: 13, height: 13, verticalAlign: 'middle', marginRight: 3 }} />+100 {t('gems')}</> },
          { every: 5,  labelKey: 'friends', reward: <><img src="/assets/icon_gem.png" style={{ width: 13, height: 13, verticalAlign: 'middle', marginRight: 3 }} />+200 {t('gems')} {t('bonus')}</> },
          { every: 10, labelKey: 'friends', reward: <>{t('ragnar_name')} ({t('referral_hero')})</> },
          { every: 20, labelKey: 'friends', reward: <><img src="/assets/icon_vip.png" style={{ height: 16, width: 'auto', objectFit: 'contain', verticalAlign: 'middle', marginRight: 6 }} />30 {t('days_free')}</> },
        ].map((m, i, arr) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div style={{ fontSize: 13, color: '#a0845a' }}>
              {t('every')} <strong style={{ color: '#e0e0e0' }}>{m.every}</strong> {t(m.labelKey as any)}
            </div>
            <div style={{ fontSize: 13, color: '#f4d03f', fontWeight: 700 }}>{m.reward}</div>
          </div>
        ))}
        <div style={{ fontSize: 10, color: '#555', marginTop: 8, textAlign: 'center' }}>{t('rewards_cumulative')}</div>
      </div>

      {/* Milestones (legacy — only shown if returned from server) */}
      {stats.milestones.length > 0 && (
        <>
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 15 }}>{t('prizes_label')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.milestones.map(m => {
              const extra = m as any;
              const rewardText = m.gems > 0
                ? <><img src="/assets/icon_gem.png" style={{ width: 13, height: 13, verticalAlign: 'middle', marginRight: 3 }} />{fmt(m.gems)} {t('gems')}</>
                : extra.hero === 'ragnar' || extra.hero === 'referral_hero'
                  ? `🦸 ${t('ragnar_name')}`
                  : extra.vipDays
                    ? `👑 ${t('vip_monthly_free')}`
                    : extra.hero
                      ? `🦸 ${extra.hero}`
                      : '';
              return (
                <div key={m.count} className="card" style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderColor: m.reached ? '#27ae60' : 'var(--border)',
                  opacity: stats.referredCount >= m.count ? 1 : 0.6,
                }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{m.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{rewardText}</div>
                  </div>
                  {m.reached ? (
                    <button className="btn btn-green" onClick={claimAll} disabled={claiming} style={{ fontSize: 12 }}>
                      {claiming ? '...' : t('claim_btn')}
                    </button>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      {stats.referredCount}/{m.count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
