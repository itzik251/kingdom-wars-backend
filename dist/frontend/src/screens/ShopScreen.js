"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletBar = WalletBar;
exports.default = ShopScreen;
const react_1 = require("react");
const ui_react_1 = require("@tonconnect/ui-react");
const client_1 = require("../api/client");
const gameStore_1 = require("../store/gameStore");
const format_1 = require("../utils/format");
const Countdown_1 = require("../components/Countdown");
const useT_1 = require("../i18n/useT");
const core_1 = require("@ton/core");
const USDT_JETTON_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
const GAME_WALLET = 'UQBQeWT7nw0KjeKmSbxsmqqgDRh61H-_ZamVc3_I5S1jNX0T';
const VIP_PRICE_USDT = 5;
const TONCENTER = 'https://toncenter.com/api/v3';
const REWARD_AD_BLOCK_ID = '34207';
async function getJettonWalletAddr(ownerAddress) {
    try {
        const res = await fetch(`${TONCENTER}/jetton/wallets?owner_address=${encodeURIComponent(ownerAddress)}&jetton_address=${USDT_JETTON_MASTER}&limit=1`);
        const json = await res.json();
        return json?.jetton_wallets?.[0]?.address || null;
    }
    catch {
        return null;
    }
}
function buildUsdtTransferBody(destinationAddress, senderAddress, nanoUsdt) {
    return (0, core_1.beginCell)()
        .storeUint(0xf8a7ea5, 32)
        .storeUint(0, 64)
        .storeCoins(nanoUsdt)
        .storeAddress(core_1.Address.parse(destinationAddress))
        .storeAddress(core_1.Address.parse(senderAddress))
        .storeBit(false)
        .storeCoins((0, core_1.toNano)('0.01'))
        .storeBit(false)
        .endCell();
}
function WalletBar() {
    const [tonConnectUI] = (0, ui_react_1.useTonConnectUI)();
    const wallet = (0, ui_react_1.useTonWallet)();
    const t = (0, useT_1.useT)();
    const shortAddr = wallet
        ? core_1.Address.parseRaw(wallet.account.address).toString({ bounceable: false }).slice(0, 6) + '...' +
            core_1.Address.parseRaw(wallet.account.address).toString({ bounceable: false }).slice(-4)
        : null;
    return (<div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: wallet ? 'rgba(0,136,204,0.12)' : 'rgba(0,0,0,0.25)',
            border: `1px solid ${wallet ? 'rgba(0,136,204,0.4)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 12, padding: '10px 14px', marginBottom: 14,
        }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>💎</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: wallet ? '#3498db' : '#a0845a' }}>
            {wallet ? t('wallet_connected') : t('ton_wallet')}
          </div>
          {wallet && (<div style={{ fontSize: 10, color: '#5d8aa8', marginTop: 1 }}>{shortAddr}</div>)}
        </div>
      </div>
      {wallet ? (<button onClick={() => tonConnectUI.disconnect()} style={{ fontSize: 11, padding: '5px 10px', background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c', borderRadius: 8, cursor: 'pointer' }}>
          {t('disconnect_wallet')}
        </button>) : (<button onClick={() => tonConnectUI.openModal()} style={{ fontSize: 12, padding: '7px 14px', background: 'linear-gradient(135deg,#0088cc,#005f8f)', border: 'none', color: '#fff', fontWeight: 700, borderRadius: 8, cursor: 'pointer' }}>
          🔗 {t('connect_wallet')}
        </button>)}
    </div>);
}
async function sendUsdtViaTon(tonConnectUI, wallet, amountUsdt, showMsg, onSuccess, t, verifyEndpoint) {
    const senderAddr = wallet.account.address;
    const senderFriendly = core_1.Address.parseRaw(senderAddr).toString({ bounceable: false });
    const jettonWallet = await getJettonWalletAddr(senderFriendly);
    if (!jettonWallet) {
        showMsg('❌ ' + t('wallet_no_usdt'), false);
        return false;
    }
    const nanoUsdt = BigInt(Math.round(amountUsdt * 1_000_000));
    const body = buildUsdtTransferBody(GAME_WALLET, senderFriendly, nanoUsdt);
    const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{ address: jettonWallet, amount: (0, core_1.toNano)('0.05').toString(), payload: body.toBoc().toString('base64') }],
    });
    showMsg('⏳ ' + t('vip_tx_sent'), true);
    const txHash = result.boc.replace(/[+/=]/g, (c) => c === '+' ? '-' : c === '/' ? '_' : '').slice(0, 44);
    let attempts = 0;
    return new Promise(res => {
        const poll = setInterval(async () => {
            attempts++;
            if (attempts > 30) {
                clearInterval(poll);
                try {
                    await client_1.api.post(verifyEndpoint, { tonTxHash: txHash });
                    showMsg('✅ ' + t('vip_activated_usdt'), true);
                    onSuccess();
                    res(true);
                }
                catch (e) {
                    showMsg(e.response?.data?.message || t('vip_tx_verify_pending'), false);
                    res(false);
                }
                return;
            }
            try {
                const r = await client_1.api.post(verifyEndpoint, { tonTxHash: txHash });
                if (r.success) {
                    clearInterval(poll);
                    showMsg('👑 ' + t('vip_activated_usdt'), true);
                    onSuccess();
                    res(true);
                }
            }
            catch { }
        }, 4000);
    });
}
function VipPaymentButtons({ loading, onLoading, showMsg, onSuccess }) {
    const t = (0, useT_1.useT)();
    const [tonConnectUI] = (0, ui_react_1.useTonConnectUI)();
    const wallet = (0, ui_react_1.useTonWallet)();
    const [polling, setPolling] = (0, react_1.useState)(false);
    async function payWithTonWallet() {
        if (!wallet) {
            tonConnectUI.openModal();
            return;
        }
        onLoading(true);
        setPolling(true);
        try {
            await sendUsdtViaTon(tonConnectUI, wallet, VIP_PRICE_USDT, showMsg, onSuccess, t, '/vip/activate');
        }
        catch (e) {
            showMsg(e?.message?.includes('rejects') || e?.message?.includes('cancel') ? t('payment_cancelled') : (e?.message || t('error')), false);
        }
        finally {
            onLoading(false);
            setPolling(false);
        }
    }
    async function payWithBalance() {
        onLoading(true);
        try {
            await client_1.api.post('/vip/purchase-with-usdt');
            showMsg('👑 ' + t('vip_activated_usdt'));
            onSuccess();
        }
        catch (e) {
            showMsg(e.response?.data?.message || t('error'), false);
        }
        finally {
            onLoading(false);
        }
    }
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {wallet ? (<button style={{ fontSize: 12, padding: '9px 12px', background: 'linear-gradient(135deg,#0088cc,#005f8f)', border: 'none', color: '#fff', fontWeight: 800, borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={payWithTonWallet}>
          {loading && polling ? '⏳ ' + t('vip_verifying') : `💎 ${VIP_PRICE_USDT} USDT`}
        </button>) : (<div style={{ fontSize: 11, color: '#5d8aa8', textAlign: 'center', padding: '6px 0' }}>
          🔗 {t('connect_wallet_to_pay_vip')}
        </div>)}
      <button style={{ fontSize: 11, padding: '7px 10px', background: 'rgba(39,174,96,0.2)', border: '1px solid rgba(39,174,96,0.4)', color: '#27ae60', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={payWithBalance}>
        💵 {t('vip_pay_usdt_balance')}
      </button>
    </div>);
}
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
    const { kingdom, refresh } = (0, gameStore_1.useGameStore)();
    const storeBalance = kingdom?.usdtBalance ?? 0;
    const [balance, setBalance] = (0, react_1.useState)(null);
    const [withdrawalStatus, setWithdrawalStatus] = (0, react_1.useState)('none');
    const [withdrawalPending, setWithdrawalPending] = (0, react_1.useState)(0);
    const [withdrawalWallet, setWithdrawalWallet] = (0, react_1.useState)('');
    const [walletInput, setWalletInput] = (0, react_1.useState)('');
    const [showWalletForm, setShowWalletForm] = (0, react_1.useState)(false);
    const [submitting, setSubmitting] = (0, react_1.useState)(false);
    const [msg, setMsg] = (0, react_1.useState)('');
    const t = (0, useT_1.useT)();
    const bal = balance ?? storeBalance;
    async function load() {
        try {
            const r = await client_1.api.get('/kingdom/usdt-balance');
            setBalance(r.usdtBalance ?? 0);
            setWithdrawalStatus(r.withdrawalStatus ?? 'none');
            setWithdrawalPending(r.withdrawalPending ?? 0);
            setWithdrawalWallet(r.withdrawalWallet ?? '');
        }
        catch { }
    }
    (0, react_1.useEffect)(() => { setBalance(storeBalance); }, [storeBalance]);
    (0, react_1.useEffect)(() => {
        load();
        window.addEventListener('usdt-balance-refresh', load);
        return () => window.removeEventListener('usdt-balance-refresh', load);
    }, []);
    async function submitWithdrawal() {
        if (!walletInput.trim() || walletInput.trim().length < 10) {
            setMsg('❌ ' + t('invalid_wallet'));
            return;
        }
        setSubmitting(true);
        try {
            const r = await client_1.api.post('/kingdom/request-withdrawal', { walletAddress: walletInput.trim() });
            setMsg('✅ ' + t('withdrawal_submitted'));
            setShowWalletForm(false);
            await load();
        }
        catch (e) {
            setMsg('❌ ' + (e.response?.data?.message || t('error')));
        }
        finally {
            setSubmitting(false);
            setTimeout(() => setMsg(''), 6000);
        }
    }
    const isPending = withdrawalStatus === 'pending';
    const isApproved = withdrawalStatus === 'approved';
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
          {isPending ? (<div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#f4d03f', fontWeight: 700 }}>⏳ {t('withdrawal_pending')}</div>
              <div style={{ fontSize: 11, color: '#a0845a', marginTop: 2 }}>${withdrawalPending.toFixed(4)} USDT</div>
            </div>) : bal >= 20 ? (<button onClick={() => setShowWalletForm(v => !v)} style={{ padding: '11px 16px', borderRadius: 12, background: 'linear-gradient(135deg,#27ae60,#1e8449)', border: 'none', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
              {t('withdraw_btn')}
            </button>) : (<div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#a0845a' }}>{t('to_withdraw')}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#f4d03f' }}>{t('withdraw_min')}</div>
            </div>)}
        </div>

        
        {isPending && (<div style={{ background: 'rgba(244,208,63,0.1)', border: '1px solid rgba(244,208,63,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: '#f4d03f', marginBottom: 4 }}>⏳ {t('withdrawal_processing')}</div>
            <div style={{ color: '#a0845a' }}>💳 {t('wallet_label')}: <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: 10 }}>{withdrawalWallet}</span></div>
            <div style={{ color: '#a0845a', marginTop: 4 }}>💵 {t('amount_label')}: <strong style={{ color: '#f4d03f' }}>${withdrawalPending.toFixed(4)} USDT</strong></div>
          </div>)}

        
        {showWalletForm && !isPending && (<div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#a0845a', marginBottom: 6 }}>
              📋 {t('enter_wallet_address')} (TRC20 USDT)
            </div>
            <input type="text" value={walletInput} onChange={e => setWalletInput(e.target.value)} placeholder="T... (Tron TRC20)" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 12, fontFamily: 'monospace', marginBottom: 8, outline: 'none' }}/>
            <button onClick={submitWithdrawal} disabled={submitting} style={{ width: '100%', padding: '11px', borderRadius: 10, background: 'linear-gradient(135deg,#27ae60,#1e8449)', border: 'none', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
              {submitting ? '...' : `💸 ${t('confirm_withdrawal')} $${bal.toFixed(4)}`}
            </button>
            <div style={{ fontSize: 10, color: '#666', marginTop: 6 }}>⚠️ {t('withdrawal_note')}</div>
          </div>)}

        
        {!isPending && (<div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#a0845a', marginBottom: 4 }}>
              <span>{bal >= 20 ? t('can_withdraw') : t('until_withdraw', { n: (20 - bal).toFixed(2) })}</span>
              <span>${bal.toFixed(2)} / $20.00</span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (bal / 20) * 100)}%`, background: bal >= 20 ? '#27ae60' : 'linear-gradient(90deg,#b8860b,#f4d03f)', borderRadius: 3, transition: 'width 0.4s' }}/>
            </div>
          </div>)}

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
        if (loading)
            return;
        setLoading(type);
        try {
            const Adsgram = window.Adsgram;
            if (Adsgram) {
                let AdController;
                try {
                    AdController = Adsgram.init({ blockId: REWARD_AD_BLOCK_ID });
                }
                catch (initErr) {
                    console.error('[AdsGram] init error:', initErr);
                    showMsg(`📺 Ad init error: ${initErr?.message || 'unknown'}`, false);
                    return;
                }
                const showPromise = AdController.show();
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AD_TIMEOUT')), 30_000));
                try {
                    const result = await Promise.race([showPromise, timeoutPromise]);
                    console.log('[AdsGram] show result:', result);
                    if (!result?.done) {
                        const desc = (result?.description || '').toLowerCase();
                        const userSkipped = desc.includes('skip') || desc.includes('close') || desc.includes('dismiss') || desc.includes('cancel');
                        if (userSkipped) {
                            showMsg('📺 ' + t('ad_not_completed'), false);
                            return;
                        }
                        console.warn('[AdsGram] no ad available (done:false), granting reward. desc:', result?.description);
                    }
                }
                catch (adErr) {
                    console.error('[AdsGram] show error:', adErr);
                    const desc = (adErr?.description || adErr?.message || '').toLowerCase();
                    if (adErr?.message === 'AD_TIMEOUT') {
                        showMsg('📺 ' + t('ad_not_completed'), false);
                        return;
                    }
                    const userDismissed = desc.includes('skip') || desc.includes('close') || desc.includes('dismiss') || desc.includes('cancel');
                    if (userDismissed) {
                        showMsg('📺 ' + t('ad_not_completed'), false);
                        return;
                    }
                    console.warn('[AdsGram] SDK error, granting reward:', desc);
                }
            }
            else {
                console.warn('[AdsGram] SDK not loaded, granting reward in dev mode');
            }
            const reward = await client_1.api.post('/ads/reward', { type });
            const rewardTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const msgs = {
                double_production: `🚀 ${t('double_prod')} — ${t('double_prod_active', { time: rewardTime(reward.boostUntil) })}`,
                double_attack_speed: `⚡ ${t('double_attack_speed_active', { time: rewardTime(reward.boostUntil) })}`,
                usdt_bonus: `💵 +0.0001 USDT ${t('added_to_balance')}`,
                gems: `💎 +10 Gems ${t('added_to_balance')}`,
                gold_bonus: `💰 +500 ${t('gold')} ${t('added_to_balance')}`,
                wood_bonus: `🪵 +400 ${t('wood')} ${t('added_to_balance')}`,
                stone_bonus: `🪨 +300 ${t('stone')} ${t('added_to_balance')}`,
                food_bonus: `🌾 +200 ${t('food')} ${t('added_to_balance')}`,
            };
            showMsg(msgs[type] || '✅ ' + t('confirm'));
            await Promise.all([load(), refresh()]);
            window.dispatchEvent(new Event('usdt-balance-refresh'));
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

      
      <WalletBar />

      
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
            : <VipPaymentButtons loading={loading === 'action'} onLoading={(v) => setLoading(v ? 'action' : null)} showMsg={showMsg} onSuccess={() => { load(); refresh(); window.dispatchEvent(new Event('usdt-balance-refresh')); }}/>}
          </div>

          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
            { icon: '⚡', label: t('vip_fast_build_pct') },
            { icon: '🔮', label: t('b_arcane_tower') },
            { icon: '🚫', label: t('vip_no_ads') },
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
            { type: 'double_production', icon: '🚀', label: t('double_prod'), desc: t('double_prod_desc'), boosted: ads?.boostActive && ads?.boostUntil && new Date(ads.boostUntil) > new Date(), boostUntil: ads?.boostUntil },
            { type: 'double_attack_speed', icon: '⚡', label: t('double_attack_speed'), desc: t('double_attack_speed_desc'), boosted: ads?.attackBoostActive && ads?.attackBoostUntil && new Date(ads.attackBoostUntil) > new Date(), boostUntil: ads?.attackBoostUntil },
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
                <div style={{ fontSize: 10, color: '#a0845a' }}>{boosted ? <Countdown_1.default endsAt={boostUntil} onEnd={load}/> : desc}</div>
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