import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useGameStore } from '../store/gameStore';

export default function ShopScreen() {
  const { refresh } = useGameStore();
  const [vip, setVip] = useState<any>(null);
  const [ads, setAds] = useState<any>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const [v, a] = await Promise.all([api.get('/vip'), api.get('/ads/status')]);
    setVip(v); setAds(a);
  }

  async function watchAd(type: 'double_production' | 'gems') {
    setMsg('');
    try {
      // In production: show Adsgram ad first, then claim reward
      // For now: claim directly
      const result = await api.post('/ads/reward', { type });
      if (type === 'double_production') {
        setMsg(`🚀 ייצור כפול פעיל עד ${new Date(result.boostUntil).toLocaleTimeString('he-IL')}`);
      } else {
        setMsg(`💎 קיבלת 10 Gems!`);
      }
      await Promise.all([load(), refresh()]);
    } catch (e: any) {
      setMsg(e.response?.data?.message || 'שגיאה');
    }
  }

  async function activateVip() {
    setMsg('');
    try {
      // In production: open TON Connect wallet, get tx hash
      const result = await api.post('/vip/activate', { tonTxHash: 'dev_tx_' + Date.now() });
      setMsg(`👑 VIP פעיל עד ${new Date(result.expiresAt).toLocaleDateString('he-IL')}`);
      await load();
    } catch (e: any) {
      setMsg(e.response?.data?.message || 'שגיאה');
    }
  }

  return (
    <div className="screen">
      <div className="screen-title">🛒 חנות</div>

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, marginBottom: 12,
          background: '#153c15', color: '#27ae60', fontSize: 13,
        }}>{msg}</div>
      )}

      {/* VIP */}
      <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 15 }}>👑 VIP</div>
      <div className="card" style={{ marginBottom: 16, borderColor: vip?.isVip ? '#f4d03f' : 'var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>VIP חודשי</div>
            <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>5 TON לחודש</div>
          </div>
          {vip?.isVip
            ? <span className="badge badge-gold">פעיל ✓</span>
            : <span className="badge" style={{ background: 'var(--bg-card2)', color: 'var(--text-dim)' }}>לא פעיל</span>
          }
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 12 }}>
          ✅ 30% פחות זמן בנייה<br/>
          ✅ סקינים בלעדיים<br/>
          ✅ תג VIP<br/>
          ❌ לא נותן יתרון בקרב
        </div>
        {!vip?.isVip && (
          <button className="btn btn-gold" style={{ width: '100%' }} onClick={activateVip}>
            💎 רכוש VIP — 5 TON
          </button>
        )}
        {vip?.isVip && (
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-dim)' }}>
            פג בתאריך: {new Date(vip.expiresAt).toLocaleDateString('he-IL')}
          </div>
        )}
      </div>

      {/* Ads */}
      <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 15 }}>📺 פרסומות — Adsgram</div>
      <div style={{ color: 'var(--text-dim)', fontSize: 12, marginBottom: 10 }}>
        {ads ? `${ads.adsWatchedToday} / 5 פרסומות היום` : ''}
      </div>

      {[
        { type: 'double_production' as const, title: '🚀 ייצור כפול', desc: 'כפל ייצור משאבים לשעה', icon: '⚡' },
        { type: 'gems' as const,             title: '💎 10 Gems',     desc: '10 Gems בחינם',         icon: '💎' },
      ].map(({ type, title, desc, icon }) => (
        <div key={type} className="card" style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700 }}>{title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{desc}</div>
          </div>
          <button
            className="btn btn-green"
            onClick={() => watchAd(type)}
            disabled={ads?.adsRemainingToday === 0}
            style={{ whiteSpace: 'nowrap', fontSize: 13 }}
          >
            📺 צפה
          </button>
        </div>
      ))}

      {ads?.boostActive && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#1a3a1a', border: '1px solid #27ae60', textAlign: 'center', fontSize: 13 }}>
          ⚡ Boost פעיל עד {new Date(ads.boostUntil).toLocaleTimeString('he-IL')}
        </div>
      )}
    </div>
  );
}
