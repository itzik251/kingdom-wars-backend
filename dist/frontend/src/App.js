"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = App;
const react_1 = require("react");
const ui_react_1 = require("@tonconnect/ui-react");
const useT_1 = require("./i18n/useT");
const format_1 = require("./utils/format");
const translations_1 = require("./i18n/translations");
const gameStore_1 = require("./store/gameStore");
const client_1 = require("./api/client");
const HomeScreen_1 = require("./screens/HomeScreen");
const RepairScreen_1 = require("./screens/RepairScreen");
const ArmyScreen_1 = require("./screens/ArmyScreen");
const AttackScreen_1 = require("./screens/AttackScreen");
const AllianceScreen_1 = require("./screens/AllianceScreen");
const ReferralScreen_1 = require("./screens/ReferralScreen");
const ShopScreen_1 = require("./screens/ShopScreen");
const LeaderboardScreen_1 = require("./screens/LeaderboardScreen");
const QuestScreen_1 = require("./screens/QuestScreen");
const WorldMapScreen_1 = require("./screens/WorldMapScreen");
const TermsModal_1 = require("./components/TermsModal");
const OnboardingModal_1 = require("./components/OnboardingModal");
const TutorialOverlay_1 = require("./components/TutorialOverlay");
const NavBar_1 = require("./components/NavBar");
const ResourceBar_1 = require("./components/ResourceBar");
function ErrorFallback() {
    const t = (0, useT_1.useT)();
    return (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: 24, textAlign: 'center', gap: 16 }}>
      <div style={{ fontSize: 56 }}>😵</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#e74c3c' }}>{t('error_crashed')}</div>
      <div style={{ color: '#a0845a', fontSize: 14 }}>{t('error_unexpected')}</div>
      <button style={{ padding: '12px 28px', background: 'linear-gradient(135deg,#f4d03f,#b8860b)', borderRadius: 10, color: '#1a0a00', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 16 }} onClick={() => window.location.reload()}>
        {t('error_reload')}
      </button>
    </div>);
}
class ErrorBoundary extends react_1.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error) {
        console.error('App crashed:', error);
    }
    render() {
        if (this.state.hasError)
            return <ErrorFallback />;
        return this.props.children;
    }
}
const INTERSTITIAL_BLOCK_ID = 'int-34711';
const INTERSTITIAL_SCREENS = new Set(['shop', 'army', 'attack', 'alliance', 'leaderboard']);
const INTERSTITIAL_INTERVAL_MS = 5 * 60 * 1000;
function showInterstitial(isVip = false) {
    if (isVip)
        return;
    const AdController = window.Adsgram?.init({ blockId: INTERSTITIAL_BLOCK_ID });
    AdController?.show().catch(() => { });
}
function BattleErrorPopup({ message, onClose }) {
    const t = (0, useT_1.useT)();
    const { setScreen } = (0, gameStore_1.useGameStore)();
    return (<div style={{ position: 'fixed', inset: 0, zIndex: 8500, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
      <div style={{ fontSize: 64 }}>⚠️</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#e74c3c', textAlign: 'center' }}>{t('attack_failed')}</div>
      <div style={{ fontSize: 15, color: '#a0845a', textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>{message}</div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn btn-gold" style={{ padding: '12px 24px', fontSize: 15 }} onClick={() => { onClose(); setScreen('attack'); }}>
          {t('attack_again')}
        </button>
        <button className="btn btn-ghost" style={{ padding: '12px 24px', fontSize: 15 }} onClick={onClose}>
          {t('back_home')}
        </button>
      </div>
    </div>);
}
function BattleResultPopup({ report, onClose, onAttackAgain }) {
    const t = (0, useT_1.useT)();
    const { setScreen } = (0, gameStore_1.useGameStore)();
    return (<div style={{ position: 'fixed', inset: 0, zIndex: 8000, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, overflowY: 'auto' }}>
      <div style={{ fontSize: 64, animation: 'pulse 0.5s infinite', textAlign: 'center' }}>
        {report.attackerWins ? '🏆' : '💀'}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: report.attackerWins ? '#f4d03f' : '#e74c3c' }}>
        {report.attackerWins ? t('battle_win') : t('battle_loss')}
      </div>

      {report.attackerWins && (report.winStreak ?? 0) >= 2 && (<div style={{ background: 'rgba(244,208,63,0.15)', border: '1px solid #f4d03f', borderRadius: 20, padding: '5px 16px', color: '#f4d03f', fontWeight: 700, fontSize: 14 }}>
          {t('win_streak', { n: report.winStreak ?? 0 })}
          {(report.streakBonus ?? 0) > 0 && <span> · +{(0, format_1.fmt)(report.streakBonus)} <img src="/assets/icon_gold.png" style={{ width: 14, height: 14, verticalAlign: 'middle' }}/></span>}
        </div>)}

      <div style={{ display: 'flex', gap: 24, alignItems: 'center', fontSize: 15 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#f4d03f', fontWeight: 700, fontSize: 20 }}>⚔️ {report.attackerPower}</div>
          <div style={{ color: '#a0845a', fontSize: 12 }}>{t('your_power')}</div>
        </div>
        <div style={{ fontSize: 20, color: '#6b3a00' }}>VS</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#e74c3c', fontWeight: 700, fontSize: 20 }}>🛡️ {report.defenderPower}</div>
          <div style={{ color: '#a0845a', fontSize: 12 }}>{t('defender_power')}</div>
        </div>
      </div>

      {report.attackerWins && (<div style={{ background: 'rgba(244,208,63,0.1)', border: '1px solid rgba(244,208,63,0.3)', borderRadius: 12, padding: '14px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#a0845a', marginBottom: 8 }}>{t('loot_label')}</div>
          <div style={{ display: 'flex', gap: 16, fontSize: 16, fontWeight: 700, flexWrap: 'wrap', justifyContent: 'center' }}>
            <span><img src="/assets/icon_gold.png" style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: 3 }}/>{(0, format_1.fmt)(report.loot.gold)}</span>
            <span><img src="/assets/icon_wood.png" style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: 3 }}/>{(0, format_1.fmt)(report.loot.wood)}</span>
            <span><img src="/assets/icon_stone.png" style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: 3 }}/>{(0, format_1.fmt)(report.loot.stone)}</span>
            {(report.loot.gems ?? 0) > 0 && <span style={{ color: '#a29bfe' }}><img src="/assets/icon_gem.png" style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: 3 }}/>{(0, format_1.fmt)(report.loot.gems)}</span>}
            {(report.loot.usdt ?? 0) > 0 && <span style={{ color: '#27ae60' }}><img src="/assets/icon_dollar.png" style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: 3 }}/>{report.loot.usdt.toFixed(4)} USDT</span>}
          </div>
        </div>)}

      {report.attackerLosses && Object.values(report.attackerLosses).some((v) => v > 0) && (<div style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: 12, padding: '10px 18px', textAlign: 'center', width: '100%', maxWidth: 360 }}>
          <div style={{ fontSize: 12, color: '#a0845a', marginBottom: 5 }}>⚔️ {t('your_losses')}</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', fontSize: 12 }}>
            {Object.entries(report.attackerLosses).filter(([, v]) => v > 0).map(([type, v]) => {
                const wounded = report.attackerWounded?.[type] ?? 0;
                return (<span key={type} style={{ color: '#e74c3c' }}>
                  -{(0, format_1.fmt)(v - wounded)} {t(('u_' + type))}
                  {wounded > 0 && <span style={{ color: '#f39c12' }}> 🏥{(0, format_1.fmt)(wounded)}</span>}
                </span>);
            })}
          </div>
          {Object.values(report.attackerWounded ?? {}).some((v) => v > 0) && (<div style={{ fontSize: 10, color: '#f39c12', marginTop: 4 }}>🏥 {t('wounded_recovering')}</div>)}
        </div>)}

      {report.defenderLosses && Object.values(report.defenderLosses).some((v) => v > 0) && (<div style={{ background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.25)', borderRadius: 12, padding: '10px 18px', textAlign: 'center', width: '100%', maxWidth: 360 }}>
          <div style={{ fontSize: 12, color: '#a0845a', marginBottom: 5 }}>🛡️ {t('enemy_losses')}</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', fontSize: 12 }}>
            {Object.entries(report.defenderLosses).filter(([, v]) => v > 0).map(([type, v]) => {
                const wounded = report.defenderWounded?.[type] ?? 0;
                return (<span key={type} style={{ color: '#27ae60' }}>
                  -{(0, format_1.fmt)(v - wounded)} {t(('u_' + type))}
                  {wounded > 0 && <span style={{ color: '#f39c12' }}> 🏥{(0, format_1.fmt)(wounded)}</span>}
                </span>);
            })}
          </div>
        </div>)}

      {report.buildingDamaged && (<div style={{ background: 'rgba(230,126,34,0.12)', border: '1px solid rgba(230,126,34,0.4)', borderRadius: 12, padding: '12px 20px', textAlign: 'center', color: '#e67e22', fontWeight: 700, fontSize: 14 }}>
          💥 {t('building_damaged', { name: t(('b_' + report.buildingDamaged.type)), n: report.buildingDamaged.newLevel })}
        </div>)}

      <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn btn-gold" style={{ padding: '12px 24px', fontSize: 15 }} onClick={() => { onClose(); setScreen('attack'); onAttackAgain(); }}>
          {t('attack_again')}
        </button>
        {report.attackerWins && (<button className="btn btn-green" style={{ padding: '12px 20px', fontSize: 14 }} onClick={() => {
                const tg = window.Telegram?.WebApp;
                const loot = `💰${(0, format_1.fmt)(report.loot.gold)} 🪵${(0, format_1.fmt)(report.loot.wood)} 🪨${(0, format_1.fmt)(report.loot.stone)}`;
                const text = `⚔️ I won a battle in Kingdom Wars!\n🏆 Loot: ${loot}\n💪 Power: ${report.attackerPower} vs ${report.defenderPower}\n\n🎮 Join me!`;
                tg?.openTelegramLink?.(`https://t.me/share/url?url=https://t.me/Kingdomw_bot&text=${encodeURIComponent(text)}`);
            }}>
            {t('battle_share')}
          </button>)}
        <button className="btn btn-ghost" style={{ padding: '12px 24px', fontSize: 15 }} onClick={onClose}>
          {t('back_home')}
        </button>
      </div>
    </div>);
}
function DailyBonusPopup({ bonus, onClose }) {
    const t = (0, useT_1.useT)();
    const streakEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣'];
    const emoji = streakEmojis[Math.min(bonus.streak - 1, 6)];
    return (<div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'linear-gradient(135deg,#1a0a00,#2a1500)', border: '2px solid #f4d03f', borderRadius: 20, padding: '32px 24px', textAlign: 'center', maxWidth: 320, width: '100%' }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>🎁</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#f4d03f', marginBottom: 4 }}>{t('daily_bonus')}</div>
        <div style={{ fontSize: 14, color: '#a0845a', marginBottom: 20 }}>
          {emoji} {t('daily_streak', { n: bonus.streak })}
          {bonus.streak >= 7 && ' 🔥'}
        </div>
        <div style={{ background: 'rgba(244,208,63,0.15)', border: '1px solid rgba(244,208,63,0.4)', borderRadius: 14, padding: '16px 24px', marginBottom: 20 }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#f4d03f' }}>+{bonus.gems} 💎</div>
          <div style={{ fontSize: 12, color: '#a0845a', marginTop: 4 }}>{t('daily_added')}</div>
        </div>
        <button className="btn btn-gold" style={{ width: '100%', padding: '14px', fontSize: 16 }} onClick={onClose}>
          {t('daily_thanks')}
        </button>
      </div>
    </div>);
}
const DEV_USERS = [
    { key: 'dev_1', name: 'Alice 👑', color: '#e74c3c' },
    { key: 'dev_2', name: 'Bob ⚔️', color: '#3498db' },
    { key: 'dev_3', name: 'Charlie 🏹', color: '#2ecc71' },
    { key: 'dev_4', name: 'Diana 🛡️', color: '#9b59b6' },
    { key: 'dev_5', name: 'Eve 🔥', color: '#f39c12' },
    { key: 'dev_6', name: 'Frank 🗡️', color: '#1abc9c' },
    { key: 'dev_7', name: 'Grace 🌟', color: '#e67e22' },
    { key: 'dev_8', name: 'Henry 🏹', color: '#8e44ad' },
    { key: 'dev_9', name: 'Iris 🌸', color: '#c0392b' },
    { key: 'dev_10', name: 'Jack 🔱', color: '#2980b9' },
    { key: 'dev_11', name: 'Kate 💎', color: '#27ae60' },
];
function DevUserPicker({ onPick }) {
    const [seeding, setSeeding] = (0, react_1.useState)(false);
    const [seedMsg, setSeedMsg] = (0, react_1.useState)('');
    const seed = async () => {
        setSeeding(true);
        setSeedMsg('');
        try {
            const res = await fetch('/api/dev/seed', { method: 'POST' });
            const data = await res.json();
            setSeedMsg(data.results?.join(', ') || 'done');
        }
        catch {
            setSeedMsg('error seeding');
        }
        finally {
            setSeeding(false);
        }
    };
    return (<div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg,#0d0500,#1a0a00)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, zIndex: 9999 }}>
      <div style={{ fontSize: 48 }}>🏰</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#f4d03f' }}>Kingdom Wars</div>
      <div style={{ fontSize: 13, color: '#a0845a', marginBottom: 8 }}>בחר משתמש פיתוח</div>

      <button onClick={seed} disabled={seeding} style={{ padding: '8px 20px', background: '#2a1500', border: '1px solid #f4d03f', borderRadius: 8, color: '#f4d03f', cursor: 'pointer', fontSize: 13, marginBottom: 4 }}>
        {seeding ? '⏳ מייצר...' : '🌱 צור משתמשי דמה'}
      </button>
      {seedMsg && <div style={{ fontSize: 11, color: '#7bed9f', textAlign: 'center', maxWidth: 300 }}>{seedMsg}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 300 }}>
        {DEV_USERS.map((u, i) => (<div key={u.key} style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { localStorage.setItem('kw_dev_user', u.key); onPick(u.key); }} style={{ flex: 1, padding: '12px 16px', background: `${u.color}22`, border: `2px solid ${u.color}`, borderRadius: 12, color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 700, textAlign: 'left' }}>
              {u.name}
            </button>
            <button title="תן VIP + כל הגיבורים + הפניות" onClick={async () => {
                await fetch(`/api/dev/boost/${i + 1}`, { method: 'POST' });
                setSeedMsg(`${u.name} ← boosted! ✅`);
            }} style={{ padding: '8px 12px', background: 'rgba(244,208,63,0.15)', border: '1px solid #f4d03f55', borderRadius: 10, color: '#f4d03f', cursor: 'pointer', fontSize: 13 }}>
              ⚡
            </button>
          </div>))}
      </div>

      <div style={{ fontSize: 11, color: '#555', marginTop: 8 }}>
        <a href="/api/admin" target="_blank" style={{ color: '#f4d03f', textDecoration: 'none' }}>🔧 Admin Dashboard</a>
      </div>
    </div>);
}
function AppInner() {
    const { token, setToken, loadKingdom, activeScreen, kingdom, pendingBattleReport, clearPendingBattleReport, pendingError, clearPendingError } = (0, gameStore_1.useGameStore)();
    const [authError, setAuthError] = (0, react_1.useState)('');
    const [dailyBonus, setDailyBonus] = (0, react_1.useState)(null);
    const [needsTerms, setNeedsTerms] = (0, react_1.useState)(false);
    const [showOnboarding, setShowOnboarding] = (0, react_1.useState)(false);
    const [showTutorial, setShowTutorial] = (0, react_1.useState)(false);
    const [tgFirstName, setTgFirstName] = (0, react_1.useState)('');
    const [showDevPicker, setShowDevPicker] = (0, react_1.useState)(false);
    const lastInterstitialRef = (0, react_1.useRef)(0);
    const prevScreenRef = (0, react_1.useRef)('');
    const t = (0, useT_1.useT)();
    const { lang } = (0, useT_1.useLangStore)();
    (0, react_1.useEffect)(() => {
        const isRtl = translations_1.LANGUAGES.find(l => l.code === lang)?.rtl ?? true;
        document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', lang);
    }, [lang]);
    (0, react_1.useEffect)(() => {
        const savedToken = localStorage.getItem('kw_token');
        const tg = window.Telegram?.WebApp;
        if (tg?.initData) {
            tg.ready();
            tg.expand();
            tg.BackButton?.hide?.();
            const startParam = tg.initDataUnsafe?.start_param || '';
            const params = new URLSearchParams(window.location.search);
            const urlStartapp = params.get('startapp') || params.get('ref') || '';
            const rawRef = startParam || urlStartapp;
            const REF_KEY = 'kw_pending_ref';
            const REF_EXP = 'kw_pending_ref_exp';
            const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
            if (rawRef && rawRef.startsWith('ref_')) {
                localStorage.setItem(REF_KEY, rawRef);
                localStorage.setItem(REF_EXP, String(Date.now() + THIRTY_DAYS_MS));
            }
            let effectiveRawRef = rawRef;
            if (!rawRef || !rawRef.startsWith('ref_')) {
                const storedRef = localStorage.getItem(REF_KEY);
                const storedExp = parseInt(localStorage.getItem(REF_EXP) || '0', 10);
                if (storedRef && storedRef.startsWith('ref_') && Date.now() < storedExp) {
                    effectiveRawRef = storedRef;
                }
                else if (storedRef) {
                    localStorage.removeItem(REF_KEY);
                    localStorage.removeItem(REF_EXP);
                }
            }
            const ref = effectiveRawRef.startsWith('ref_') ? effectiveRawRef.slice(4) : (effectiveRawRef || undefined);
            if (rawRef === 'tab_leaderboard') {
                const { setActiveScreen } = gameStore_1.useGameStore.getState();
                setTimeout(() => setActiveScreen('leaderboard'), 500);
            }
            if (savedToken)
                setToken(savedToken);
            client_1.api.post('/auth/login', { initData: tg.initData, referralCode: ref })
                .then(({ token, dailyBonus, termsAccepted, isNewUser }) => {
                setToken(token);
                localStorage.removeItem(REF_KEY);
                localStorage.removeItem(REF_EXP);
                if (dailyBonus)
                    setDailyBonus(dailyBonus);
                if (!termsAccepted) {
                    setNeedsTerms(true);
                }
                else if (isNewUser) {
                    const firstName = tg.initDataUnsafe?.user?.first_name || '';
                    setTgFirstName(firstName);
                    setShowOnboarding(true);
                }
            })
                .catch((e) => {
                const msg = e?.response?.data?.message || e?.message || 'unknown';
                console.error('Auth failed:', msg, e?.response?.status);
                localStorage.removeItem('kw_token');
                setAuthError('telegram:' + msg);
            });
        }
        else if (import.meta.env.DEV) {
            const devUser = localStorage.getItem('kw_dev_user');
            if (devUser) {
                client_1.api.post('/auth/login', { initData: devUser })
                    .then(({ token }) => setToken(token))
                    .catch(() => { localStorage.removeItem('kw_dev_user'); setShowDevPicker(true); });
            }
            else {
                setShowDevPicker(true);
            }
        }
        else {
            setAuthError('no_telegram');
        }
    }, []);
    (0, react_1.useEffect)(() => {
        if (token) {
            loadKingdom();
            setTimeout(() => {
                const { kingdom: k } = gameStore_1.useGameStore.getState();
                showInterstitial(!!k?.isVip);
            }, 3000);
            lastInterstitialRef.current = Date.now();
        }
    }, [token]);
    (0, react_1.useEffect)(() => {
        if (!token || !kingdom)
            return;
        if (prevScreenRef.current === activeScreen)
            return;
        prevScreenRef.current = activeScreen;
        if (!INTERSTITIAL_SCREENS.has(activeScreen))
            return;
        const now = Date.now();
        if (now - lastInterstitialRef.current < INTERSTITIAL_INTERVAL_MS)
            return;
        lastInterstitialRef.current = now;
        showInterstitial(!!kingdom?.isVip);
    }, [activeScreen, token, kingdom]);
    (0, react_1.useEffect)(() => {
        if (!token)
            return;
        const interval = setInterval(() => loadKingdom(), 10_000);
        return () => clearInterval(interval);
    }, [token]);
    if (showDevPicker && import.meta.env.DEV) {
        return (<DevUserPicker onPick={(key) => {
                setShowDevPicker(false);
                client_1.api.post('/auth/login', { initData: key })
                    .then(({ token }) => setToken(token))
                    .catch(() => setAuthError('no_telegram'));
            }}/>);
    }
    if (authError === 'no_telegram') {
        return (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: 24, textAlign: 'center', gap: 16 }}>
        <div style={{ fontSize: 64 }}>🏰</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Kingdom Wars</div>
        <div style={{ color: '#a0845a', fontSize: 15 }}>{t('telegram_only')}</div>
        <a href="https://t.me/Kingdomw_bot" style={{ padding: '12px 28px', background: 'linear-gradient(135deg,#f4d03f,#b8860b)', borderRadius: 10, color: '#1a0a00', fontWeight: 700, textDecoration: 'none', fontSize: 16 }}>
          ⚔️ {t('open_game')}
        </a>
      </div>);
    }
    if (authError.startsWith('telegram')) {
        const errMsg = authError.split(':')[1] || '';
        return (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: 24, textAlign: 'center', gap: 12 }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <div style={{ color: '#e74c3c', fontSize: 14 }}>{t('auth_error')}</div>
        {errMsg && <div style={{ color: '#a0845a', fontSize: 12, maxWidth: 280, wordBreak: 'break-all' }}>{errMsg}</div>}
        <button style={{ padding: '10px 20px', background: '#2a1500', border: '1px solid #6b3a00', borderRadius: 8, color: '#f4d03f', cursor: 'pointer' }} onClick={() => { localStorage.removeItem('kw_token'); window.location.reload(); }}>
          {t('auth_retry')}
        </button>
      </div>);
    }
    if (!kingdom) {
        return (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
        <img src="/logo.png" alt="Kingdom Wars" style={{ width: 180, height: 180, objectFit: 'contain' }}/>
        <div style={{ color: '#a0845a', fontSize: 14 }}>{t('loading_kingdom')}</div>
        <div className="shimmer" style={{ width: 200, height: 8, borderRadius: 4, marginTop: 8 }}/>
      </div>);
    }
    return (<div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {needsTerms && <TermsModal_1.default onAccepted={() => { setNeedsTerms(false); setShowOnboarding(true); }}/>}
      {!needsTerms && showOnboarding && <OnboardingModal_1.default defaultName={tgFirstName} onDone={() => { setShowOnboarding(false); setShowTutorial(true); loadKingdom(); }}/>}
      {!needsTerms && !showOnboarding && showTutorial && <TutorialOverlay_1.default onDone={() => setShowTutorial(false)}/>}
      {dailyBonus && !needsTerms && <DailyBonusPopup bonus={dailyBonus} onClose={() => { setDailyBonus(null); }}/>}
      {pendingError && <BattleErrorPopup message={pendingError} onClose={clearPendingError}/>}
      {pendingBattleReport && <BattleResultPopup report={pendingBattleReport} onClose={clearPendingBattleReport} onAttackAgain={clearPendingBattleReport}/>}
      <ResourceBar_1.default />
      
      <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: activeScreen === 'home' || activeScreen === 'worldmap' ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column' }}>
        {activeScreen === 'home' && <HomeScreen_1.default />}
        {activeScreen === 'repair' && <RepairScreen_1.default />}
        {activeScreen === 'army' && <ArmyScreen_1.default />}
        {activeScreen === 'attack' && <AttackScreen_1.default />}
        {activeScreen === 'alliance' && <AllianceScreen_1.default />}
        {activeScreen === 'referral' && <ReferralScreen_1.default />}
        {activeScreen === 'shop' && <ShopScreen_1.default />}
        {activeScreen === 'leaderboard' && <LeaderboardScreen_1.default />}
        {activeScreen === 'quests' && <QuestScreen_1.default />}
        {activeScreen === 'worldmap' && <WorldMapScreen_1.default />}
      </div>
      <NavBar_1.default />
      {import.meta.env.DEV && (<button onClick={() => {
                localStorage.removeItem('kw_dev_user');
                localStorage.removeItem('kw_token');
                gameStore_1.useGameStore.getState().setToken('');
                setShowDevPicker(true);
            }} style={{ position: 'fixed', bottom: 70, left: 8, zIndex: 9998, fontSize: 10, padding: '4px 8px', background: 'rgba(0,0,0,0.7)', border: '1px solid #f4d03f44', borderRadius: 6, color: '#f4d03f88', cursor: 'pointer' }}>
          👤 switch
        </button>)}
    </div>);
}
const TON_MANIFEST_URL = `${window.location.origin}/tonconnect-manifest.json`;
function App() {
    return (<ui_react_1.TonConnectUIProvider manifestUrl={TON_MANIFEST_URL}>
      <ErrorBoundary>
        <AppInner />
      </ErrorBoundary>
    </ui_react_1.TonConnectUIProvider>);
}
//# sourceMappingURL=App.js.map