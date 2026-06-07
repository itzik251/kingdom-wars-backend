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
    const [claiming, setClaiming] = (0, react_1.useState)(null);
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
    async function claim(count) {
        setClaiming(count);
        setMsg('');
        try {
            const result = await client_1.api.post(`/referral/claim/${count}`);
            if (result.error) {
                setMsg(result.error);
                return;
            }
            setMsg(t('ref_gems_received', { n: result.gems }));
            await load();
        }
        catch (e) {
            setMsg(e.response?.data?.message || t('error'));
        }
        finally {
            setClaiming(null);
        }
    }
    if (!stats)
        return <div className="screen" style={{ textAlign: 'center', paddingTop: 60, color: 'var(--text-dim)' }}>{t('loading')}</div>;
    return (<div className="screen">
      <div className="screen-title">{t('referral_title')}</div>

      
      <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>👥</div>
        <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.referredCount}</div>
        <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>{t('friends_joined')}</div>
      </div>

      
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className="btn btn-gold" style={{ flex: 2 }} onClick={shareLink}>
          {t('send_invite')}
        </button>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={copyLink}>
          {copied ? t('copied') : t('copy_invite')}
        </button>
      </div>

      
      <div style={{
            background: 'var(--bg-card2)', borderRadius: 8, padding: '10px 14px',
            fontSize: 12, color: 'var(--text-dim)', marginBottom: 20,
            wordBreak: 'break-all', border: '1px solid var(--border)',
        }}>
        {stats.link}
      </div>

      {msg && (<div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 12,
                background: msg.startsWith('✅') ? '#153c15' : '#3c1515',
                color: msg.startsWith('✅') ? '#27ae60' : '#e74c3c', fontSize: 13,
            }}>{msg}</div>)}

      
      <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5 }}>
        ⚠️ {t('ref_anticheat_note')}
      </div>

      
      <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 15 }}>{t('prizes_label')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {stats.milestones.map(m => {
            const rewardText = m.gems > 0
                ? `💎 ${(0, format_1.fmt)(m.gems)} Gems`
                : m.hero === 'ragnar'
                    ? `🦸 ${t('ragnar_name')}`
                    : m.vipDays
                        ? `👑 ${t('vip_monthly_free')}`
                        : m.hero
                            ? `🦸 ${m.hero}`
                            : '';
            return (<div key={m.count} className="card" style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderColor: m.reached ? '#27ae60' : 'var(--border)',
                    opacity: stats.referredCount >= m.count ? 1 : 0.6,
                }}>
            <div>
              <div style={{ fontWeight: 700 }}>{m.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                {rewardText}
              </div>
            </div>
            {m.reached ? (<button className="btn btn-green" onClick={() => claim(m.count)} disabled={claiming === m.count} style={{ fontSize: 12 }}>
                {claiming === m.count ? '...' : t('claim_btn')}
              </button>) : (<span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                {stats.referredCount}/{m.count}
              </span>)}
          </div>);
        })}
      </div>
    </div>);
}
//# sourceMappingURL=ReferralScreen.js.map