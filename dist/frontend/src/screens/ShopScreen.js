"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ShopScreen;
const react_1 = require("react");
const client_1 = require("../api/client");
const gameStore_1 = require("../store/gameStore");
const format_1 = require("../utils/format");
const Countdown_1 = require("../components/Countdown");
const useT_1 = require("../i18n/useT");
const REWARD_AD_BLOCK_ID = '34207';
function ReferralCard() {
    const [referral, setReferral] = (0, react_1.useState)(null);
    const [copied, setCopied] = (0, react_1.useState)(false);
    const [claiming, setClaiming] = (0, react_1.useState)(null);
    const [claimMsg, setClaimMsg] = (0, react_1.useState)('');
    const t = (0, useT_1.useT)();
    (0, react_1.useEffect)(() => {
        client_1.api.get('/referral').then(setReferral).catch(() => { });
    }, []);
    const link = referral?.link || null;
    function copy() {
        if (!link)
            return;
        navigator.clipboard?.writeText(link).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
    async function claim(count) {
        setClaiming(count);
        try {
            const r = await client_1.api.post(`/referral/claim/${count}`);
            setClaimMsg(r.gems > 0 ? t('ref_gems_received', { n: r.gems }) : t('claimed_success'));
            const updated = await client_1.api.get('/referral');
            setReferral(updated);
        }
        catch (e) {
            setClaimMsg('❌ ' + (e.response?.data?.message || t('error')));
        }
        finally {
            setClaiming(null);
            setTimeout(() => setClaimMsg(''), 3000);
        }
    }
    const mkLabel = (n) => `${n} ${n === 1 ? t('friend') : t('friends')}`;
    const MILESTONES = [
        { count: 1, gems: 100, label: mkLabel(1) },
        { count: 5, gems: 200, label: mkLabel(5) },
        { count: 10, gems: 0, label: mkLabel(10), extra: `🦸 ${t('ragnar_name')}` },
        { count: 20, gems: 0, label: mkLabel(20), extra: `👑 ${t('vip_monthly_free')}` },
    ];
    return (<div style={{ background: 'linear-gradient(135deg,rgba(39,174,96,0.1),rgba(26,138,64,0.05))', border: '1px solid rgba(39,174,96,0.3)', borderRadius: 14, padding: 14 }}>
      
      <div style={{ fontSize: 12, color: '#a0845a', marginBottom: 8 }}>
        👥 {t('friends_invited', { n: referral?.referredCount ?? 0 })}
      </div>

      {link ? (<>
          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: '8px 10px', fontSize: 10, color: '#7dbb3f', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: 8 }}>
            {link}
          </div>
          <button onClick={copy} style={{ width: '100%', padding: '10px', borderRadius: 10, background: copied ? 'linear-gradient(135deg,#27ae60,#1e8449)' : 'rgba(39,174,96,0.2)', border: '1px solid rgba(39,174,96,0.5)', color: copied ? '#fff' : '#27ae60', fontWeight: 800, fontSize: 13, cursor: 'pointer', marginBottom: 12 }}>
            {copied ? t('copied') : t('ref_copy_link')}
          </button>
        </>) : (<div style={{ textAlign: 'center', fontSize: 12, color: '#a0845a', padding: '10px 0' }}>{t('loading')}</div>)}

      
      <div style={{ fontSize: 10, color: '#666', background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '6px 10px', marginBottom: 8, lineHeight: 1.5 }}>
        ⚠️ {t('ref_anticheat_note')}
      </div>

      
      <div style={{ fontSize: 11, fontWeight: 700, color: '#a0845a', marginBottom: 6 }}>{t('milestones_lbl')}</div>
      {claimMsg && <div style={{ textAlign: 'center', fontSize: 12, color: claimMsg.startsWith('✅') ? '#27ae60' : '#e74c3c', marginBottom: 8 }}>{claimMsg}</div>}
      {MILESTONES.map(m => {
            const data = referral?.milestones?.find((x) => x.count === m.count);
            const reached = data?.reached;
            const claimed = data?.alreadyClaimed;
            const referredCount = referral?.referredCount ?? 0;
            const progress = Math.min(referredCount, m.count);
            return (<div key={m.count} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 10px', border: `1px solid ${claimed ? 'rgba(39,174,96,0.3)' : reached ? 'rgba(244,208,63,0.3)' : 'rgba(255,255,255,0.05)'}` }}>
            <div style={{ fontSize: 18 }}>{claimed ? '✅' : reached ? '🎁' : '🔒'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: claimed ? '#27ae60' : reached ? '#f4d03f' : '#666' }}>
                {m.label} — {m.gems > 0 ? `${m.gems} 💎` : m.extra}
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(progress / m.count) * 100}%`, background: claimed ? '#27ae60' : '#f4d03f', borderRadius: 2, transition: 'width 0.3s' }}/>
              </div>
              <div style={{ fontSize: 9, color: '#666', marginTop: 2 }}>{progress}/{m.count}</div>
            </div>
            {reached && !claimed && (<button onClick={() => claim(m.count)} disabled={claiming === m.count} style={{ padding: '6px 10px', borderRadius: 8, background: 'linear-gradient(135deg,#f4d03f,#b8860b)', border: 'none', color: '#1a0a00', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                {claiming === m.count ? '...' : t('claim_btn')}
              </button>)}
          </div>);
        })}
    </div>);
}
function UsdtBalanceSection() {
    const [balance, setBalance] = (0, react_1.useState)(null);
    const [withdrawing, setWithdrawing] = (0, react_1.useState)(false);
    const [msg, setMsg] = (0, react_1.useState)('');
    const t = (0, useT_1.useT)();
    (0, react_1.useEffect)(() => {
        client_1.api.get('/kingdom/usdt-balance').then(r => setBalance(r.usdtBalance || 0)).catch(() => setBalance(0));
    }, []);
    async function withdraw() {
        setWithdrawing(true);
        try {
            const r = await client_1.api.post('/kingdom/withdraw-usdt');
            setMsg(`✅ ${r.amount.toFixed(2)} USDT → Telegram ✓`);
            setBalance(0);
        }
        catch (e) {
            setMsg('❌ ' + (e.response?.data?.message || t('error')));
        }
        finally {
            setWithdrawing(false);
            setTimeout(() => setMsg(''), 5000);
        }
    }
    const bal = balance ?? 0;
    return (<div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#a0845a', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {t('usdt_section')}
      </div>
      <div style={{ background: 'linear-gradient(135deg,rgba(39,174,96,0.12),rgba(26,138,64,0.06))', border: '1px solid rgba(39,174,96,0.25)', borderRadius: 14, padding: 16 }}>

        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: '#a0845a' }}>{t('available_balance')}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: bal > 0 ? '#27ae60' : '#666' }}>
              ${bal.toFixed(4)} USDT
            </div>
          </div>
          {bal >= 20 ? (<button onClick={withdraw} disabled={withdrawing} style={{ padding: '12px 18px', borderRadius: 12, background: 'linear-gradient(135deg,#27ae60,#1e8449)', border: 'none', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
              {withdrawing ? '...' : t('withdraw_btn')}
            </button>) : (<div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#a0845a' }}>{t('to_withdraw')}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#f4d03f' }}>{t('withdraw_min')}</div>
            </div>)}
        </div>

        
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#a0845a', marginBottom: 4 }}>
            <span>{bal >= 20 ? t('can_withdraw') : t('until_withdraw', { n: (20 - bal).toFixed(2) })}</span>
            <span>${bal.toFixed(2)} / $20.00</span>
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, (bal / 20) * 100)}%`, background: bal >= 20 ? '#27ae60' : 'linear-gradient(90deg,#b8860b,#f4d03f)', borderRadius: 3, transition: 'width 0.4s' }}/>
          </div>
        </div>

        {msg && <div style={{ fontSize: 12, marginTop: 6, color: msg.startsWith('✅') ? '#27ae60' : '#e74c3c', textAlign: 'center' }}>{msg}</div>}

        <div style={{ fontSize: 10, color: '#666', marginTop: 6, lineHeight: 1.5 }}>
          {t('withdraw_info')}
        </div>
      </div>
    </div>);
}
const SECTION = ({ title, children }) => (<div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 13, fontWeight: 800, color: '#a0845a', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      {title}
    </div>
    {children}
  </div>);
