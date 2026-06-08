"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = App;
const react_1 = require("react");
const ui_react_1 = require("@tonconnect/ui-react");
const useT_1 = require("./i18n/useT");
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
const INTERSTITIAL_BLOCK_ID = 'int-34204';
const INTERSTITIAL_SCREENS = new Set(['shop', 'army', 'attack', 'alliance', 'leaderboard']);
const INTERSTITIAL_INTERVAL_MS = 5 * 60 * 1000;
function showInterstitial(isVip = false) {
    if (isVip)
        return;
    const AdController = window.Adsgram?.init({ blockId: INTERSTITIAL_BLOCK_ID });
    AdController?.show().catch(() => { });
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
function AppInner() {
    const { token, setToken, loadKingdom, activeScreen, kingdom } = (0, gameStore_1.useGameStore)();
    const [authError, setAuthError] = (0, react_1.useState)('');
    const [dailyBonus, setDailyBonus] = (0, react_1.useState)(null);
    const [needsTerms, setNeedsTerms] = (0, react_1.useState)(false);
    const [showOnboarding, setShowOnboarding] = (0, react_1.useState)(false);
    const [showTutorial, setShowTutorial] = (0, react_1.useState)(false);
    const [tgFirstName, setTgFirstName] = (0, react_1.useState)('');
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
        if (savedToken) {
            setToken(savedToken);
            return;
        }
        const tg = window.Telegram?.WebApp;
        if (tg?.initData) {
            tg.ready();
            tg.expand();
            tg.BackButton?.hide?.();
            const startParam = tg.initDataUnsafe?.start_param || '';
            const params = new URLSearchParams(window.location.search);
            const urlStartapp = params.get('startapp') || params.get('ref') || '';
            const rawRef = startParam || urlStartapp;
            const ref = rawRef.startsWith('ref_') ? rawRef.slice(4) : (rawRef || undefined);
            if (rawRef === 'tab_leaderboard') {
                const { setActiveScreen } = gameStore_1.useGameStore.getState();
                setTimeout(() => setActiveScreen('leaderboard'), 500);
            }
            client_1.api.post('/auth/login', { initData: tg.initData, referralCode: ref })
                .then(({ token, dailyBonus, termsAccepted, isNewUser }) => {
                setToken(token);
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
            client_1.api.post('/auth/login', { initData: 'dev' })
                .then(({ token }) => setToken(token))
                .catch(() => setAuthError('no_telegram'));
        }
        else {
            setAuthError('no_telegram');
        }
    }, []);
    (0, react_1.useEffect)(() => {
        if (token) {
            loadKingdom();
            setTimeout(() => showInterstitial(!!kingdom?.isVip), 2000);
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