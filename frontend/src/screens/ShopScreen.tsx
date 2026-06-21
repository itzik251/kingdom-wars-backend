import { useEffect, useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { api } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { fmt } from '../utils/format';
import Countdown from '../components/Countdown';
import { useT } from '../i18n/useT';
import { beginCell, Address, toNano, Cell } from '@ton/core';

// USDT-TON jetton master contract (Tether on TON mainnet)
const USDT_JETTON_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
// Game wallet that receives VIP payments
const GAME_WALLET = 'UQBQeWT7nw0KjeKmSbxsmqqgDRh61H-_ZamVc3_I5S1jNX0T';
const VIP_PRICE_USDT = 5; // 5 USDT on TON
const TONCENTER = 'https://toncenter.com/api/v3';

const REWARD_AD_BLOCK_ID = '34710';

// ─── Helper: get USDT jetton wallet address for an owner ─────
async function getJettonWalletAddr(ownerAddress: string): Promise<string | null> {
  try {
    const res = await fetch(`${TONCENTER}/jetton/wallets?owner_address=${encodeURIComponent(ownerAddress)}&jetton_address=${USDT_JETTON_MASTER}&limit=1`);
    const json = await res.json();
    return json?.jetton_wallets?.[0]?.address || null;
  } catch { return null; }
}

// ─── Build USDT Jetton transfer cell ─────────────────────────
function buildUsdtTransferBody(destinationAddress: string, senderAddress: string, nanoUsdt: bigint) {
  return beginCell()
    .storeUint(0xf8a7ea5, 32)          // op: transfer
    .storeUint(0, 64)                   // query_id
    .storeCoins(nanoUsdt)               // amount (6 decimals)
    .storeAddress(Address.parse(destinationAddress))  // destination
    .storeAddress(Address.parse(senderAddress))       // response_destination
    .storeBit(false)                    // no custom_payload
    .storeCoins(toNano('0.01'))         // forward_ton_amount (notify recipient)
    .storeBit(false)                    // no forward_payload
    .endCell();
}

// ─── Wallet Connect Bar — מוצג בראש החנות ───────────────────
export function WalletBar() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const t = useT();

  const shortAddr = wallet
    ? Address.parseRaw(wallet.account.address).toString({ bounceable: false }).slice(0, 6) + '...' +
      Address.parseRaw(wallet.account.address).toString({ bounceable: false }).slice(-4)
    : null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: wallet ? 'rgba(0,136,204,0.12)' : 'rgba(0,0,0,0.25)',
      border: `1px solid ${wallet ? 'rgba(0,136,204,0.4)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 12, padding: '10px 14px', marginBottom: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src="/assets/icon_dollar.png" style={{ width: 18, height: 18 }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: wallet ? '#3498db' : '#a0845a' }}>
            {wallet ? t('wallet_connected') : t('ton_wallet')}
          </div>
          {wallet && (
            <div style={{ fontSize: 10, color: '#5d8aa8', marginTop: 1 }}>{shortAddr}</div>
          )}
        </div>
      </div>
      {wallet ? (
        <button
          onClick={() => tonConnectUI.disconnect()}
          style={{ fontSize: 11, padding: '5px 10px', background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c', borderRadius: 8, cursor: 'pointer' }}>
          {t('disconnect_wallet')}
        </button>
      ) : (
        <button
          onClick={() => tonConnectUI.openModal()}
          style={{ fontSize: 12, padding: '7px 14px', background: 'linear-gradient(135deg,#0088cc,#005f8f)', border: 'none', color: '#fff', fontWeight: 700, borderRadius: 8, cursor: 'pointer' }}>
          🔗 {t('connect_wallet')}
        </button>
      )}
    </div>
  );
}

// ─── Helper: send USDT via connected wallet ───────────────────
async function sendUsdtViaTon(
  tonConnectUI: any,
  wallet: any,
  amountUsdt: number,
  showMsg: (msg: string, ok?: boolean) => void,
  onSuccess: () => void,
  t: (k: string) => string,
  verifyEndpoint: string,
  successMsg?: string,
) {
  const senderAddr = wallet.account.address;
  const senderFriendly = Address.parseRaw(senderAddr).toString({ bounceable: false });
  const jettonWallet = await getJettonWalletAddr(senderFriendly);
  if (!jettonWallet) { showMsg('❌ ' + t('wallet_no_usdt'), false); return false; }

  const nanoUsdt = BigInt(Math.round(amountUsdt * 1_000_000));
  const body = buildUsdtTransferBody(GAME_WALLET, senderFriendly, nanoUsdt);

  const result = await tonConnectUI.sendTransaction({
    validUntil: Math.floor(Date.now() / 1000) + 600,
    messages: [{ address: jettonWallet, amount: toNano('0.05').toString(), payload: body.toBoc().toString('base64') }],
  });

  showMsg('⏳ ' + t('vip_tx_sent'), true);
  const txHash = Buffer.from(Cell.fromBase64(result.boc).hash()).toString('hex');

  // Extra data for endpoints that need the amount (topup-usdt)
  const extraData = verifyEndpoint.includes('topup') ? { amount: amountUsdt } : {};

  let attempts = 0;
  return new Promise<boolean>(res => {
    const poll = setInterval(async () => {
      attempts++;
      if (attempts > 30) {
        clearInterval(poll);
        try {
          await api.post(verifyEndpoint, { tonTxHash: txHash, ...extraData });
          if (successMsg) showMsg(successMsg, true);
          onSuccess();
          res(true);
        } catch (e: any) {
          showMsg(e.response?.data?.message || t('vip_tx_verify_pending'), false);
          res(false);
        }
        return;
      }
      try {
        await api.post(verifyEndpoint, { tonTxHash: txHash, ...extraData });
        clearInterval(poll);
        if (successMsg) showMsg(successMsg, true);
        onSuccess();
        res(true);
      } catch { /* keep polling */ }
    }, 4000);
  });
}

// ─── VIP payment buttons ──────────────────────────────────────
function VipPaymentButtons({ loading, onLoading, showMsg, onSuccess }: {
  loading: boolean;
  onLoading: (v: boolean) => void;
  showMsg: (msg: string, ok?: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useT();
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [polling, setPolling] = useState(false);

  async function payWithTonWallet() {
    if (!wallet) { tonConnectUI.openModal(); return; }
    onLoading(true);
    setPolling(true);
    try {
      await sendUsdtViaTon(tonConnectUI, wallet, VIP_PRICE_USDT, showMsg, onSuccess, t, '/vip/activate', '👑 ' + t('vip_activated_usdt'));
    } catch (e: any) {
      showMsg(e?.message?.includes('rejects') || e?.message?.includes('cancel') ? t('payment_cancelled') : (e?.message || t('error')), false);
    } finally { onLoading(false); setPolling(false); }
  }

  async function payWithBalance() {
    onLoading(true);
    try {
      await api.post('/vip/purchase-with-usdt');
      showMsg('👑 ' + t('vip_activated_usdt'));
      onSuccess();
    } catch (e: any) {
      showMsg(e.response?.data?.message || t('error'), false);
    } finally { onLoading(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {wallet ? (
        <button
          style={{ fontSize: 12, padding: '9px 12px', background: 'linear-gradient(135deg,#0088cc,#005f8f)', border: 'none', color: '#fff', fontWeight: 800, borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          disabled={loading}
          onClick={payWithTonWallet}>
          {loading && polling ? '⏳ ' + t('vip_verifying') : `💵 ${VIP_PRICE_USDT} USDT`}
        </button>
      ) : (
        <div style={{ fontSize: 11, color: '#5d8aa8', textAlign: 'center', padding: '6px 0' }}>
          🔗 {t('connect_wallet_to_pay_vip')}
        </div>
      )}
      <button
        style={{ fontSize: 11, padding: '7px 10px', background: 'rgba(39,174,96,0.2)', border: '1px solid rgba(39,174,96,0.4)', color: '#27ae60', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        disabled={loading}
        onClick={payWithBalance}>
        💵 {t('vip_pay_usdt_balance')}
      </button>
    </div>
  );
}

function ReferralCard() {
  const [referral, setReferral] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [claimMsg, setClaimMsg] = useState('');
  const t = useT();

  useEffect(() => {
    api.get('/referral').then(setReferral).catch(() => {});
  }, []);

  const link = referral?.link || null;

  function copy() {
    if (!link) return;
    navigator.clipboard?.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function claim(count: number) {
    setClaiming(count);
    try {
      const r = await api.post(`/referral/claim/${count}`);
      setClaimMsg(r.gems > 0 ? t('ref_gems_received', { n: r.gems }) : t('claimed_success'));
      const updated = await api.get('/referral');
      setReferral(updated);
    } catch (e: any) {
      setClaimMsg('❌ ' + (e.response?.data?.message || t('error')));
    } finally {
      setClaiming(null);
      setTimeout(() => setClaimMsg(''), 3000);
    }
  }

  const mkLabel = (n: number) => `${n} ${n === 1 ? t('friend') : t('friends')}`;
  const MILESTONES = [
    { count: 1,  gems: 100, label: mkLabel(1) },
    { count: 5,  gems: 200, label: mkLabel(5) },
    { count: 10, gems: 0,   label: mkLabel(10), extra: `🦸 ${t('ragnar_name')}` },
    { count: 20, gems: 0,   label: mkLabel(20), extra: `👑 ${t('vip_monthly_free')}` },
  ];

  return (
    <div style={{ background: 'linear-gradient(135deg,rgba(39,174,96,0.1),rgba(26,138,64,0.05))', border: '1px solid rgba(39,174,96,0.3)', borderRadius: 14, padding: 14 }}>
      {/* Link */}
      <div style={{ fontSize: 12, color: '#a0845a', marginBottom: 8 }}>
        👥 {t('friends_invited', { n: referral?.referredCount ?? 0 })}
        {(referral?.totalReferredCount ?? 0) > (referral?.referredCount ?? 0) && (
          <span style={{ fontSize: 10, color: '#f39c12', marginRight: 6 }}>
            {' '}+{(referral?.totalReferredCount ?? 0) - (referral?.referredCount ?? 0)} ⏳
          </span>
        )}
      </div>

      {link ? (
        <>
          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: '8px 10px', fontSize: 10, color: '#7dbb3f', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: 8 }}>
            {link}
          </div>
          <button onClick={copy}
            style={{ width: '100%', padding: '10px', borderRadius: 10, background: copied ? 'linear-gradient(135deg,#27ae60,#1e8449)' : 'rgba(39,174,96,0.2)', border: '1px solid rgba(39,174,96,0.5)', color: copied ? '#fff' : '#27ae60', fontWeight: 800, fontSize: 13, cursor: 'pointer', marginBottom: 12 }}>
            {copied ? t('copied') : t('ref_copy_link')}
          </button>
        </>
      ) : (
        <div style={{ textAlign: 'center', fontSize: 12, color: '#a0845a', padding: '10px 0' }}>{t('loading')}</div>
      )}

      {/* Anti-cheat note */}
      <div style={{ fontSize: 10, color: '#666', background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '6px 10px', marginBottom: 8, lineHeight: 1.5 }}>
        ⚠️ {t('ref_anticheat_note')}
      </div>

      {/* Milestones */}
      <div style={{ fontSize: 11, fontWeight: 700, color: '#a0845a', marginBottom: 6 }}>{t('milestones_lbl')}</div>
      {claimMsg && <div style={{ textAlign: 'center', fontSize: 12, color: claimMsg.startsWith('✅') ? '#27ae60' : '#e74c3c', marginBottom: 8 }}>{claimMsg}</div>}
      {MILESTONES.map(m => {
        const data = referral?.milestones?.find((x: any) => x.count === m.count);
        const reached = data?.reached;
        const claimed = data?.alreadyClaimed;
        const referredCount = referral?.referredCount ?? 0;
        const progress = Math.min(referredCount, m.count);
        return (
          <div key={m.count} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 10px', border: `1px solid ${claimed ? 'rgba(39,174,96,0.3)' : reached ? 'rgba(244,208,63,0.3)' : 'rgba(255,255,255,0.05)'}` }}>
            <div style={{ fontSize: 18 }}>{claimed ? '✅' : reached ? '🎁' : '🔒'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: claimed ? '#27ae60' : reached ? '#f4d03f' : '#666' }}>
                {m.label} — {m.gems > 0 ? `${m.gems} 💎` : m.extra}
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(progress / m.count) * 100}%`, background: claimed ? '#27ae60' : '#f4d03f', borderRadius: 2, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: 9, color: '#666', marginTop: 2 }}>{progress}/{m.count}</div>
            </div>
            {reached && !claimed && (
              <button onClick={() => claim(m.count)} disabled={claiming === m.count}
                style={{ padding: '6px 10px', borderRadius: 8, background: 'linear-gradient(135deg,#f4d03f,#b8860b)', border: 'none', color: '#1a0a00', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                {claiming === m.count ? '...' : t('claim_btn')}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function UsdtBalanceSection() {
  const { kingdom, refresh } = useGameStore();
  // Balance comes directly from game store (refreshed every 10s + on demand)
  const storeBalance = (kingdom as any)?.usdtBalance ?? 0;
  const [balance, setBalance] = useState<number | null>(null);
  const [withdrawalStatus, setWithdrawalStatus] = useState('none');
  const [withdrawalPending, setWithdrawalPending] = useState(0);
  const [withdrawalWallet, setWithdrawalWallet] = useState('');
  const [walletInput, setWalletInput] = useState('');
  const [showWalletForm, setShowWalletForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const t = useT();

  // Use store balance immediately (no lag)
  const bal = balance ?? storeBalance;

  async function load() {
    try {
      const r = await api.get('/kingdom/usdt-balance');
      setBalance(r.usdtBalance ?? 0);
      setWithdrawalStatus(r.withdrawalStatus ?? 'none');
      setWithdrawalPending(r.withdrawalPending ?? 0);
      setWithdrawalWallet(r.withdrawalWallet ?? '');
    } catch {}
  }

  // Sync store balance immediately
  useEffect(() => { setBalance(storeBalance); }, [storeBalance]);

  useEffect(() => {
    load();
    window.addEventListener('usdt-balance-refresh', load);
    return () => window.removeEventListener('usdt-balance-refresh', load);
  }, []);

  const [amountInput, setAmountInput] = useState('');

  async function submitWithdrawal() {
    const wallet = walletInput.trim();
    const amount = parseFloat(amountInput);
    if (!wallet || wallet.length < 10) { setMsg('❌ ' + t('invalid_wallet')); return; }
    if (!amount || amount < 1) { setMsg('❌ סכום מינימלי: $1'); return; }
    if (amount > bal) { setMsg('❌ יתרה לא מספיקה'); return; }
    setSubmitting(true);
    try {
      await api.post('/kingdom/request-withdrawal', { walletAddress: wallet, amount });
      setMsg('✅ ' + t('withdrawal_submitted'));
      setShowWalletForm(false);
      setWalletInput('');
      setAmountInput('');
      await load();
    } catch (e: any) {
      setMsg('❌ ' + (e.response?.data?.message || t('error')));
    } finally {
      setSubmitting(false);
      setTimeout(() => setMsg(''), 6000);
    }
  }

  // bal is defined above using store balance as fallback
  const isPending = withdrawalStatus === 'pending';
  const isApproved = withdrawalStatus === 'approved';

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#a0845a', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <img src="/assets/icon_dollar.png" style={{ width: 14, height: 14 }} />
        {t('usdt_section')}
      </div>
      <div style={{ background: 'linear-gradient(135deg,rgba(39,174,96,0.12),rgba(26,138,64,0.06))', border: '1px solid rgba(39,174,96,0.25)', borderRadius: 14, padding: 16 }}>

        {/* Balance */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: '#a0845a' }}>{t('available_balance')}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: bal > 0 ? '#27ae60' : '#666' }}>
              ${bal.toFixed(3)} USDT
            </div>
          </div>
          {isPending ? (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#f4d03f', fontWeight: 700 }}>⏳ {t('withdrawal_pending')}</div>
              <div style={{ fontSize: 11, color: '#a0845a', marginTop: 2 }}>${withdrawalPending.toFixed(3)} USDT</div>
            </div>
          ) : bal >= 50 ? (
            <button onClick={() => setShowWalletForm(v => !v)}
              style={{ padding: '11px 16px', borderRadius: 12, background: 'linear-gradient(135deg,#27ae60,#1e8449)', border: 'none', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
              {t('withdraw_btn')}
            </button>
          ) : (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#a0845a' }}>{t('to_withdraw')}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#f4d03f' }}>{t('withdraw_min')}</div>
            </div>
          )}
        </div>

        {/* Pending status */}
        {isPending && (
          <div style={{ background: 'rgba(244,208,63,0.1)', border: '1px solid rgba(244,208,63,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: '#f4d03f', marginBottom: 4 }}>⏳ {t('withdrawal_processing')}</div>
            <div style={{ color: '#a0845a' }}>💳 {t('wallet_label')}: <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: 10 }}>{withdrawalWallet}</span></div>
            <div style={{ color: '#a0845a', marginTop: 4 }}>💵 {t('amount_label')}: <strong style={{ color: '#f4d03f' }}>${withdrawalPending.toFixed(3)} USDT</strong></div>
          </div>
        )}

        {/* Wallet form */}
        {showWalletForm && !isPending && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#a0845a', marginBottom: 6 }}>💳 כתובת ארנק TON (UQ... / EQ...)</div>
            <input
              type="text"
              value={walletInput}
              onChange={e => setWalletInput(e.target.value)}
              placeholder="UQ... או EQ..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 12, fontFamily: 'monospace', marginBottom: 8, outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 11, color: '#a0845a', marginBottom: 4 }}>💵 סכום למשיכה (יתרה: ${bal.toFixed(2)})</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input
                type="number"
                value={amountInput}
                onChange={e => setAmountInput(e.target.value)}
                placeholder="0.00"
                min="1" step="0.01"
                style={{ flex: 1, padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, outline: 'none' }}
              />
              <button onClick={() => setAmountInput(bal.toFixed(2))}
                style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(244,208,63,0.15)', border: '1px solid rgba(244,208,63,0.3)', color: '#f4d03f', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                הכל
              </button>
            </div>
            <button onClick={submitWithdrawal} disabled={submitting}
              style={{ width: '100%', padding: '11px', borderRadius: 10, background: 'linear-gradient(135deg,#27ae60,#1e8449)', border: 'none', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
              {submitting ? '...' : `💸 ${t('confirm_withdrawal')} $${parseFloat(amountInput || '0').toFixed(2)}`}
            </button>
            <div style={{ fontSize: 10, color: '#666', marginTop: 6 }}>⚠️ {t('withdrawal_note')}</div>
          </div>
        )}

        {/* Progress bar */}
        {!isPending && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#a0845a', marginBottom: 4 }}>
              <span>{bal >= 50 ? t('can_withdraw') : t('until_withdraw', { n: (50 - bal).toFixed(2) })}</span>
              <span>${bal.toFixed(2)} / $50.00</span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (bal / 50) * 100)}%`, background: bal >= 50 ? '#27ae60' : 'linear-gradient(90deg,#b8860b,#f4d03f)', borderRadius: 3, transition: 'width 0.4s' }} />
            </div>
          </div>
        )}

        {msg && <div style={{ fontSize: 12, marginTop: 6, color: msg.startsWith('✅') ? '#27ae60' : '#e74c3c', textAlign: 'center' }}>{msg}</div>}

        <div style={{ fontSize: 10, color: '#666', marginTop: 6, lineHeight: 1.5 }}>
          {t('withdraw_info')}
        </div>
      </div>
    </div>
  );
}

// ─── USDT Top-up ─────────────────────────────────────────────────
function UsdtTopupSection({ refresh }: { refresh: () => Promise<void> }) {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const t = useT();
  const [amount, setAmount] = useState<number>(5);
  const [custom, setCustom] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState(true);
  const PRESETS = [5, 10, 20, 30, 50];

  function show(text: string, ok = true) { setMsg(text); setMsgOk(ok); setTimeout(() => setMsg(''), 5000); }

  const finalAmount = useCustom ? parseFloat(custom) || 0 : amount;

  async function pay() {
    if (!wallet) { tonConnectUI.openModal(); return; }
    if (!finalAmount || finalAmount < 5) { show(t('topup_min_error'), false); return; }
    setLoading(true);
    try {
      const result = await sendUsdtViaTon(
        tonConnectUI, wallet, finalAmount,
        show,
        async () => {
          await refresh();
          window.dispatchEvent(new Event('usdt-balance-refresh'));
        },
        t,
        '/kingdom/topup-usdt',
      );
      if (result) show(t('topup_success').replace('{n}', String(finalAmount)));
    } catch (e: any) {
      show(e?.message?.includes('cancel') ? t('payment_cancelled') : (e?.message || t('error')), false);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#27ae60', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid rgba(39,174,96,0.15)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <img src="/assets/icon_dollar.png" style={{ width: 14, height: 14 }} />
        {t('topup_section_title')}
      </div>
      <div style={{ background: 'linear-gradient(135deg,rgba(39,174,96,0.1),rgba(26,138,64,0.05))', border: '1px solid rgba(39,174,96,0.25)', borderRadius: 14, padding: 14 }}>
        <div style={{ fontSize: 12, color: '#a0845a', marginBottom: 10 }}>{t('topup_choose_amount')}</div>

        {/* Preset buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {PRESETS.map(p => (
            <button key={p} onClick={() => { setAmount(p); setUseCustom(false); }}
              style={{ flex: '1 1 0', minWidth: 44, padding: '8px 0', borderRadius: 10, background: !useCustom && amount === p ? 'linear-gradient(135deg,#27ae60,#1e8449)' : 'rgba(39,174,96,0.12)', border: `1px solid ${!useCustom && amount === p ? '#27ae60' : 'rgba(39,174,96,0.3)'}`, color: !useCustom && amount === p ? '#fff' : '#27ae60', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              ${p}
            </button>
          ))}
          <button onClick={() => setUseCustom(v => !v)}
            style={{ flex: '1 1 0', minWidth: 44, padding: '8px 4px', borderRadius: 10, background: useCustom ? 'linear-gradient(135deg,#27ae60,#1e8449)' : 'rgba(39,174,96,0.12)', border: `1px solid ${useCustom ? '#27ae60' : 'rgba(39,174,96,0.3)'}`, color: useCustom ? '#fff' : '#27ae60', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
            {t('topup_custom')}
          </button>
        </div>

        {/* Custom input */}
        {useCustom && (
          <input type="number" min={5} step={1} value={custom} onChange={e => setCustom(e.target.value)}
            placeholder={t('topup_placeholder')}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(39,174,96,0.3)', color: '#fff', fontSize: 13, marginBottom: 10, outline: 'none' }} />
        )}

        <div style={{ fontSize: 11, color: '#a0845a', marginBottom: 10 }}>
          {t('topup_payment_info').replace('{amount}', finalAmount ? `$${finalAmount}` : '—')}
        </div>

        {msg && <div style={{ fontSize: 12, color: msgOk ? '#27ae60' : '#e74c3c', marginBottom: 8, textAlign: 'center' }}>{msg}</div>}

        <button onClick={pay} disabled={loading || finalAmount < 5}
          style={{ width: '100%', padding: '12px', borderRadius: 10, background: loading || !finalAmount || finalAmount < 5 ? 'rgba(39,174,96,0.2)' : 'linear-gradient(135deg,#27ae60,#1e8449)', border: 'none', color: '#fff', fontWeight: 800, fontSize: 13, cursor: loading || !finalAmount || finalAmount < 5 ? 'not-allowed' : 'pointer', opacity: loading || !finalAmount || finalAmount < 5 ? 0.6 : 1 }}>
          {loading ? t('processing') : wallet ? <><img src="/assets/icon_dollar.png" style={{ width: 13, height: 13, marginRight: 4, verticalAlign: 'middle' }} />{t('topup_btn').replace('{amount}', `$${finalAmount || '—'}`)}</> : t('connect_wallet_pay')}
        </button>
      </div>
    </div>
  );
}

// ─── Buy Gems ─────────────────────────────────────────────────────
function BuyGemsSection({ refresh }: { refresh: () => Promise<void> }) {
  const { kingdom } = useGameStore();
  const t = useT();
  const [gems, setGems] = useState(100);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState(true);
  const AMOUNTS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

  function show(text: string, ok = true) { setMsg(text); setMsgOk(ok); setTimeout(() => setMsg(''), 4000); }

  const usdtCost = gems / 100;
  const bal = (kingdom as any)?.usdtBalance ?? 0;
  const canAfford = bal >= usdtCost;

  async function buy() {
    setLoading(true);
    try {
      const r = await api.post('/kingdom/buy-gems', { gems });
      await refresh();
      window.dispatchEvent(new Event('usdt-balance-refresh'));
      show(t('buy_gems_success').replace('{gems}', String(r.gemsAdded)).replace('{bal}', `$${r.usdtBalance?.toFixed(3)}`));
    } catch (e: any) { show('❌ ' + (e.response?.data?.message || t('error')), false); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#9b59b6', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid rgba(155,89,182,0.15)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <img src="/assets/icon_gem.png" style={{ width: 14, height: 14 }} />
        {t('buy_gems_title')}
      </div>
      <div style={{ background: 'linear-gradient(135deg,rgba(155,89,182,0.1),rgba(90,44,111,0.05))', border: '1px solid rgba(155,89,182,0.25)', borderRadius: 14, padding: 14 }}>

        {/* Amount selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, marginBottom: 10 }}>
          {AMOUNTS.map(a => (
            <button key={a} onClick={() => setGems(a)}
              style={{ padding: '7px 2px', borderRadius: 8, background: gems === a ? 'linear-gradient(135deg,#9b59b6,#6c3483)' : 'rgba(155,89,182,0.12)', border: `1px solid ${gems === a ? '#9b59b6' : 'rgba(155,89,182,0.25)'}`, color: gems === a ? '#fff' : '#9b59b6', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
              {a}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 12, color: '#a0845a', marginBottom: 10 }}>
          {t('buy_gems_cost').split('{n}')[0]}<strong style={{ color: canAfford ? '#9b59b6' : '#e74c3c' }}>${usdtCost.toFixed(2)}</strong>{t('buy_gems_cost').split('{n}')[1]}
          {!canAfford && <span style={{ fontSize: 10, color: '#e74c3c', marginRight: 6 }}> — {t('buy_gems_insufficient')}</span>}
        </div>

        {msg && <div style={{ fontSize: 12, color: msgOk ? '#27ae60' : '#e74c3c', marginBottom: 8, textAlign: 'center' }}>{msg}</div>}

        <button onClick={buy} disabled={loading || !canAfford}
          style={{ width: '100%', padding: '11px', borderRadius: 10, background: canAfford && !loading ? 'linear-gradient(135deg,#9b59b6,#6c3483)' : 'rgba(155,89,182,0.2)', border: 'none', color: '#fff', fontWeight: 800, fontSize: 13, cursor: !canAfford || loading ? 'not-allowed' : 'pointer', opacity: !canAfford || loading ? 0.6 : 1 }}>
          {loading ? t('processing') : <><img src="/assets/icon_gem.png" style={{ width: 13, height: 13, marginRight: 4, verticalAlign: 'middle' }} />{t('buy_gems_btn').replace('{gems}', String(gems)).replace('{cost}', `$${usdtCost.toFixed(2)}`)}</>}
        </button>
      </div>
    </div>
  );
}

// ─── Titan Hero ───────────────────────────────────────────────────
// ─── Gem Forge ────────────────────────────────────────────────────
function GemForgeSection({ refresh }: { refresh: () => Promise<void> }) {
  const { kingdom, buildings } = useGameStore();
  const t = useT();
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState(true);
  const bal = (kingdom as any)?.usdtBalance ?? 0;

  function show(text: string, ok = true) { setMsg(text); setMsgOk(ok); setTimeout(() => setMsg(''), 5000); }

  const gemForges = buildings.filter(b => b.type === 'gem_forge');

  async function build() {
    setLoading('build');
    try {
      await api.post('/kingdom/build-gem-forge');
      await refresh();
      show(t('gem_forge_built'));
    } catch (e: any) { show('❌ ' + (e.response?.data?.message || t('error')), false); }
    finally { setLoading(null); }
  }

  async function upgrade(buildingId: string, currentLevel: number) {
    setLoading(buildingId);
    try {
      const r = await api.post('/kingdom/upgrade-gem-forge', { buildingId });
      await refresh();
      show(t('gem_forge_upgraded').replace('{level}', String(r.newLevel)).replace('{gems}', String(r.newLevel * 3)));
    } catch (e: any) {
      const code = e.response?.data?.message || '';
      show('❌ ' + (code === 'GEM_FORGE_MAX_LEVEL' ? t('gem_forge_max_level') : code || t('error')), false);
    }
    finally { setLoading(null); }
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#f4d03f', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid rgba(244,208,63,0.15)' }}>
        {t('gem_forge_title')}
      </div>
      <div style={{ background: 'linear-gradient(135deg,rgba(244,208,63,0.08),rgba(184,134,11,0.04))', border: '1px solid rgba(244,208,63,0.2)', borderRadius: 14, padding: 14 }}>
        <div style={{ fontSize: 11, color: '#a0845a', marginBottom: 10 }}>
          {t('gem_forge_desc')}
        </div>

        {msg && <div style={{ fontSize: 12, color: msgOk ? '#27ae60' : '#e74c3c', marginBottom: 8, textAlign: 'center' }}>{msg}</div>}

        {/* Existing forges */}
        {gemForges.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {gemForges.map(forge => {
              const upgradeCost = parseFloat(((forge.level + 1) * 0.05).toFixed(2));
              const canUpgrade = bal >= upgradeCost && forge.level < 100;
              return (
                <div key={forge.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '8px 12px', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f4d03f' }}>{t('gem_forge_label').replace('{n}', String(forge.slot + 1)).replace('{level}', String(forge.level))}</div>
                    <div style={{ fontSize: 10, color: '#a0845a' }}>{t('gem_forge_produces').replace('{n}', String(Math.floor(5 * Math.pow(1.15, forge.level - 1))))}</div>
                  </div>
                  {forge.level < 100 ? (
                    <button onClick={() => upgrade(forge.id, forge.level)} disabled={loading === forge.id || !canUpgrade}
                      style={{ padding: '7px 10px', borderRadius: 8, background: canUpgrade ? 'linear-gradient(135deg,#b8860b,#f4d03f)' : 'rgba(244,208,63,0.15)', border: 'none', color: canUpgrade ? '#1a0a00' : '#666', fontWeight: 700, fontSize: 11, cursor: !canUpgrade ? 'not-allowed' : 'pointer', opacity: !canUpgrade || loading === forge.id ? 0.6 : 1 }}>
                      {loading === forge.id ? '...' : `⬆️ $${upgradeCost}`}
                    </button>
                  ) : (
                    <div style={{ fontSize: 10, color: '#f4d03f' }}>{t('gem_forge_max_level')}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Build new forge */}
        {gemForges.length < 3 ? (
          <>
            <div style={{ fontSize: 11, color: '#a0845a', marginBottom: 8 }}>
              {t('gem_forge_slot').replace('{n}', String(gemForges.length + 1)).split('0.1 USDT')[0]}<strong style={{ color: bal >= 0.1 ? '#f4d03f' : '#e74c3c' }}>0.1 USDT</strong>
              {bal < 0.1 && <span style={{ color: '#e74c3c', fontSize: 10 }}> — {t('gem_forge_insufficient')}</span>}
            </div>
            <button onClick={build} disabled={loading === 'build' || bal < 0.1}
              style={{ width: '100%', padding: '11px', borderRadius: 10, background: bal >= 0.1 && loading !== 'build' ? 'linear-gradient(135deg,#b8860b,#f4d03f)' : 'rgba(244,208,63,0.15)', border: 'none', color: bal >= 0.1 ? '#1a0a00' : '#666', fontWeight: 800, fontSize: 13, cursor: bal < 0.1 || loading === 'build' ? 'not-allowed' : 'pointer', opacity: bal < 0.1 || loading === 'build' ? 0.6 : 1 }}>
              {loading === 'build' ? t('gem_forge_building') : t('gem_forge_build_btn')}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', fontSize: 12, color: '#f4d03f', padding: '8px 0' }}>{t('gem_forge_max_reached')}</div>
        )}
      </div>
    </div>
  );
}

const SECTION = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 13, fontWeight: 800, color: '#a0845a', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      {title}
    </div>
    {children}
  </div>
);

export default function ShopScreen() {
  const { refresh, kingdom, buildings } = useGameStore();
  const [vip, setVip] = useState<any>(null);
  const [ads, setAds] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState(true);
  const [speeding, setSpeeding] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const [swapGems, setSwapGems] = useState('10');
  const [swapResource, setSwapResource] = useState<'gold'|'wood'|'stone'|'food'>('gold');
  const t = useT();

  // Tick every second so boost countdowns update
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const upgrading = buildings.filter(b => b.upgradeEndsAt && new Date() < new Date(b.upgradeEndsAt));
  const isVip = !!(kingdom as any)?.isVip || vip?.isVip;
  const gems = kingdom?.gems ?? 0;

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [v, a] = await Promise.all([api.get('/vip'), api.get('/ads/status')]);
      setVip(v);
      setAds(a);
    } catch {
      // Keep previous state; don't leave ads as null (which disables all buttons)
      setAds(prev => prev ?? { adsWatchedToday: 0, adsRemainingToday: 30, boostActive: false, boostUntil: null, attackBoostActive: false, attackBoostUntil: null });
    }
  }

  function showMsg(text: string, ok = true) {
    setMsg(text); setMsgOk(ok);
    setTimeout(() => setMsg(''), 4000);
  }

  async function speedUp(type: string, buildingId: string) {
    setSpeeding(type);
    try {
      await api.post('/buildings/speedup', { type, buildingId });
      showMsg(t('speedup_done'));
      await Promise.all([load(), refresh()]);
    } catch (e: any) { showMsg(e.response?.data?.message || t('error'), false); }
    finally { setSpeeding(null); }
  }

  async function watchAd(type: string) {
    if (loading) return; // prevent concurrent ad clicks
    setLoading(type);
    try {
      const Adsgram = (window as any).Adsgram;
      if (Adsgram) {
        let AdController: any = null;
        try {
          AdController = Adsgram.init({ blockId: REWARD_AD_BLOCK_ID });
        } catch {
          setLoading(null);
          setMsg(t('ad_not_available'));
          return;
        }
        if (AdController) {
          let result: any;
          try {
            result = await AdController.show();
          } catch (adErr: any) {
            // AdsGram זרק שגיאה — אין פרסומת זמינה או המשתמש סגר
            setLoading(null);
            setMsg(t('ad_not_available'));
            return;
          }
          // done: false = המשתמש דילג או אין פרסומת
          if (!result?.done) {
            setLoading(null);
            setMsg(t('ad_not_available'));
            return;
          }
        }
      }

      // Ad watched (or SDK unavailable in dev) — claim reward from server
      // Retry up to 3 times: Telegram may suspend the WebApp mid-request (HTTP 499)
      let reward: any;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          reward = await api.post('/ads/reward', { type });
          break;
        } catch (retryErr: any) {
          const isNetworkErr = !retryErr.response; // 499 / network drop = no response object
          if (isNetworkErr && attempt < 3) {
            await new Promise(r => setTimeout(r, 1000 * attempt));
            continue;
          }
          throw retryErr; // real server error or last attempt
        }
      }

      // Refresh so resources/USDT/boost status update in UI before the message
      await Promise.all([load(), refresh()]);
      window.dispatchEvent(new Event('usdt-balance-refresh'));

      const rewardTime = (ts: string) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const msgs: Record<string, string> = {
        double_production:   `🚀 ${t('double_prod')} — ${t('double_prod_active', { time: rewardTime(reward.boostUntil) })}`,
        double_attack_speed: `⚡ ${t('double_attack_speed_active', { time: rewardTime(reward.boostUntil) })}`,
        usdt_bonus:          `💵 +0.001 USDT ${t('added_to_balance')}`,
        gems:                `💎 +10 Gems ${t('added_to_balance')}`,
        gold_bonus:          `💰 +500 ${t('gold')} ${t('added_to_balance')}`,
        wood_bonus:          `🪵 +500 ${t('wood')} ${t('added_to_balance')}`,
        stone_bonus:         `🪨 +500 ${t('stone')} ${t('added_to_balance')}`,
        food_bonus:          `🌾 +500 ${t('food')} ${t('added_to_balance')}`,
      };
      showMsg(msgs[type] || '✅ ' + t('confirm'));
    } catch (e: any) {
      // API or network error
      showMsg(e.response?.data?.message || t('error'), false);
    } finally {
      setLoading(null);
    }
  }

  async function doAction(action: () => Promise<any>) {
    setLoading('action');
    try { await action(); await Promise.all([load(), refresh()]); }
    catch (e: any) { showMsg(e.response?.data?.message || t('error'), false); }
    finally { setLoading(null); }
  }

  const adsLeft = ads?.adsRemainingToday ?? 0;
  const adsMax  = ads ? (ads.adsWatchedToday ?? 0) + (ads.adsRemainingToday ?? 0) : 30;

  return (
    <div className="screen" style={{ paddingBottom: 140 }}>
      <div className="screen-title">{t('shop_title')}</div>

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 14,
          background: msgOk ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)',
          border: `1px solid ${msgOk ? '#27ae60' : '#e74c3c'}44`,
          color: msgOk ? '#27ae60' : '#e74c3c', fontSize: 13, textAlign: 'center',
        }}>{msg}</div>
      )}

      {/* ── Wallet Connect Bar ── */}
      <WalletBar />

      {/* ── USDT Top-up ── */}
      <UsdtTopupSection refresh={refresh} />

      {/* ── USDT Heroes ── */}

      {/* ── VIP ── */}
      <SECTION title={t('vip_section')}>

        {/* VIP Status banner */}
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
              : <VipPaymentButtons
                  loading={loading === 'action'}
                  onLoading={(v) => setLoading(v ? 'action' : null)}
                  showMsg={showMsg}
                  onSuccess={() => { load(); refresh(); window.dispatchEvent(new Event('usdt-balance-refresh')); }}
                />
            }
          </div>

          {/* Feature grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { icon: '⚡', label: t('vip_fast_build_pct') },
              { icon: '🔮', label: t('b_arcane_tower') },
              { icon: '🚫', label: t('vip_no_ads') },
              { icon: '/assets/icon_vip.png', label: t('vip_badge_feat') },
              { icon: '/assets/icon_gem.png', label: t('vip_gems_x') },
              { icon: '🚀', label: t('vip_prod_x15') },
              { icon: '⚔️', label: t('vip_usdt_raid') },
              { icon: '⚔️', label: t('vip_heroes') },
              { icon: '🧭', label: t('vip_fast_explorer') },
              { icon: '⚡', label: t('vip_fast_training') },
            ].map(f => (
              <div key={f.label} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: isVip ? 'rgba(244,208,63,0.08)' : 'rgba(0,0,0,0.3)',
                borderRadius: 8, padding: '7px 10px',
                border: `1px solid ${isVip ? 'rgba(244,208,63,0.2)' : 'rgba(255,255,255,0.04)'}`,
              }}>
                {f.icon.startsWith('/') ? <img src={f.icon} style={{ width: 16, height: 16 }} /> : <span style={{ fontSize: 16 }}>{f.icon}</span>}
                <span style={{ fontSize: 11, color: isVip ? '#f4d03f' : '#666', fontWeight: 600 }}>
                  {!isVip && '🔒 '}{f.label}
                </span>
              </div>
            ))}
          </div>
        </div>


      </SECTION>

      {/* ── Gems ── */}
      {/* ── Buy Gems with USDT ── */}
      <BuyGemsSection refresh={refresh} />

      {/* ── Gem Exchange ── */}
      <SECTION title={t('gem_exchange_section')}>
        {(() => {
          const RATE = 500; // resources per 10 gems
          const gemsNum = Math.max(0, parseInt(swapGems) || 0);
          const packs = Math.floor(gemsNum / 10);
          const resourceOut = packs * RATE;
          const RESOURCES = [
            { id: 'gold'  as const, icon: '/assets/icon_gold.png',  label: t('gold'),  color: '#f4d03f' },
            { id: 'wood'  as const, icon: '/assets/icon_wood.png',  label: t('wood'),  color: '#8B6914' },
            { id: 'stone' as const, icon: '/assets/icon_stone.png', label: t('stone'), color: '#909090' },
            { id: 'food'  as const, icon: '/assets/icon_food.png',  label: t('food'),  color: '#27ae60' },
          ];
          const sel = RESOURCES.find(r => r.id === swapResource)!;
          const canSwap = packs > 0 && (kingdom?.gems ?? 0) >= gemsNum;
          return (
            <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(244,208,63,0.15)', borderRadius: 16, padding: 16 }}>
              {/* Top: gems input */}
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src="/assets/icon_gem.png" style={{ width: 28, height: 28 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: '#a0845a', marginBottom: 2 }}>{t('exchange_you_spend')}</div>
                  <input
                    type="number" min="10" step="10"
                    value={swapGems}
                    onChange={e => setSwapGems(e.target.value)}
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f4d03f', fontSize: 20, fontWeight: 700, width: '100%' }}
                  />
                  <div style={{ fontSize: 9, color: '#666', marginTop: 2 }}>{t('exchange_tap_to_edit')}</div>
                </div>
                <div style={{ fontSize: 11, color: '#a0845a' }}>{t('gems')}</div>
              </div>

              {/* Arrow */}
              <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 18, color: '#a0845a' }}>↕</div>

              {/* Bottom: resource output */}
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={sel.icon} style={{ width: 28, height: 28 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: '#a0845a', marginBottom: 2 }}>{t('exchange_you_receive')}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: sel.color }}>{resourceOut.toLocaleString()}</div>
                </div>
                {/* Resource selector */}
                <select value={swapResource} onChange={e => setSwapResource(e.target.value as any)}
                  style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(244,208,63,0.3)', borderRadius: 8, color: sel.color, fontSize: 13, fontWeight: 700, padding: '6px 8px', cursor: 'pointer', outline: 'none' }}>
                  {RESOURCES.map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Rate hint */}
              <div style={{ textAlign: 'center', fontSize: 10, color: '#666', margin: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>10 <img src="/assets/icon_gem.png" style={{ width: 11, height: 11, verticalAlign: 'middle' }} /> = 500 {sel.label}</div>

              {/* Swap button */}
              <button className="btn btn-gold" style={{ width: '100%', padding: '11px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                disabled={!canSwap || loading === 'exchange'}
                onClick={() => {
                  setLoading('exchange');
                  api.post('/kingdom/exchange-gems', { resource: swapResource, amount: resourceOut })
                    .then(() => { refresh(); setSwapGems('10'); })
                    .catch(e => showMsg(e?.message ?? 'Error'))
                    .finally(() => setLoading(null));
                }}>
                {loading === 'exchange' ? '...' : t('exchange_now_btn')}
              </button>
            </div>
          );
        })()}
      </SECTION>

      <SECTION title={t('gems_section', { n: gems })}>
        {/* Speed up */}
        {upgrading.length > 0 && (
          <>
            <div style={{ fontSize: 12, color: '#a0845a', marginBottom: 6 }}>{t('speedup_label')}</div>
            {upgrading.map(b => {
              const secsLeft = Math.max(0, (new Date(b.upgradeEndsAt!).getTime() - Date.now()) / 1000);
              const gemCost = Math.max(1, Math.ceil(secsLeft / 60));
              const canAfford = gems >= gemCost;
              return (
                <div key={b.id} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(52,152,219,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{t('b_' + b.type)}</div>
                    <div style={{ fontSize: 11, color: '#3498db' }}>⏳ <Countdown endsAt={b.upgradeEndsAt} /></div>
                  </div>
                  <button className="btn btn-gold" style={{ fontSize: 12, padding: '8px 12px', opacity: canAfford ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: 4 }}
                    disabled={speeding === b.type || !canAfford} onClick={() => speedUp(b.type, b.id)}>
                    {speeding === b.type ? '...' : <><span>⚡ {gemCost}</span><img src="/assets/icon_gem.png" style={{ width: 14, height: 14 }} /></>}
                  </button>
                </div>
              );
            })}
            <div style={{ marginBottom: 10 }} />
          </>
        )}

        {[
          { id: 'shield',  icon: '🛡️', label: t('shield_label'),  desc: t('shield_desc'),   gems: 200, action: () => api.post('/kingdom/shield').then(r => { refresh(); showMsg(t('shield_active_until', { time: new Date(r.shieldUntil).toLocaleString() })); }) },
          { id: 'storage', icon: '📦', label: t('storage_label'), desc: t('storage_desc'),  gems: 100, action: () => api.post('/kingdom/expand-storage').then(() => { refresh(); showMsg(t('storage_expanded')); }) },
        ].map(item => {
          const isStorage = item.id === 'storage';
          const isShield  = item.id === 'shield';
          const boostUntil  = isStorage ? (kingdom as any)?.storageBoostUntil : null;
          const shieldUntil = isShield  ? (kingdom as any)?.shieldUntil : null;
          const boostActive  = boostUntil  && new Date() < new Date(boostUntil);
          const shieldActive = shieldUntil && new Date() < new Date(shieldUntil);
          return (
          <div key={item.id} style={{
            background: (isShield && shieldActive) ? 'rgba(52,152,219,0.1)' : (isStorage && boostActive) ? 'rgba(39,174,96,0.1)' : 'rgba(0,0,0,0.35)',
            border: `1px solid ${(isShield && shieldActive) ? 'rgba(52,152,219,0.4)' : (isStorage && boostActive) ? 'rgba(39,174,96,0.4)' : 'rgba(244,208,63,0.12)'}`,
            borderRadius: 12, padding: '12px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12
          }}>
            <span style={{ fontSize: 26 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: '#a0845a' }}>
                {isShield && shieldActive
                  ? <span style={{ color: '#3498db' }}>🛡️ <Countdown endsAt={shieldUntil} /></span>
                  : isStorage && boostActive
                  ? <span style={{ color: '#27ae60' }}>✅ <Countdown endsAt={boostUntil} /></span>
                  : item.desc}
              </div>
              {isShield && (
                <div style={{ fontSize: 10, color: '#666', marginTop: 4, lineHeight: 1.4 }}>{t('shield_note')}</div>
              )}
              {isStorage && (
                <div style={{ fontSize: 10, color: '#666', marginTop: 4, lineHeight: 1.4 }}>{t('storage_note')}</div>
              )}
            </div>
            <button className="btn btn-gold" style={{ fontSize: 12, padding: '9px 13px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}
              disabled={loading === 'action'} onClick={() => doAction(item.action)}>
              {item.gems} <img src="/assets/icon_gem.png" style={{ width: 14, height: 14 }} />
            </button>
          </div>
          );
        })}
      </SECTION>

      {/* ── Ads ── */}
      <SECTION title={t('ads_section', { n: ads ? String(ads.adsWatchedToday) : '...', max: String(adsMax) })}>
        {/* Active boosts banner */}
        {(ads?.boostActive || ads?.attackBoostActive) && (
          <div style={{ background: 'rgba(26,58,26,0.8)', border: '1px solid #27ae6066', borderRadius: 10, padding: '8px 14px', marginBottom: 10, fontSize: 12, color: '#27ae60' }}>
            {ads?.boostActive && <div>🚀 {t('double_prod_active', { time: new Date(ads.boostUntil).toLocaleTimeString() })}</div>}
            {ads?.attackBoostActive && <div>⚡ {t('double_attack_speed_active', { time: new Date(ads.attackBoostUntil).toLocaleTimeString() })}</div>}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { type: 'double_production',   icon: '🚀', label: t('double_prod'),        desc: t('double_prod_desc'),        boostUntil: ads?.boostUntil,       boostActive: ads?.boostActive },
            { type: 'double_attack_speed', icon: '⚡', label: t('double_attack_speed'), desc: t('double_attack_speed_desc'), boostUntil: ads?.attackBoostUntil, boostActive: ads?.attackBoostActive },
            { type: 'usdt_bonus',  icon: '/assets/icon_dollar.png', label: '+0.001 USDT',      desc: t('instantly') },
            { type: 'gems',        icon: '/assets/icon_gem.png',    label: `+10 ${t('gems')}`,  desc: t('instantly') },
            { type: 'gold_bonus',  icon: '/assets/icon_gold.png',   label: `+500 ${t('gold')}`, desc: t('instantly') },
            { type: 'wood_bonus',  icon: '/assets/icon_wood.png',   label: `+500 ${t('wood')}`, desc: t('instantly') },
            { type: 'stone_bonus', icon: '/assets/icon_stone.png',  label: `+500 ${t('stone')}`,desc: t('instantly') },
            { type: 'food_bonus',  icon: '/assets/icon_food.png',   label: `+500 ${t('food')}`, desc: t('instantly') },
          ].map(({ type, icon, label, desc, boostUntil, boostActive }: any) => {
            const isBoostActive = boostActive && boostUntil && new Date(boostUntil) > new Date();
            // Only double_production / double_attack_speed stay locked while boost is running.
            // All other buttons are free to click again immediately.
            const isDisabled = adsLeft === 0 || loading === type || isBoostActive;

            return (
            <div key={type} style={{
              background: isBoostActive ? 'rgba(39,174,96,0.1)' : 'rgba(0,0,0,0.35)',
              border: `1px solid ${isBoostActive ? 'rgba(39,174,96,0.4)' : 'rgba(39,174,96,0.15)'}`,
              borderRadius: 12, padding: '10px 12px',
              display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', textAlign: 'center',
            }}>
              {icon.startsWith('/') ? <img src={icon} style={{ width: 28, height: 28 }} /> : <span style={{ fontSize: 26 }}>{icon}</span>}
              <div>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{label}</div>
                <div style={{ fontSize: 10, color: '#a0845a' }}>
                  {isBoostActive ? <Countdown endsAt={boostUntil} onEnd={load} /> : desc}
                </div>
              </div>
              <button
                className="btn btn-green"
                style={{ width: '100%', fontSize: 11, padding: '7px 0', opacity: isDisabled ? 0.4 : 1 }}
                disabled={isDisabled}
                onClick={() => watchAd(type)}
              >
                {loading === type ? '...' : t('watch_ad')}
              </button>
            </div>
            );
          })}
        </div>
        {adsLeft === 0 && (
          <div style={{ textAlign: 'center', fontSize: 12, color: '#a0845a', marginTop: 10 }}>
            {t('ads_limit', { max: String(adsMax) })}
          </div>
        )}
      </SECTION>

      {/* ── USDT Balance ── */}
      <UsdtBalanceSection />
    </div>
  );
}

