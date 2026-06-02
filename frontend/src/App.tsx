import { useEffect, useState } from 'react';
import { useGameStore } from './store/gameStore';
import { api } from './api/client';
import HomeScreen from './screens/HomeScreen';
import BuildScreen from './screens/BuildScreen';
import ArmyScreen from './screens/ArmyScreen';
import AttackScreen from './screens/AttackScreen';
import AllianceScreen from './screens/AllianceScreen';
import ReferralScreen from './screens/ReferralScreen';
import ShopScreen from './screens/ShopScreen';
import NavBar from './components/NavBar';
import ResourceBar from './components/ResourceBar';

declare global { interface Window { Telegram?: any; } }

export default function App() {
  const { token, setToken, loadKingdom, activeScreen, kingdom } = useGameStore();
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('kw_token');
    if (savedToken) {
      setToken(savedToken);
      return;
    }

    const tg = window.Telegram?.WebApp;
    if (tg?.initData) {
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation?.();
      // Prevent double-open by disabling back button behavior
      tg.BackButton?.hide?.();
      const ref = new URLSearchParams(tg.initDataUnsafe?.start_param || '').get('ref') || undefined;
      api.post('/auth/login', { initData: tg.initData, referralCode: ref })
        .then(({ token }) => setToken(token))
        .catch((e: any) => {
          const msg = e?.response?.data?.message || e?.message || 'unknown';
          console.error('Auth failed:', msg, e?.response?.status);
          // Show error with details
          setAuthError('telegram:' + msg);
        });
    } else if (import.meta.env.DEV) {
      // Dev mode only
      api.post('/auth/login', { initData: 'dev' })
        .then(({ token }) => setToken(token))
        .catch(() => setAuthError('no_telegram'));
    } else {
      setAuthError('no_telegram');
    }
  }, []);

  useEffect(() => {
    if (token) loadKingdom();
  }, [token]);

  // Auto-refresh resources every 60 seconds
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => loadKingdom(), 60_000);
    return () => clearInterval(interval);
  }, [token]);

  if (authError === 'no_telegram') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: 24, textAlign: 'center', gap: 16 }}>
        <div style={{ fontSize: 64 }}>🏰</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Kingdom Wars</div>
        <div style={{ color: '#a0845a', fontSize: 15 }}>המשחק זמין רק דרך Telegram</div>
        <a
          href="https://t.me/Kingdomw_bot"
          style={{ padding: '12px 28px', background: 'linear-gradient(135deg,#f4d03f,#b8860b)', borderRadius: 10, color: '#1a0a00', fontWeight: 700, textDecoration: 'none', fontSize: 16 }}
        >
          ⚔️ פתח ב-Telegram
        </a>
      </div>
    );
  }

  if (authError.startsWith('telegram')) {
    const errMsg = authError.split(':')[1] || '';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: 24, textAlign: 'center', gap: 12 }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <div style={{ color: '#e74c3c', fontSize: 14 }}>שגיאת אימות</div>
        {errMsg && <div style={{ color: '#a0845a', fontSize: 12, maxWidth: 280, wordBreak: 'break-all' }}>{errMsg}</div>}
        <button style={{ padding: '10px 20px', background: '#2a1500', border: '1px solid #6b3a00', borderRadius: 8, color: '#f4d03f', cursor: 'pointer' }}
          onClick={() => { localStorage.removeItem('kw_token'); window.location.reload(); }}>
          🔄 נסה שוב
        </button>
      </div>
    );
  }

  if (!kingdom) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
        <div style={{ fontSize: 64 }}>🏰</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Kingdom Wars</div>
        <div style={{ color: '#a0845a', fontSize: 14 }}>טוען את הממלכה...</div>
        <div className="shimmer" style={{ width: 200, height: 8, borderRadius: 4, marginTop: 8 }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <ResourceBar />
      {activeScreen === 'home'     && <HomeScreen />}
      {activeScreen === 'build'    && <BuildScreen />}
      {activeScreen === 'army'     && <ArmyScreen />}
      {activeScreen === 'attack'   && <AttackScreen />}
      {activeScreen === 'alliance' && <AllianceScreen />}
      {activeScreen === 'referral' && <ReferralScreen />}
      {activeScreen === 'shop'     && <ShopScreen />}
      <NavBar />
    </div>
  );
}
