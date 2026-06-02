import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { fmt } from '../utils/format';

interface ReferralStats {
  referralCode: string;
  link: string;
  referredCount: number;
  milestones: { count: number; gems: number; label: string; skin?: string; hero?: string; reached: boolean }[];
}

export default function ReferralScreen() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await api.get('/referral');
    setStats(data);
  }

  function copyLink() {
    navigator.clipboard.writeText(stats!.link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareLink() {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(stats!.link)}&text=${encodeURIComponent('⚔️ הצטרף אליי ב-Kingdom Wars!')}`);
    } else {
      copyLink();
    }
  }

  async function claim(count: number) {
    setClaiming(count);
    setMsg('');
    try {
      const result = await api.post(`/referral/claim/${count}`);
      if (result.error) { setMsg(result.error); return; }
      setMsg(`✅ קיבלת ${result.gems} Gems!`);
      await load();
    } catch (e: any) {
      setMsg(e.response?.data?.message || 'שגיאה');
    } finally {
      setClaiming(null);
    }
  }

  if (!stats) return <div className="screen" style={{ textAlign: 'center', paddingTop: 60, color: 'var(--text-dim)' }}>טוען...</div>;

  return (
    <div className="screen">
      <div className="screen-title">🔗 הזמן חברים</div>

      {/* Stats */}
      <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>👥</div>
        <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.referredCount}</div>
        <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>חברים הצטרפו דרכך</div>
      </div>

      {/* Share buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className="btn btn-gold" style={{ flex: 2 }} onClick={shareLink}>
          📤 שלח הזמנה
        </button>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={copyLink}>
          {copied ? '✅ הועתק' : '📋 העתק'}
        </button>
      </div>

      {/* Link display */}
      <div style={{
        background: 'var(--bg-card2)', borderRadius: 8, padding: '10px 14px',
        fontSize: 12, color: 'var(--text-dim)', marginBottom: 20,
        wordBreak: 'break-all', border: '1px solid var(--border)',
      }}>
        {stats.link}
      </div>

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, marginBottom: 12,
          background: msg.startsWith('✅') ? '#153c15' : '#3c1515',
          color: msg.startsWith('✅') ? '#27ae60' : '#e74c3c', fontSize: 13,
        }}>{msg}</div>
      )}

      {/* Milestones */}
      <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 15 }}>🎁 פרסים</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {stats.milestones.map(m => (
          <div key={m.count} className="card" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderColor: m.reached ? '#27ae60' : 'var(--border)',
            opacity: stats.referredCount >= m.count ? 1 : 0.6,
          }}>
            <div>
              <div style={{ fontWeight: 700 }}>{m.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                {m.gems > 0 && `💎 ${fmt(m.gems)} Gems`}
                {m.skin && '🎨 סקין נדיר'}
                {m.hero && '👑 גיבור נדיר'}
              </div>
            </div>
            {m.reached ? (
              <button
                className="btn btn-green"
                onClick={() => claim(m.count)}
                disabled={claiming === m.count}
                style={{ fontSize: 12 }}
              >
                {claiming === m.count ? '...' : 'קבל'}
              </button>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                {stats.referredCount}/{m.count}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
