import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { fmt } from '../utils/format';

interface Alliance {
  id: string; name: string; tag: string; score: number; description?: string;
}

interface MyAlliance {
  alliance: Alliance;
  members: any[];
  myRole: string;
}

export default function AllianceScreen() {
  const [myAlliance, setMyAlliance] = useState<MyAlliance | null>(null);
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [view, setView] = useState<'mine' | 'list' | 'create'>('mine');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', tag: '', description: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [mine, list] = await Promise.all([
        api.get('/alliances/mine'),
        api.get('/alliances'),
      ]);
      setMyAlliance(mine);
      setAlliances(list);
      setView(mine ? 'mine' : 'list');
    } finally {
      setLoading(false);
    }
  }

  async function create() {
    setMsg('');
    try {
      await api.post('/alliances', form);
      await load();
    } catch (e: any) {
      setMsg(e.response?.data?.message || 'שגיאה');
    }
  }

  async function join(id: string) {
    try {
      await api.post('/alliances/join', { allianceId: id });
      await load();
    } catch (e: any) {
      alert(e.response?.data?.message || 'שגיאה');
    }
  }

  async function leave() {
    if (!confirm('לעזוב את הברית?')) return;
    try {
      await api.delete('/alliances/leave');
      await load();
    } catch (e: any) {
      alert(e.response?.data?.message || 'שגיאה');
    }
  }

  if (loading) {
    return (
      <div className="screen" style={{ textAlign: 'center', paddingTop: 60 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🤝</div>
        <div style={{ color: 'var(--text-dim)' }}>טוען...</div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen-title">🤝 בריתות</div>

      {myAlliance ? (
        <>
          {/* My alliance */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>
                  [{myAlliance.alliance.tag}] {myAlliance.alliance.name}
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 2 }}>
                  ניקוד: {fmt(myAlliance.alliance.score)} · {myAlliance.members.length} חברים
                </div>
              </div>
              <span className="badge badge-purple">{myAlliance.myRole}</span>
            </div>
            {myAlliance.alliance.description && (
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-dim)' }}>
                {myAlliance.alliance.description}
              </div>
            )}
            <button className="btn btn-ghost" style={{ width: '100%', marginTop: 12, color: '#e74c3c', borderColor: '#e74c3c' }} onClick={leave}>
              🚪 עזוב ברית
            </button>
          </div>

          {/* Members */}
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 15 }}>👥 חברים</div>
          {myAlliance.members.map((m: any) => (
            <div key={m.kingdomId} className="card" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 600 }}>{m.kingdom?.name || '?'}</div>
              <span className="badge" style={{ background: 'var(--bg-card2)', color: 'var(--text-dim)' }}>{m.role}</span>
            </div>
          ))}
        </>
      ) : (
        <>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button className={`btn ${view === 'list' ? 'btn-gold' : 'btn-ghost'}`} onClick={() => setView('list')} style={{ flex: 1 }}>
              חפש ברית
            </button>
            <button className={`btn ${view === 'create' ? 'btn-gold' : 'btn-ghost'}`} onClick={() => setView('create')} style={{ flex: 1 }}>
              צור ברית
            </button>
          </div>

          {view === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {alliances.map(a => (
                <div key={a.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>[{a.tag}] {a.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>ניקוד {fmt(a.score)}</div>
                  </div>
                  <button className="btn btn-green" onClick={() => join(a.id)}>הצטרף</button>
                </div>
              ))}
            </div>
          )}

          {view === 'create' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {msg && <div style={{ color: '#e74c3c', fontSize: 13 }}>{msg}</div>}
              {[
                { key: 'name', placeholder: 'שם הברית', max: 64 },
                { key: 'tag', placeholder: 'תג (עד 6 תווים)', max: 6 },
                { key: 'description', placeholder: 'תיאור (אופציונלי)', max: 256 },
              ].map(({ key, placeholder, max }) => (
                <input
                  key={key}
                  maxLength={max}
                  placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                  style={{
                    padding: '10px 14px', borderRadius: 8,
                    background: 'var(--bg-card2)', border: '1px solid var(--border)',
                    color: 'var(--text)', fontSize: 14,
                  }}
                />
              ))}
              <button className="btn btn-gold" onClick={create} disabled={!form.name || !form.tag}>
                🏰 צור ברית
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