function ShopScreen() {
    const { refresh, kingdom, buildings } = (0, gameStore_1.useGameStore)();
    const [vip, setVip] = (0, react_1.useState)(null);
    const [ads, setAds] = (0, react_1.useState)(null);
    const [msg, setMsg] = (0, react_1.useState)('');
    const [msgOk, setMsgOk] = (0, react_1.useState)(true);
    const [speeding, setSpeeding] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(null);
    const t = (0, useT_1.useT)();
    const upgrading = buildings.filter(b => b.upgradeEndsAt && new Date() < new Date(b.upgradeEndsAt));
    const isVip = !!kingdom?.isVip || vip?.isVip;
    const gems = kingdom?.gems ?? 0;
    (0, react_1.useEffect)(() => { load(); }, []);
    async function load() {
        const [v, a] = await Promise.all([client_1.api.get('/vip'), client_1.api.get('/ads/status')]);
        setVip(v);
        setAds(a);
    }
    function showMsg(text, ok = true) {
        setMsg(text);
        setMsgOk(ok);
        setTimeout(() => setMsg(''), 4000);
    }
    async function speedUp(type, buildingId) {
        setSpeeding(type);
        try {
            await client_1.api.post('/buildings/speedup', { type, buildingId });
            showMsg(t('speedup_done'));
            await Promise.all([load(), refresh()]);
        }
        catch (e) {
            showMsg(e.response?.data?.message || t('error'), false);
        }
        finally {
            setSpeeding(null);
        }
    }
    async function watchAd(type) {
        setLoading(type);
        try {
            const AdController = window.Adsgram?.init({ blockId: REWARD_AD_BLOCK_ID });
            if (AdController) {
                const result = await AdController.show();
                if (!result?.done) {
                    showMsg(t('error'), false);
                    return;
                }
            }
            const reward = await client_1.api.post('/ads/reward', { type });
            const msgs = {
                double_production: `🚀 ${t('double_prod')} — ${t('double_prod_active', { time: new Date(reward.boostUntil).toLocaleTimeString() })}`,
                double_attack_speed: `⚡ ${t('double_attack_speed_active', { time: new Date(reward.boostUntil).toLocaleTimeString() })}`,
                usdt_bonus: `💵 +0.0001 USDT ${t('added_to_balance')}`,
                gems: `💎 +10 Gems ${t('added_to_balance')}`,
                gold_bonus: `💰 +500 ${t('gold')} ${t('added_to_balance')}`,
                wood_bonus: `🪵 +500 ${t('wood')} ${t('added_to_balance')}`,
                stone_bonus: `🪨 +500 ${t('stone')} ${t('added_to_balance')}`,
                food_bonus: `🌾 +500 ${t('food')} ${t('added_to_balance')}`,
            };
            showMsg(msgs[type] || t('confirm'));
            await Promise.all([load(), refresh()]);
        }
        catch (e) {
            showMsg(e.response?.data?.message || t('error'), false);
        }
        finally {
            setLoading(null);
        }
    }
    async function doAction(action) {
        setLoading('action');
        try {
            await action();
            await Promise.all([load(), refresh()]);
        }
        catch (e) {
            showMsg(e.response?.data?.message || t('error'), false);
        }
        finally {
            setLoading(null);
        }
    }
    const adsLeft = ads?.adsRemainingToday ?? 0;
    return (<div className="screen" style={{ paddingBottom: 140 }}>
      <div className="screen-title">{t('shop_title')}</div>

      {msg && (<div style={{
                padding: '10px 14px', borderRadius: 10, marginBottom: 14,
                background: msgOk ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)',
                border: `1px solid ${msgOk ? '#27ae60' : '#e74c3c'}44`,
                color: msgOk ? '#27ae60' : '#e74c3c', fontSize: 13, textAlign: 'center',
            }}>{msg}</div>)}

      
      <SECTION title={t('vip_section')}>

        
        <div style={{
            background: isVip
                ? 'linear-gradient(135deg,rgba(184,134,11,0.25),rgba(244,208,63,0.1))'
                : 'linear-gradient(135deg,rgba(40,20,0,0.8),rgba(60,30,0,0.8))',
            border: `1px solid ${isVip ? '#f4d03f88' : 'rgba(244,208,63,0.2)'}`,
            borderRadius: 16, padding: '16px 16px 14px', marginBottom: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#f4d03f' }}>{t('vip_monthly')}</div>
              <div style={{ fontSize: 12, color: '#a0845a', marginTop: 2 }}>
                {isVip
            ? t('vip_active_until', { date: vip?.expiresAt ? new Date(vip.expiresAt).toLocaleDateString() : t('loading') })
            : t('vip_price')}
              </div>
            </div>
            {isVip
            ? <div style={{ background: 'linear-gradient(135deg,#b8860b,#f4d03f)', borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 800, color: '#1a0a00' }}>{t('vip_active')}</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button className="btn btn-gold" style={{ fontSize: 12, padding: '8px 12px' }} disabled={loading === 'action'} onClick={async () => {
                    setLoading('action');
                    try {
                        await client_1.api.post('/vip/purchase-with-usdt');
                        showMsg(t('vip_activated_usdt'));
                        await Promise.all([load(), refresh()]);
                    }
                    catch (e) {
                        showMsg(e.response?.data?.message || t('error'), false);
                    }
                    finally {
                        setLoading(null);
                    }
                }}>
                    💵 {t('vip_pay_usdt_balance')}
                  </button>
                  <button className="btn" style={{ fontSize: 12, padding: '8px 12px', background: 'rgba(52,152,219,0.2)', border: '1px solid rgba(52,152,219,0.4)', color: '#3498db' }} disabled={loading === 'action'} onClick={async () => {
                    setLoading('action');
                    try {
                        const info = await client_1.api.get('/vip/payment-info');
                        showMsg(`📋 ${t('vip_wallet_send')}: ${info.walletAddress} · ${info.amount} ${info.currency}`);
                    }
                    catch (e) {
                        showMsg(e.response?.data?.message || t('error'), false);
                    }
                    finally {
                        setLoading(null);
                    }
                }}>
                    💳 {t('vip_pay_wallet')}
                  </button>
                </div>}
          </div>

          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
            { icon: '⚡', label: t('vip_fast_build_pct') },
            { icon: '🔮', label: t('b_arcane_tower') },
            { icon: '🏆', label: t('vip_badge_feat') },
            { icon: '💎', label: t('vip_gems_x') },
            { icon: '🚀', label: t('vip_prod_x15') },
            { icon: '⚔️', label: t('vip_usdt_raid') },
        ].map(f => (<div key={f.label} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: isVip ? 'rgba(244,208,63,0.08)' : 'rgba(0,0,0,0.3)',
                borderRadius: 8, padding: '7px 10px',
                border: `1px solid ${isVip ? 'rgba(244,208,63,0.2)' : 'rgba(255,255,255,0.04)'}`,
            }}>
                <span style={{ fontSize: 16 }}>{f.icon}</span>
                <span style={{ fontSize: 11, color: isVip ? '#f4d03f' : '#666', fontWeight: 600 }}>
                  {!isVip && '🔒 '}{f.label}
                </span>
              </div>))}
          </div>
        </div>

        
        {!isVip && (<>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#9b59b6', marginBottom: 8 }}>{t('vip_heroes_label')}</div>
            {[
                { type: 'paladin', icon: '⚔️', name: t('u_paladin'), atk: 80, def: 60, cost: 100 },
                { type: 'dragon_rider', icon: '🐉', name: t('u_dragon_rider'), atk: 250, def: 150, cost: 300 },
            ].map(h => (<div key={h.type} style={{
                    background: 'linear-gradient(135deg,rgba(20,0,40,0.9),rgba(30,0,60,0.8))',
                    border: '1px solid rgba(155,89,182,0.15)',
                    borderRadius: 12, padding: '12px 14px', marginBottom: 10,
                    display: 'flex', alignItems: 'center', gap: 12, opacity: 0.65,
                }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: 'linear-gradient(135deg,#5b2c6f,#3a1a45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{h.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#9b59b6' }}>🔒 {h.name}</div>
                  <div style={{ fontSize: 11, color: '#a0845a', marginTop: 2, display: 'flex', gap: 10 }}>
                    <span>⚔️ {h.atk}</span><span>🛡️ {h.def}</span><span>💎 {h.cost}{t('per_unit')}</span>
                  </div>
                </div>
              </div>))}

            <div style={{ fontSize: 13, fontWeight: 700, color: '#9b59b6', marginBottom: 8, marginTop: 4 }}>{t('vip_buildings_label')}</div>
            <div style={{
                background: 'linear-gradient(135deg,rgba(30,0,60,0.9),rgba(20,0,40,0.8))',
                border: '1px solid rgba(155,89,182,0.15)',
                borderRadius: 12, padding: '12px 14px', marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 12, opacity: 0.65,
            }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: 'linear-gradient(135deg,#5b2c6f,#3a1a45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🔮</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#9b59b6' }}>🔒 {t('b_arcane_tower')}</div>
                <div style={{ fontSize: 11, color: '#a0845a', marginTop: 2 }}>{t('bd_arcane_tower')}</div>
              </div>
            </div>
          </>)}

      </SECTION>

      
      <SECTION title={t('gems_section', { n: gems })}>
        
        {upgrading.length > 0 && (<>
            <div style={{ fontSize: 12, color: '#a0845a', marginBottom: 6 }}>{t('speedup_label')}</div>
            {upgrading.map(b => {
                const secsLeft = Math.max(0, (new Date(b.upgradeEndsAt).getTime() - Date.now()) / 1000);
                const gemCost = Math.max(1, Math.ceil(secsLeft / 60));
                const canAfford = gems >= gemCost;
                return (<div key={b.id} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(52,152,219,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{t('b_' + b.type)}</div>
                    <div style={{ fontSize: 11, color: '#3498db' }}>⏳ <Countdown_1.default endsAt={b.upgradeEndsAt}/></div>
                  </div>
                  <button className="btn btn-gold" style={{ fontSize: 12, padding: '8px 12px', opacity: canAfford ? 1 : 0.4 }} disabled={speeding === b.type || !canAfford} onClick={() => speedUp(b.type, b.id)}>
                    {speeding === b.type ? '...' : `⚡ ${gemCost} 💎`}
                  </button>
                </div>);
            })}
            <div style={{ marginBottom: 10 }}/>
          </>)}

        {[
            { id: 'shield', icon: '🛡️', label: t('shield_label'), desc: t('shield_desc'), cost: '50 💎', action: () => client_1.api.post('/kingdom/shield').then(r => showMsg(t('shield_active_until', { time: new Date(r.shieldUntil).toLocaleString() }))) },
            { id: 'storage', icon: '📦', label: t('storage_label'), desc: t('storage_desc'), cost: '100 💎', action: () => client_1.api.post('/kingdom/expand-storage').then(r => showMsg(t('storage_expanded', { n: (0, format_1.fmt)(r.maxGold) }))) },
        ].map(item => (<div key={item.id} style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(244,208,63,0.12)', borderRadius: 12, padding: '12px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 26 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: '#a0845a' }}>{item.desc}</div>
            </div>
            <button className="btn btn-gold" style={{ fontSize: 12, padding: '9px 13px', whiteSpace: 'nowrap' }} disabled={loading === 'action'} onClick={() => doAction(item.action)}>
              {item.cost}
            </button>
          </div>))}
      </SECTION>

      
      <SECTION title={t('ads_section', { n: ads ? String(ads.adsWatchedToday) : '...' })}>
        {ads?.boostActive && (<div style={{ background: 'rgba(26,58,26,0.8)', border: '1px solid #27ae6066', borderRadius: 10, padding: '10px 14px', marginBottom: 12, textAlign: 'center', fontSize: 13, color: '#27ae60' }}>
            {t('double_prod_active', { time: new Date(ads.boostUntil).toLocaleTimeString() })}
          </div>)}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { type: 'double_production', icon: '🚀', label: t('double_prod'), desc: t('double_prod_desc'), boosted: ads?.boostActive, boostUntil: ads?.boostUntil },
            { type: 'double_attack_speed', icon: '⚡', label: t('double_attack_speed'), desc: t('double_attack_speed_desc'), boosted: ads?.attackBoostActive, boostUntil: ads?.attackBoostUntil },
            { type: 'usdt_bonus', icon: '💵', label: '+0.0001 USDT', desc: t('instantly') },
            { type: 'gems', icon: '💎', label: '+10 Gems', desc: t('instantly') },
            { type: 'gold_bonus', icon: '💰', label: `+500 ${t('gold')}`, desc: t('instantly') },
            { type: 'wood_bonus', icon: '🪵', label: `+500 ${t('wood')}`, desc: t('instantly') },
            { type: 'stone_bonus', icon: '🪨', label: `+500 ${t('stone')}`, desc: t('instantly') },
            { type: 'food_bonus', icon: '🌾', label: `+500 ${t('food')}`, desc: t('instantly') },
        ].map(({ type, icon, label, desc, boosted, boostUntil }) => (<div key={type} style={{
                background: boosted ? 'rgba(39,174,96,0.1)' : 'rgba(0,0,0,0.35)',
                border: `1px solid ${boosted ? 'rgba(39,174,96,0.4)' : 'rgba(39,174,96,0.15)'}`,
                borderRadius: 12, padding: '10px 12px',
                display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', textAlign: 'center',
            }}>
              <span style={{ fontSize: 26 }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{label}</div>
                <div style={{ fontSize: 10, color: '#a0845a' }}>{boosted ? <Countdown_1.default endsAt={boostUntil}/> : desc}</div>
              </div>
              <button className="btn btn-green" style={{ width: '100%', fontSize: 11, padding: '7px 0', opacity: (adsLeft === 0 || boosted) ? 0.4 : 1 }} disabled={adsLeft === 0 || loading === type || boosted} onClick={() => watchAd(type)}>
                {loading === type ? '...' : boosted ? '✓ פעיל' : t('watch_ad')}
              </button>
            </div>))}
        </div>
        {adsLeft === 0 && (<div style={{ textAlign: 'center', fontSize: 12, color: '#a0845a', marginTop: 10 }}>
            {t('ads_limit')}
          </div>)}
      </SECTION>

      
      <UsdtBalanceSection />
    </div>);
}
//# sourceMappingURL=ShopScreen.js.map