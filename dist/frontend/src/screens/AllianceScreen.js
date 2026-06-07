"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AllianceScreen;
const react_1 = require("react");
const client_1 = require("../api/client");
const format_1 = require("../utils/format");
const useT_1 = require("../i18n/useT");
function AllianceScreen() {
    const [myAlliance, setMyAlliance] = (0, react_1.useState)(null);
    const [alliances, setAlliances] = (0, react_1.useState)([]);
    const [view, setView] = (0, react_1.useState)('mine');
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [form, setForm] = (0, react_1.useState)({ name: '', tag: '', description: '' });
    const [msg, setMsg] = (0, react_1.useState)('');
    const t = (0, useT_1.useT)();
    (0, react_1.useEffect)(() => { load(); }, []);
    async function load() {
        setLoading(true);
        try {
            const [mine, list] = await Promise.all([
                client_1.api.get('/alliances/mine'),
                client_1.api.get('/alliances'),
            ]);
            setMyAlliance(mine);
            setAlliances(list);
            setView(mine ? 'mine' : 'list');
        }
        finally {
            setLoading(false);
        }
    }
    async function create() {
        setMsg('');
        try {
            await client_1.api.post('/alliances', form);
            await load();
        }
        catch (e) {
            setMsg(e.response?.data?.message || t('error'));
        }
    }
    async function join(id) {
        try {
            await client_1.api.post('/alliances/join', { allianceId: id });
            await load();
        }
        catch (e) {
            alert(e.response?.data?.message || t('error'));
        }
    }
    async function leave() {
        if (!confirm(t('leave_alliance')))
            return;
        try {
            await client_1.api.delete('/alliances/leave');
            await load();
        }
        catch (e) {
            alert(e.response?.data?.message || t('error'));
        }
    }
    const [donateAmt, setDonateAmt] = (0, react_1.useState)({ gold: 0, wood: 0, stone: 0 });
    const [donateMsg, setDonateMsg] = (0, react_1.useState)('');
    async function donate() {
        setDonateMsg('');
        try {
            const r = await client_1.api.post('/alliances/donate', donateAmt);
            setDonateMsg(t('donate_result', { n: r.gemsBonus }));
            setDonateAmt({ gold: 0, wood: 0, stone: 0 });
            await load();
        }
        catch (e) {
            setDonateMsg('❌ ' + (e.response?.data?.message || t('error')));
        }
    }
    if (loading) {
        return (<div className="screen" style={{ textAlign: 'center', paddingTop: 60 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🤝</div>
        <div style={{ color: 'var(--text-dim)' }}>{t('loading')}</div>
      </div>);
    }
    return (<div className="screen">
      <div className="screen-title">{t('alliances_title')}</div>

      {myAlliance ? (<>
          
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>
                  [{myAlliance.alliance.tag}] {myAlliance.alliance.name}
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 2 }}>
                  {t('alliance_score_members', { score: (0, format_1.fmt)(myAlliance.alliance.score), n: myAlliance.members.length })}
                </div>
              </div>
              <span className="badge badge-purple">{myAlliance.myRole}</span>
            </div>
            {myAlliance.alliance.description && (<div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-dim)' }}>
                {myAlliance.alliance.description}
              </div>)}
            <button className="btn btn-ghost" style={{ width: '100%', marginTop: 12, color: '#e74c3c', borderColor: '#e74c3c' }} onClick={leave}>
              🚪 {t('leave_confirm')}
            </button>
          </div>

          
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{t('donate_label')}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 10 }}>
              {t('donate_desc')}
            </div>
            {['gold', 'wood', 'stone'].map(r => (<div key={r} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ width: 30, fontSize: 16 }}>{r === 'gold' ? '💰' : r === 'wood' ? '🪵' : '🪨'}</span>
                <input type="number" min={0} max={5000} value={donateAmt[r] || ''} onChange={e => setDonateAmt(prev => ({ ...prev, [r]: Number(e.target.value) || 0 }))} placeholder="0" style={{ flex: 1, background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 14 }}/>
              </div>))}
            {donateMsg && <div style={{ fontSize: 12, color: donateMsg.startsWith('✅') ? '#27ae60' : '#e74c3c', marginBottom: 8 }}>{donateMsg}</div>}
            <button className="btn btn-green" style={{ width: '100%' }} onClick={donate}>
              {t('donate_btn')}
            </button>
          </div>

          
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 15 }}>{t('members_label')}</div>
          {myAlliance.members.map((m) => (<div key={m.kingdomId} className="card" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 600 }}>{m.kingdom?.name || '?'}</div>
              <span className="badge" style={{ background: 'var(--bg-card2)', color: 'var(--text-dim)' }}>{m.role}</span>
            </div>))}
        </>) : (<>
          
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button className={`btn ${view === 'list' ? 'btn-gold' : 'btn-ghost'}`} onClick={() => setView('list')} style={{ flex: 1 }}>
              {t('alliance_search_btn')}
            </button>
            <button className={`btn ${view === 'create' ? 'btn-gold' : 'btn-ghost'}`} onClick={() => setView('create')} style={{ flex: 1 }}>
              {t('alliance_create_btn')}
            </button>
          </div>

          {view === 'list' && (<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {alliances.map(a => (<div key={a.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>[{a.tag}] {a.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{t('alliance_score_label', { n: (0, format_1.fmt)(a.score) })}</div>
                  </div>
                  <button className="btn btn-green" onClick={() => join(a.id)}>{t('join')}</button>
                </div>))}
            </div>)}

          {view === 'create' && (<div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {msg && <div style={{ color: '#e74c3c', fontSize: 13 }}>{msg}</div>}
              {[
                    { key: 'name', placeholder: t('alliance_name_ph'), max: 64 },
                    { key: 'tag', placeholder: t('alliance_tag_ph'), max: 6 },
                    { key: 'description', placeholder: t('alliance_desc_ph'), max: 256 },
                ].map(({ key, placeholder, max }) => (<input key={key} maxLength={max} placeholder={placeholder} value={form[key]} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))} style={{
                        padding: '10px 14px', borderRadius: 8,
                        background: 'var(--bg-card2)', border: '1px solid var(--border)',
                        color: 'var(--text)', fontSize: 14,
                    }}/>))}
              <button className="btn btn-gold" onClick={create} disabled={!form.name || !form.tag}>
                {t('create_alliance_btn')}
              </button>
            </div>)}
        </>)}
    </div>);
}
//# sourceMappingURL=AllianceScreen.js.map