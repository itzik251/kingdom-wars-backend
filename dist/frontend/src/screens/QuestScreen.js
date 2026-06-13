"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = QuestScreen;
const react_1 = require("react");
const client_1 = require("../api/client");
const gameStore_1 = require("../store/gameStore");
const useT_1 = require("../i18n/useT");
function GemIcon({ size = 14 }) {
    return <img src="/assets/icon_gem.png" alt="gem" style={{ width: size, height: size, verticalAlign: 'middle', marginRight: 2 }}/>;
}
function ReferralSection() {
    const [referral, setReferral] = (0, react_1.useState)(null);
    const [copied, setCopied] = (0, react_1.useState)(false);
    const [claiming, setClaiming] = (0, react_1.useState)(false);
    const [msg, setMsg] = (0, react_1.useState)('');
    const t = (0, useT_1.useT)();
    (0, react_1.useEffect)(() => { client_1.api.get('/referral').then(setReferral).catch(() => { }); }, []);
    const referredCount = referral?.referredCount ?? 0;
    const totalReferredCount = referral?.totalReferredCount ?? referredCount;
    const claimedCount = referral?.claimedCount ?? 0;
    const pending = referral?.pendingRewards ?? { gems: 0, skins: 0, vipDays: 0 };
    const hasPending = referral?.hasPending ?? false;
    const link = referral?.link;
    function copy() {
        if (!link)
            return;
        navigator.clipboard?.writeText(link).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
    async function claimAll() {
        setClaiming(true);
        try {
            const r = await client_1.api.post('/referral/claim');
            let parts = [];
            if (r.gems > 0)
                parts.push(`💎 ${r.gems} ${t('gems')}`);
            if (r.vipDays > 0)
                parts.push(`👑 VIP ${r.vipDays} ${t('days_free')}`);
            if (r.skins > 0)
                parts.push(`🦸 ${r.skins}× ${t('ragnar_name')}`);
            setMsg(parts.length ? `✅ ${parts.join(' + ')}` : `✅ ${t('claimed_success')}`);
            const updated = await client_1.api.get('/referral');
            setReferral(updated);
        }
        catch (e) {
            setMsg('❌ ' + (e.response?.data?.message || t('error')));
        }
        finally {
            setClaiming(false);
            setTimeout(() => setMsg(''), 4000);
        }
    }
    const milestones = [
        { every: 1, label: t('friend'), reward: <><GemIcon size={13}/> +100 {t('gems')}</> },
        { every: 5, label: t('friends'), reward: <><GemIcon size={13}/> +200 {t('gems')} {t('bonus')}</> },
        { every: 10, label: t('friends'), reward: <>🦸 {t('ragnar_name')} ({t('referral_hero')})</> },
        { every: 20, label: t('friends'), reward: <>👑 VIP 30 {t('days_free')}</> },
    ];
    return (<div style={{ marginBottom: 8 }}>
      
      <div style={{ background: 'linear-gradient(135deg,rgba(39,174,96,0.1),rgba(26,138,64,0.05))', border: '1px solid rgba(39,174,96,0.25)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontSize: 13, color: '#a0845a' }}>
            👥 {t('ref_friends_count')} <strong style={{ color: '#27ae60', fontSize: 16 }}>{referredCount}</strong>
          </div>
          {claimedCount > 0 && (<div style={{ fontSize: 11, color: '#555' }}>✅ {t('claimed')}: {claimedCount}</div>)}
        </div>
        
        {totalReferredCount > referredCount && (<div style={{ fontSize: 10, color: '#27ae60', marginBottom: 4 }}>
            ⚡ {referredCount} {t('active_friends')} · ⏳ {totalReferredCount - referredCount} {t('pending_activation')}
          </div>)}
        <div style={{ fontSize: 10, color: '#666', marginBottom: 4, lineHeight: 1.4 }}>
          ℹ️ {t('ref_active_note')}
        </div>
        <div style={{ fontSize: 10, color: '#3498db', marginBottom: 10, lineHeight: 1.4 }}>
          🍪 {t('ref_cookie_note')}
        </div>

        
        {hasPending && (<div style={{ background: 'linear-gradient(135deg,rgba(244,208,63,0.12),rgba(184,134,11,0.08))', border: '1px solid rgba(244,208,63,0.3)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: '#f4d03f', fontWeight: 700, marginBottom: 4 }}>🎁 {t('pending_rewards')}:</div>
            {pending.gems > 0 && <div style={{ fontSize: 12, color: '#e0e0e0' }}><GemIcon size={13}/> {pending.gems} {t('gems')}</div>}
            {pending.vipDays > 0 && <div style={{ fontSize: 12, color: '#e0e0e0' }}>👑 VIP {pending.vipDays} {t('days_free')}</div>}
            {pending.skins > 0 && <div style={{ fontSize: 12, color: '#e0e0e0' }}>🦸 {pending.skins}× {t('ragnar_name')}</div>}
          </div>)}

        {hasPending && (<button onClick={claimAll} disabled={claiming} style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'linear-gradient(135deg,#f39c12,#f4d03f)', border: 'none', color: '#000', fontWeight: 800, fontSize: 14, cursor: 'pointer', marginBottom: 10 }}>
            {claiming ? '...' : `🎁 ${t('claim_all_rewards')}`}
          </button>)}

        {link ? (<>
            <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 8, padding: '7px 10px', fontSize: 10, color: '#7dbb3f', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: 8 }}>
              {link}
            </div>
            <button onClick={copy} style={{ width: '100%', padding: '10px', borderRadius: 10, background: copied ? 'linear-gradient(135deg,#27ae60,#1e8449)' : 'rgba(39,174,96,0.2)', border: '1px solid rgba(39,174,96,0.5)', color: copied ? '#fff' : '#27ae60', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
              {copied ? t('copied') : t('ref_copy_link')}
            </button>
          </>) : (<div style={{ textAlign: 'center', color: '#a0845a', fontSize: 12 }}>{t('loading')}</div>)}
      </div>

      {msg && <div style={{ textAlign: 'center', fontSize: 13, color: msg.startsWith('✅') ? '#27ae60' : '#e74c3c', marginBottom: 10 }}>{msg}</div>}

      
      <div style={{ background: 'linear-gradient(135deg,var(--bg-card),var(--bg-card2))', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: '#f4d03f' }}>📊 {t('reward_structure')}</div>
        {milestones.map((m, i) => (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: i < milestones.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div style={{ fontSize: 12, color: '#a0845a' }}>
              {t('every')} <strong style={{ color: '#e0e0e0' }}>{m.every}</strong> {m.label}
            </div>
            <div style={{ fontSize: 12, color: '#f4d03f', fontWeight: 700 }}>{m.reward}</div>
          </div>))}
        <div style={{ fontSize: 10, color: '#555', marginTop: 8, textAlign: 'center' }}>
          {t('rewards_cumulative')}
        </div>
      </div>
    </div>);
}
const QUEST_TKEYS = {
    collect_gold_1000: { tkey: 'quest_collect_gold', icon: '💰' },
    upgrade_building: { tkey: 'quest_upgrade_building', icon: '🏗️' },
    perform_attack: { tkey: 'quest_perform_attack', icon: '⚔️' },
    train_500_soldiers: { tkey: 'quest_train_soldiers', icon: '🪖' },
    win_20_battles: { tkey: 'quest_win_battles', icon: '🏆' },
};
const QUEST_REWARDS = {
    collect_gold_1000: 10, upgrade_building: 15, perform_attack: 20,
    train_500_soldiers: 100, win_20_battles: 200,
};
function QuestScreen() {
    const { refresh } = (0, gameStore_1.useGameStore)();
    const [daily, setDaily] = (0, react_1.useState)([]);
    const [weekly, setWeekly] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [msg, setMsg] = (0, react_1.useState)('');
    const t = (0, useT_1.useT)();
    (0, react_1.useEffect)(() => { load(); }, []);
    async function load() {
        setLoading(true);
        try {
            const [d, w] = await Promise.all([
                client_1.api.get('/quests/daily'),
                client_1.api.get('/quests/weekly'),
            ]);
            setDaily(d);
            setWeekly(w);
        }
        finally {
            setLoading(false);
        }
    }
    async function claim(questId) {
        try {
            const result = await client_1.api.post(`/quests/claim/${questId}`);
            if (result?.gemsRewarded) {
                setMsg(t('gems_received', { n: result.gemsRewarded }));
                await Promise.all([load(), refresh()]);
            }
        }
        catch (e) {
            setMsg(e.response?.data?.message || t('error'));
        }
    }
    function QuestCard({ q }) {
        const meta = QUEST_TKEYS[q.questKey];
        const info = meta ? { label: t(meta.tkey), icon: meta.icon } : { label: q.questKey, icon: '📋' };
        const reward = QUEST_REWARDS[q.questKey] || 0;
        const pct = Math.min(100, (q.progress / q.target) * 100);
        return (<div style={{
                background: q.rewardClaimed
                    ? 'rgba(0,0,0,0.2)'
                    : q.completed
                        ? 'linear-gradient(135deg,rgba(39,174,96,0.15),rgba(30,130,70,0.1))'
                        : 'linear-gradient(135deg,var(--bg-card),var(--bg-card2))',
                border: q.completed && !q.rewardClaimed
                    ? '1px solid rgba(39,174,96,0.4)'
                    : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12, padding: '12px 14px', marginBottom: 10,
                opacity: q.rewardClaimed ? 0.5 : 1,
            }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>{info.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{info.label}</div>
              <div style={{ fontSize: 11, color: '#a0845a', marginTop: 1, display: 'flex', alignItems: 'center', gap: 3 }}><GemIcon size={13}/> {reward} {t('gems')}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#a0845a', whiteSpace: 'nowrap' }}>
            {q.progress}/{q.target}
          </div>
        </div>

        <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, marginBottom: 8, overflow: 'hidden' }}>
          <div style={{
                height: '100%', width: `${pct}%`,
                background: q.completed ? '#27ae60' : 'linear-gradient(90deg,#b8860b,#f4d03f)',
                borderRadius: 3, transition: 'width 0.4s',
            }}/>
        </div>

        {q.completed && !q.rewardClaimed && (<button className="btn btn-green" style={{ width: '100%', fontSize: 13, padding: '8px' }} onClick={() => claim(q.id)}>
            {t('get_prize')}
          </button>)}
        {q.rewardClaimed && (<div style={{ textAlign: 'center', fontSize: 12, color: '#27ae60' }}>{t('quest_claimed')}</div>)}
      </div>);
    }
    return (<div className="screen">
      <div className="screen-title">{t('quests_title')}</div>

      {msg && (<div style={{
                padding: '10px 14px', borderRadius: 10, marginBottom: 12,
                background: 'rgba(39,174,96,0.15)', border: '1px solid #27ae6044',
                color: '#27ae60', fontSize: 13, textAlign: 'center',
            }}>
          {msg}
        </div>)}

      {loading ? (<div style={{ textAlign: 'center', paddingTop: 60, color: '#a0845a' }}>⏳ {t('loading')}</div>) : (<>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, color: '#f4d03f' }}>
            {t('daily_quests')}
          </div>
          {daily.map(q => <QuestCard key={q.id} q={q}/>)}

          <div style={{ fontWeight: 700, fontSize: 15, margin: '16px 0 10px', color: '#9b59b6' }}>
            {t('weekly_quests')}
          </div>
          {weekly.map(q => <QuestCard key={q.id} q={q}/>)}

          <div style={{ fontWeight: 700, fontSize: 15, margin: '16px 0 10px', color: '#27ae60' }}>
            {t('referral_section')}
          </div>
          <ReferralSection />
        </>)}
    </div>);
}
//# sourceMappingURL=QuestScreen.js.map