"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AllianceScreen;
const react_1 = require("react");
const client_1 = require("../api/client");
const useT_1 = require("../i18n/useT");
const gameStore_1 = require("../store/gameStore");
const ROLE_ICON = { leader: '👑', officer: '⭐', member: '🧑' };
function AllianceScreen() {
    const t = (0, useT_1.useT)();
    const { kingdom, refresh } = (0, gameStore_1.useGameStore)();
    const [tab, setTab] = (0, react_1.useState)('mine');
    const [myAlliance, setMyAlliance] = (0, react_1.useState)(undefined);
    const [list, setList] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [msg, setMsg] = (0, react_1.useState)('');
    const [name, setName] = (0, react_1.useState)('');
    const [tag, setTag] = (0, react_1.useState)('');
    const [desc, setDesc] = (0, react_1.useState)('');
    const loadMine = async () => {
        setLoading(true);
        try {
            setMyAlliance(await client_1.api.get('/alliances/mine'));
        }
        catch {
            setMyAlliance(null);
        }
        finally {
            setLoading(false);
        }
    };
    const loadList = async () => {
        setLoading(true);
        try {
            setList(await client_1.api.get('/alliances'));
        }
        finally {
            setLoading(false);
        }
    };
    (0, react_1.useEffect)(() => { loadMine(); }, []);
    (0, react_1.useEffect)(() => { if (tab === 'browse')
        loadList(); }, [tab]);
    const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3500); };
    const doCreate = async () => {
        if (!name.trim() || !tag.trim())
            return;
        setLoading(true);
        try {
            await client_1.api.post('/alliances', { name: name.trim(), tag: tag.trim(), description: desc.trim() });
            await loadMine();
            await refresh();
            setTab('mine');
            showMsg(t('alliance_created'));
        }
        catch (e) {
            showMsg('❌ ' + (e?.response?.data?.message || t('error')));
        }
        finally {
            setLoading(false);
        }
    };
    const doJoin = async (allianceId) => {
        setLoading(true);
        try {
            await client_1.api.post('/alliances/join', { allianceId });
            await loadMine();
            setTab('mine');
            showMsg(t('alliance_joined'));
        }
        catch (e) {
            showMsg('❌ ' + (e?.response?.data?.message || t('error')));
        }
        finally {
            setLoading(false);
        }
    };
    const doLeave = async () => {
        if (!confirm(t('alliance_leave_confirm')))
            return;
        setLoading(true);
        try {
            await client_1.api.delete('/alliances/leave');
            setMyAlliance(null);
            setTab('browse');
            loadList();
        }
        catch (e) {
            showMsg('❌ ' + (e?.response?.data?.message || t('error')));
        }
        finally {
            setLoading(false);
        }
    };
    const doDisband = async () => {
        if (!confirm(t('alliance_disband_confirm')))
            return;
        setLoading(true);
        try {
            await client_1.api.delete('/alliances/disband');
            setMyAlliance(null);
            setTab('browse');
            loadList();
        }
        catch (e) {
            showMsg('❌ ' + (e?.response?.data?.message || t('error')));
        }
        finally {
            setLoading(false);
        }
    };
    const doKick = async (targetKingdomId, memberName) => {
        if (!confirm(`${t('alliance_kick_confirm')} ${memberName}?`))
            return;
        try {
            await client_1.api.post('/alliances/kick', { targetKingdomId });
            await loadMine();
        }
        catch (e) {
            showMsg('❌ ' + (e?.response?.data?.message || t('error')));
        }
    };
    const doPromote = async (targetKingdomId) => {
        try {
            await client_1.api.post(`/alliances/promote/${targetKingdomId}`, {});
            await loadMine();
        }
        catch (e) {
            showMsg('❌ ' + (e?.response?.data?.message || t('error')));
        }
    };
    const doTransfer = async (targetKingdomId, memberName) => {
        if (!confirm(`${t('alliance_transfer_confirm')} ${memberName}?`))
            return;
        try {
            await client_1.api.post('/alliances/transfer-leadership', { targetKingdomId });
            await loadMine();
        }
        catch (e) {
            showMsg('❌ ' + (e?.response?.data?.message || t('error')));
        }
    };
    const inAlliance = !!myAlliance;
    const gems = kingdom?.gems ?? 0;
    return (<div style={{ padding: '16px 14px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#f4d03f', marginBottom: 14 }}>{t('nav_alliance')}</div>

      {msg && (<div style={{ background: 'rgba(244,208,63,0.1)', border: '1px solid rgba(244,208,63,0.3)', borderRadius: 10, padding: '8px 12px', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
          {msg}
        </div>)}

      
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {['mine', 'browse', ...(!inAlliance ? ['create'] : [])].map(tb => (<button key={tb} onClick={() => setTab(tb)} style={{ flex: 1, padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: tab === tb ? 700 : 400,
                background: tab === tb ? 'rgba(244,208,63,0.2)' : 'rgba(0,0,0,0.3)',
                border: `1px solid ${tab === tb ? 'rgba(244,208,63,0.5)' : 'rgba(255,255,255,0.08)'}`,
                color: tab === tb ? '#f4d03f' : '#888', cursor: 'pointer' }}>
            {tb === 'mine' ? t('alliance_tab_mine') : tb === 'browse' ? t('alliance_tab_browse') : t('alliance_tab_create')}
          </button>))}
      </div>

      
      {tab === 'mine' && (myAlliance === undefined ? (<div style={{ textAlign: 'center', color: '#555', paddingTop: 40 }}>...</div>) : !myAlliance ? (<div style={{ textAlign: 'center', paddingTop: 50 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏰</div>
            <div style={{ color: '#888', fontSize: 14, marginBottom: 20 }}>{t('alliance_not_member')}</div>
            <button className="btn btn-gold" onClick={() => setTab('browse')} style={{ marginRight: 8 }}>{t('alliance_tab_browse')}</button>
            <button className="btn" onClick={() => setTab('create')}>{t('alliance_tab_create')}</button>
          </div>) : (<div>
            
            <div style={{ background: 'rgba(244,208,63,0.07)', border: '1px solid rgba(244,208,63,0.25)', borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ background: 'rgba(244,208,63,0.2)', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: '#f4d03f', marginRight: 8 }}>
                    [{myAlliance.alliance.tag}]
                  </span>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>{myAlliance.alliance.name}</span>
                </div>
                <div style={{ fontSize: 12, color: '#a0845a' }}>🏆 {Number(myAlliance.alliance.score).toLocaleString()}</div>
              </div>
              {myAlliance.alliance.description && (<div style={{ color: '#888', fontSize: 12, marginTop: 6 }}>{myAlliance.alliance.description}</div>)}
              <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12, flexWrap: 'wrap' }}>
                <span style={{ color: '#27ae60' }}>👥 {myAlliance.memberCount}/{myAlliance.maxMembers}</span>
                <span style={{ color: '#27ae60' }}>📈 +{myAlliance.allianceBonus}% {t('production_bonus')}</span>
                <span style={{ color: '#a0845a' }}>{ROLE_ICON[myAlliance.myRole]} {t(`alliance_role_${myAlliance.myRole}`)}</span>
              </div>
            </div>

            
            <div style={{ fontSize: 13, fontWeight: 700, color: '#a0845a', marginBottom: 8 }}>👥 {t('alliance_members')} ({myAlliance.memberCount})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {[...myAlliance.members].sort((a, b) => {
                const r = { leader: 0, officer: 1, member: 2 };
                return r[a.role] - r[b.role] || b.score - a.score;
            }).map(m => {
                const isMe = m.kingdomId === kingdom?.id;
                const canManage = myAlliance.myRole === 'leader' && !isMe && m.role !== 'leader';
                return (<div key={m.kingdomId} style={{
                        background: isMe ? 'rgba(39,174,96,0.08)' : 'rgba(0,0,0,0.3)',
                        border: `1px solid ${isMe ? 'rgba(39,174,96,0.3)' : 'rgba(255,255,255,0.07)'}`,
                        borderRadius: 10, padding: '8px 12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{ROLE_ICON[m.role]}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: isMe ? 700 : 400 }}>{m.name}{isMe ? ' ✓' : ''}</div>
                        <div style={{ fontSize: 10, color: '#666' }}>🏆 {m.score.toLocaleString()}</div>
                      </div>
                    </div>
                    {canManage && (<div style={{ display: 'flex', gap: 4 }}>
                        <button title={m.role === 'officer' ? t('alliance_demote') : t('alliance_promote')} onClick={() => doPromote(m.kingdomId)} style={{ fontSize: 10, padding: '3px 7px', borderRadius: 6, background: 'rgba(52,152,219,0.15)', border: '1px solid rgba(52,152,219,0.3)', color: '#3498db', cursor: 'pointer' }}>
                          {m.role === 'officer' ? '↓' : '⭐'}
                        </button>
                        <button title={t('alliance_transfer_leadership')} onClick={() => doTransfer(m.kingdomId, m.name)} style={{ fontSize: 10, padding: '3px 7px', borderRadius: 6, background: 'rgba(244,208,63,0.15)', border: '1px solid rgba(244,208,63,0.3)', color: '#f4d03f', cursor: 'pointer' }}>
                          👑
                        </button>
                        <button title={t('alliance_kick')} onClick={() => doKick(m.kingdomId, m.name)} style={{ fontSize: 10, padding: '3px 7px', borderRadius: 6, background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c', cursor: 'pointer' }}>
                          ✕
                        </button>
                      </div>)}
                  </div>);
            })}
            </div>

            
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" style={{ flex: 1, background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c' }} disabled={loading} onClick={doLeave}>
                🚪 {t('alliance_leave')}
              </button>
              {myAlliance.myRole === 'leader' && (<button className="btn" style={{ flex: 1, background: 'rgba(231,76,60,0.2)', border: '1px solid rgba(231,76,60,0.5)', color: '#e74c3c', fontWeight: 700 }} disabled={loading} onClick={doDisband}>
                  💥 {t('alliance_disband')}
                </button>)}
            </div>
          </div>))}

      
      {tab === 'browse' && (loading ? (<div style={{ textAlign: 'center', color: '#555', paddingTop: 40 }}>...</div>) : list.length === 0 ? (<div style={{ textAlign: 'center', color: '#555', paddingTop: 40 }}>{t('alliance_none')}</div>) : (<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {list.map(a => (<div key={a.id} style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(244,208,63,0.1)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div>
                    <span style={{ background: 'rgba(244,208,63,0.15)', borderRadius: 5, padding: '1px 7px', fontSize: 11, fontWeight: 700, color: '#f4d03f', marginRight: 8 }}>[{a.tag}]</span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{a.name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#888' }}>🏆 {Number(a.score).toLocaleString()}</span>
                </div>
                {a.description && <div style={{ color: '#777', fontSize: 11, marginBottom: 6 }}>{a.description}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#888' }}>👥 {a.memberCount}/{a.maxMembers}</span>
                  {!inAlliance && a.memberCount < a.maxMembers && (<button className="btn btn-gold" style={{ fontSize: 11, padding: '5px 14px' }} disabled={loading} onClick={() => doJoin(a.id)}>
                      {t('alliance_join')}
                    </button>)}
                  {a.memberCount >= a.maxMembers && (<span style={{ fontSize: 11, color: '#e74c3c' }}>{t('alliance_full')}</span>)}
                </div>
              </div>))}
          </div>))}

      
      {tab === 'create' && !inAlliance && (<div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(244,208,63,0.15)', borderRadius: 14, padding: '16px' }}>
          <div style={{ color: '#888', fontSize: 12, marginBottom: 14 }}>
            <img src="/assets/icon_gem.png" style={{ width: 14, height: 14, objectFit: 'contain', verticalAlign: 'middle', marginRight: 3 }}/>
            {t('alliance_create_cost')}: <strong style={{ color: '#f4d03f' }}>500</strong>
            &nbsp;·&nbsp; {t('your_balance')}: <strong style={{ color: gems >= 500 ? '#27ae60' : '#e74c3c' }}>{gems}</strong>
            <img src="/assets/icon_gem.png" style={{ width: 12, height: 12, objectFit: 'contain', verticalAlign: 'middle', marginLeft: 2 }}/>
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{t('alliance_name')} *</div>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={40} placeholder={t('alliance_name_placeholder')} style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', color: '#fff', fontSize: 13 }}/>
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{t('alliance_tag')} * (2-6)</div>
            <input value={tag} onChange={e => setTag(e.target.value.toUpperCase())} maxLength={6} placeholder="KW" style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', color: '#f4d03f', fontSize: 14, fontWeight: 700, letterSpacing: 2 }}/>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{t('alliance_desc')} ({t('optional')})</div>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} maxLength={200} rows={2} placeholder={t('alliance_desc_placeholder')} style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', color: '#aaa', fontSize: 12, resize: 'none' }}/>
          </div>

          <button className="btn btn-gold" style={{ width: '100%', padding: '12px', fontSize: 14, opacity: gems >= 500 && name.trim() && tag.trim() ? 1 : 0.5 }} disabled={loading || gems < 500 || !name.trim() || !tag.trim()} onClick={doCreate}>
            {loading ? '...' : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>🤝 {t('alliance_create_btn')} — 500 <img src="/assets/icon_gem.png" style={{ width: 14, height: 14, objectFit: 'contain' }}/></span>}
          </button>
        </div>)}
    </div>);
}
//# sourceMappingURL=AllianceScreen.js.map