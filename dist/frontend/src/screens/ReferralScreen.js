"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ReferralScreen;
const react_1 = require("react");
const client_1 = require("../api/client");
const format_1 = require("../utils/format");
const useT_1 = require("../i18n/useT");
function ReferralScreen() {
    const [stats, setStats] = (0, react_1.useState)(null);
    const [copied, setCopied] = (0, react_1.useState)(false);
    const [claiming, setClaiming] = (0, react_1.useState)(false);
    const [msg, setMsg] = (0, react_1.useState)('');
    const t = (0, useT_1.useT)();
    (0, react_1.useEffect)(() => { load(); }, []);
    async function load() {
        const data = await client_1.api.get('/referral');
        setStats(data);
    }
    function copyLink() {
        navigator.clipboard.writeText(stats.link).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }
    function shareLink() {
        const tg = window.Telegram?.WebApp;
        if (tg) {
            tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(stats.link)}&text=${encodeURIComponent(`⚔️ ${t('share_invite_text')}`)}`);
        }
        else {
            copyLink();
        }
    }
    async function claimAll() {
        setClaiming(true);
        setMsg('');
        try {
            const result = await client_1.api.post('/referral/claim');
            if (result.error) {
                setMsg(result.error);
                return;
            }
            setMsg(t('ref_gems_received', { n: result.gems ?? result.newClaimedCount ?? 0 }));
            await load();
        }
        catch (e) {
            setMsg(e.response?.data?.message || t('error'));
        }
        finally {
            setClaiming(false);
        }
    }
    if (!stats)
        return <div className="screen" style={{ textAlign: 'center', paddingTop: 60, color: 'var(--text-dim)' }}>{t('loading')}</div>;
    const pendingActivation = Math.max(0, (stats.totalReferredCount ?? 0) - stats.referredCount);
    return (<div className="screen">
      <div className="screen-title">{t('referral_title')}</div>

      
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

      
      <div style={{ background: 'rgba(39,174,96,0.07)', border: '1px solid rgba(39,174,96,0.2)', borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: 11, color: '#a0845a', lineHeight: 1.6 }}>
        ℹ️ {t('ref_active_note')}
      </div>

      
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className="btn btn-gold" style={{ flex: 2 }} onClick={shareLink}>
          {t('send_invite')}
        </button>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={copyLink}>
          {copied ? t('copied') : t('copy_invite')}
        </button>
      </div>

      
      <div style={{
            background: 'var(--bg-card2)', borderRadius: 8, padding: '10px 14px',
            fontSize: 12, color: 'var(--text-dim)', marginBottom: 16,
            wordBreak: 'break-all', border: '1px solid var(--border)',
        }}>
        {stats.link}
      </div>

      
      {stats.hasPending && (<div style={{ background: 'rgba(155,89,182,0.1)', border: '1px solid rgba(155,89,182,0.3)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{t('pending_rewards')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            {stats.pendingRewards.gems > 0 && (<div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: '#9b59b6', fontWeight: 700 }}>
                <img src="/assets/icon_gem.png" style={{ width: 16, height: 16 }}/>
                {(0, format_1.fmt)(stats.pendingRewards.gems)}
              </div>)}
            {stats.pendingRewards.vipDays > 0 && (<div style={{ fontSize: 13, color: '#f4d03f', fontWeight: 700 }}>
                👑 VIP ×{stats.pendingRewards.vipDays}
              </div>)}
          </div>
          <button className="btn btn-gold" style={{ width: '100%', fontSize: 13 }} disabled={claiming} onClick={claimAll}>
            {claiming ? t('processing') : t('claim_all_rewards')}
          </button>
        </div>)}

      {msg && (<div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 12,
                background: msg.startsWith('✅') ? '#153c15' : '#3c1515',
                color: msg.startsWith('✅') ? '#27ae60' : '#e74c3c', fontSize: 13,
            }}>{msg}</div>)}

      
      <div style={{ background: 'rgba(244,208,63,0.07)', border: '1px solid rgba(244,208,63,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#a0845a', lineHeight: 1.6 }}>
        ⚠️ {t('ref_anticheat_note')}
      </div>

      
      <div className="card" style={{ textAlign: 'center', marginBottom: 16, padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: '#9b59b6' }}>
          <img src="/assets/icon_gem.png" style={{ width: 18, height: 18 }}/>
          {t('ref_bonus_per_friend')}
        </div>
      </div>

      
      {stats.milestones.length > 0 && (<>
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 15 }}>{t('prizes_label')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.milestones.map(m => {
                const extra = m;
                const rewardText = m.gems > 0
                    ? <><img src="/assets/icon_gem.png" style={{ width: 13, height: 13, verticalAlign: 'middle', marginRight: 3 }}/>{(0, format_1.fmt)(m.gems)} {t('gems')}</>
                    : extra.hero === 'ragnar' || extra.hero === 'referral_hero'
                        ? `🦸 ${t('ragnar_name')}`
                        : extra.vipDays
                            ? `👑 ${t('vip_monthly_free')}`
                            : extra.hero
                                ? `🦸 ${extra.hero}`
                                : '';
                return (<div key={m.count} className="card" style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        borderColor: m.reached ? '#27ae60' : 'var(--border)',
                        opacity: stats.referredCount >= m.count ? 1 : 0.6,
                    }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{m.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{rewardText}</div>
                  </div>
                  {m.reached ? (<button className="btn btn-green" onClick={claimAll} disabled={claiming} style={{ fontSize: 12 }}>
                      {claiming ? '...' : t('claim_btn')}
                    </button>) : (<span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      {stats.referredCount}/{m.count}
                    </span>)}
                </div>);
            })}
          </div>
        </>)}
    </div>);
}
//# sourceMappingURL=ReferralScreen.js.map