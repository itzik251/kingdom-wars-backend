import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import { useT } from '../i18n/useT';
import { useGameStore } from '../store/gameStore';
import { ResIcon } from '../components/ResIcon';

type Role = 'leader' | 'officer' | 'member';

interface Member {
  kingdomId: string;
  name: string;
  score: number;
  role: Role;
  joinedAt: string;
}

interface MyAlliance {
  alliance: { id: string; name: string; tag: string; description: string; score: number };
  members: Member[];
  myRole: Role;
  memberCount: number;
  allianceBonus: number;
  maxMembers: number;
}

interface AllianceItem {
  id: string;
  name: string;
  tag: string;
  description: string;
  score: number;
  memberCount: number;
  maxMembers: number;
}

const ROLE_ICON: Record<Role, string> = { leader: '👑', officer: '⭐', member: '🧑' };

type ResType = 'gold' | 'wood' | 'stone' | 'food';
const RES_OPTIONS: ResType[] = ['gold', 'wood', 'stone', 'food'];

interface TradeOffer {
  id: string;
  offererKingdomId: string;
  offererName: string;
  giveType: ResType;
  giveAmount: number;
  wantType: ResType;
  wantAmount: number;
  isMine: boolean;
  createdAt: string;
}

function TradePanel({ myKingdomId, t, onMsg }: { myKingdomId: string; t: (k: string, v?: any) => string; onMsg: (m: string) => void }) {
  const [offers, setOffers] = useState<TradeOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [giveType, setGiveType] = useState<ResType>('gold');
  const [giveAmt, setGiveAmt] = useState('');
  const [wantType, setWantType] = useState<ResType>('food');
  const [wantAmt, setWantAmt] = useState('');
  const { refresh } = useGameStore();

  const loadOffers = useCallback(async () => {
    try { setOffers(await api.get('/trade/offers')); } catch {}
  }, []);

  useEffect(() => { loadOffers(); }, [loadOffers]);

  const doCreate = async () => {
    if (!giveAmt || !wantAmt || giveType === wantType) return;
    setLoading(true);
    try {
      await api.post('/trade/offers', { giveType, giveAmount: Number(giveAmt), wantType, wantAmount: Number(wantAmt) });
      setGiveAmt(''); setWantAmt('');
      await Promise.all([loadOffers(), refresh()]);
      onMsg('✅ ' + t('trade_offer_created'));
    } catch (e: any) {
      onMsg('❌ ' + (e?.response?.data?.message || t('error')));
    } finally { setLoading(false); }
  };

  const doAccept = async (id: string) => {
    setLoading(true);
    try {
      await api.post(`/trade/offers/${id}/accept`);
      await Promise.all([loadOffers(), refresh()]);
      onMsg('✅ ' + t('trade_accepted'));
    } catch (e: any) {
      onMsg('❌ ' + (e?.response?.data?.message || t('error')));
    } finally { setLoading(false); }
  };

  const doCancel = async (id: string) => {
    setLoading(true);
    try {
      await api.delete(`/trade/offers/${id}`);
      await Promise.all([loadOffers(), refresh()]);
      onMsg('✅ ' + t('trade_cancelled'));
    } catch (e: any) {
      onMsg('❌ ' + (e?.response?.data?.message || t('error')));
    } finally { setLoading(false); }
  };

  const selectStyle = { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', padding: '6px 8px', fontSize: 13 };
  const inputStyle = { width: 80, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', padding: '6px 8px', fontSize: 13, textAlign: 'center' as const };

  return (
    <div>
      {/* Create offer */}
      <div style={{ background: 'rgba(244,208,63,0.06)', border: '1px solid rgba(244,208,63,0.2)', borderRadius: 14, padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f4d03f', marginBottom: 12 }}>📤 {t('trade_create_title')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: '#a0845a' }}>{t('trade_give')}:</span>
          <select value={giveType} onChange={e => setGiveType(e.target.value as ResType)} style={selectStyle}>
            {RES_OPTIONS.map(r => <option key={r} value={r}>{t(r)}</option>)}
          </select>
          <input type="number" value={giveAmt} onChange={e => setGiveAmt(e.target.value)} min={1} placeholder="0" style={inputStyle} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: '#a0845a' }}>{t('trade_want')}:</span>
          <select value={wantType} onChange={e => setWantType(e.target.value as ResType)} style={selectStyle}>
            {RES_OPTIONS.map(r => <option key={r} value={r}>{t(r)}</option>)}
          </select>
          <input type="number" value={wantAmt} onChange={e => setWantAmt(e.target.value)} min={1} placeholder="0" style={inputStyle} />
        </div>
        <button onClick={doCreate} disabled={loading || !giveAmt || !wantAmt || giveType === wantType}
          style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'linear-gradient(135deg,#f39c12,#f4d03f)', border: 'none', color: '#000', fontWeight: 900, fontSize: 14, cursor: 'pointer', opacity: (!giveAmt || !wantAmt || giveType === wantType) ? 0.4 : 1 }}>
          {t('trade_post_btn')}
        </button>
        <div style={{ fontSize: 10, color: '#666', marginTop: 6, textAlign: 'center' }}>{t('trade_max_hint')}</div>
      </div>

      {/* Offer list */}
      <div style={{ fontSize: 12, fontWeight: 700, color: '#a0845a', marginBottom: 8 }}>🤝 {t('trade_open_offers')} ({offers.length})</div>
      {offers.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#555', fontSize: 13, paddingTop: 16 }}>{t('trade_no_offers')}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {offers.map(o => (
            <div key={o.id} style={{ background: o.isMine ? 'rgba(52,152,219,0.08)' : 'rgba(0,0,0,0.3)', border: `1px solid ${o.isMine ? 'rgba(52,152,219,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ResIcon type={o.giveType} size={14} />
                    <span style={{ fontWeight: 700, color: '#f4d03f' }}>{o.giveAmount.toLocaleString()}</span>
                  </div>
                  <span style={{ color: '#555' }}>→</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ResIcon type={o.wantType} size={14} />
                    <span style={{ fontWeight: 700, color: '#27ae60' }}>{o.wantAmount.toLocaleString()}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#666' }}>· {o.offererName}</span>
                </div>
                {o.isMine ? (
                  <button onClick={() => doCancel(o.id)} disabled={loading}
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c', cursor: 'pointer' }}>
                    {t('trade_cancel')}
                  </button>
                ) : (
                  <button onClick={() => doAccept(o.id)} disabled={loading}
                    style={{ fontSize: 12, padding: '5px 14px', borderRadius: 8, background: 'linear-gradient(135deg,#27ae60,#2ecc71)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                    {t('trade_accept')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AllianceScreen() {
  const t = useT();
  const { kingdom, refresh } = useGameStore();
  const [tab, setTab] = useState<'mine' | 'browse' | 'create' | 'trade'>('mine');
  const [myAlliance, setMyAlliance] = useState<MyAlliance | null | undefined>(undefined);
  const [list, setList] = useState<AllianceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [desc, setDesc] = useState('');

  const loadMine = async () => {
    setLoading(true);
    try { setMyAlliance(await api.get('/alliances/mine')); }
    catch { setMyAlliance(null); }
    finally { setLoading(false); }
  };

  const loadList = async () => {
    setLoading(true);
    try { setList(await api.get('/alliances')); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadMine(); }, []);
  useEffect(() => { if (tab === 'browse') loadList(); }, [tab]);

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3500); };

  const doCreate = async () => {
    if (!name.trim() || !tag.trim()) return;
    setLoading(true);
    try {
      await api.post('/alliances', { name: name.trim(), tag: tag.trim(), description: desc.trim() });
      await loadMine();
      await refresh();
      setTab('mine');
      showMsg(t('alliance_created'));
    } catch (e: any) {
      showMsg('❌ ' + (e?.response?.data?.message || t('error')));
    } finally { setLoading(false); }
  };

  const doJoin = async (allianceId: string) => {
    setLoading(true);
    try {
      await api.post('/alliances/join', { allianceId });
      await loadMine();
      setTab('mine');
      showMsg(t('alliance_joined'));
    } catch (e: any) {
      showMsg('❌ ' + (e?.response?.data?.message || t('error')));
    } finally { setLoading(false); }
  };

  const doLeave = async () => {
    if (!confirm(t('alliance_leave_confirm'))) return;
    setLoading(true);
    try {
      await api.delete('/alliances/leave');
      setMyAlliance(null);
      setTab('browse');
      loadList();
    } catch (e: any) {
      showMsg('❌ ' + (e?.response?.data?.message || t('error')));
    } finally { setLoading(false); }
  };

  const doDisband = async () => {
    if (!confirm(t('alliance_disband_confirm'))) return;
    setLoading(true);
    try {
      await api.delete('/alliances/disband');
      setMyAlliance(null);
      setTab('browse');
      loadList();
    } catch (e: any) {
      showMsg('❌ ' + (e?.response?.data?.message || t('error')));
    } finally { setLoading(false); }
  };

  const doKick = async (targetKingdomId: string, memberName: string) => {
    if (!confirm(`${t('alliance_kick_confirm')} ${memberName}?`)) return;
    try {
      await api.post('/alliances/kick', { targetKingdomId });
      await loadMine();
    } catch (e: any) { showMsg('❌ ' + (e?.response?.data?.message || t('error'))); }
  };

  const doPromote = async (targetKingdomId: string) => {
    try {
      await api.post(`/alliances/promote/${targetKingdomId}`, {});
      await loadMine();
    } catch (e: any) { showMsg('❌ ' + (e?.response?.data?.message || t('error'))); }
  };

  const doTransfer = async (targetKingdomId: string, memberName: string) => {
    if (!confirm(`${t('alliance_transfer_confirm')} ${memberName}?`)) return;
    try {
      await api.post('/alliances/transfer-leadership', { targetKingdomId });
      await loadMine();
    } catch (e: any) { showMsg('❌ ' + (e?.response?.data?.message || t('error'))); }
  };

  const inAlliance = !!myAlliance;
  const gems = kingdom?.gems ?? 0;

  return (
    <div className="screen">
      <div className="screen-title">{t('nav_alliance')}</div>

      {msg && (
        <div style={{ background: 'rgba(244,208,63,0.1)', border: '1px solid rgba(244,208,63,0.3)', borderRadius: 10, padding: '8px 12px', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['mine', 'browse', ...(inAlliance ? ['trade'] : ['create'])] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb as any)}
            style={{ flex: 1, padding: '7px 6px', borderRadius: 10, fontSize: 11, fontWeight: tab === tb ? 700 : 400,
              background: tab === tb ? 'rgba(244,208,63,0.2)' : 'rgba(0,0,0,0.3)',
              border: `1px solid ${tab === tb ? 'rgba(244,208,63,0.5)' : 'rgba(255,255,255,0.08)'}`,
              color: tab === tb ? '#f4d03f' : '#888', cursor: 'pointer' }}>
            {tb === 'mine' ? t('alliance_tab_mine') : tb === 'browse' ? t('alliance_tab_browse') : tb === 'trade' ? t('trade_tab') : t('alliance_tab_create')}
          </button>
        ))}
      </div>

      {/* MY ALLIANCE */}
      {tab === 'mine' && (
        myAlliance === undefined ? (
          <div style={{ textAlign: 'center', color: '#555', paddingTop: 40 }}>...</div>
        ) : !myAlliance ? (
          <div style={{ textAlign: 'center', paddingTop: 50 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏰</div>
            <div style={{ color: '#888', fontSize: 14, marginBottom: 20 }}>{t('alliance_not_member')}</div>
            <button className="btn btn-gold" onClick={() => setTab('browse')} style={{ marginRight: 8 }}>{t('alliance_tab_browse')}</button>
            <button className="btn" onClick={() => setTab('create')}>{t('alliance_tab_create')}</button>
          </div>
        ) : (
          <div>
            {/* Alliance card */}
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
              {myAlliance.alliance.description && (
                <div style={{ color: '#888', fontSize: 12, marginTop: 6 }}>{myAlliance.alliance.description}</div>
              )}
              <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12, flexWrap: 'wrap' }}>
                <span style={{ color: '#27ae60' }}>👥 {myAlliance.memberCount}/{myAlliance.maxMembers}</span>
                <span style={{ color: '#27ae60' }}>📈 +{myAlliance.allianceBonus}% {t('production_bonus')}</span>
                <span style={{ color: '#a0845a' }}>{ROLE_ICON[myAlliance.myRole]} {t(`alliance_role_${myAlliance.myRole}`)}</span>
              </div>
            </div>

            {/* Members list */}
            <div style={{ fontSize: 13, fontWeight: 700, color: '#a0845a', marginBottom: 8 }}>👥 {t('alliance_members')} ({myAlliance.memberCount})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {[...myAlliance.members].sort((a, b) => {
                const r: Record<Role, number> = { leader: 0, officer: 1, member: 2 };
                return r[a.role] - r[b.role] || b.score - a.score;
              }).map(m => {
                const isMe = m.kingdomId === kingdom?.id;
                const canManage = myAlliance.myRole === 'leader' && !isMe && m.role !== 'leader';
                return (
                  <div key={m.kingdomId} style={{
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
                    {canManage && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button title={m.role === 'officer' ? t('alliance_demote') : t('alliance_promote')}
                          onClick={() => doPromote(m.kingdomId)}
                          style={{ fontSize: 10, padding: '3px 7px', borderRadius: 6, background: 'rgba(52,152,219,0.15)', border: '1px solid rgba(52,152,219,0.3)', color: '#3498db', cursor: 'pointer' }}>
                          {m.role === 'officer' ? '↓' : '⭐'}
                        </button>
                        <button title={t('alliance_transfer_leadership')}
                          onClick={() => doTransfer(m.kingdomId, m.name)}
                          style={{ fontSize: 10, padding: '3px 7px', borderRadius: 6, background: 'rgba(244,208,63,0.15)', border: '1px solid rgba(244,208,63,0.3)', color: '#f4d03f', cursor: 'pointer' }}>
                          👑
                        </button>
                        <button title={t('alliance_kick')}
                          onClick={() => doKick(m.kingdomId, m.name)}
                          style={{ fontSize: 10, padding: '3px 7px', borderRadius: 6, background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c', cursor: 'pointer' }}>
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Leave / Disband */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" style={{ flex: 1, background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c' }}
                disabled={loading} onClick={doLeave}>
                🚪 {t('alliance_leave')}
              </button>
              {myAlliance.myRole === 'leader' && (
                <button className="btn" style={{ flex: 1, background: 'rgba(231,76,60,0.2)', border: '1px solid rgba(231,76,60,0.5)', color: '#e74c3c', fontWeight: 700 }}
                  disabled={loading} onClick={doDisband}>
                  💥 {t('alliance_disband')}
                </button>
              )}
            </div>
          </div>
        )
      )}

      {/* BROWSE */}
      {tab === 'browse' && (
        loading ? (
          <div style={{ textAlign: 'center', color: '#555', paddingTop: 40 }}>...</div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#555', paddingTop: 40 }}>{t('alliance_none')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {list.map(a => (
              <div key={a.id} style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(244,208,63,0.1)', borderRadius: 12, padding: '12px 14px' }}>
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
                  {!inAlliance && a.memberCount < a.maxMembers && (
                    <button className="btn btn-gold" style={{ fontSize: 11, padding: '5px 14px' }}
                      disabled={loading} onClick={() => doJoin(a.id)}>
                      {t('alliance_join')}
                    </button>
                  )}
                  {a.memberCount >= a.maxMembers && (
                    <span style={{ fontSize: 11, color: '#e74c3c' }}>{t('alliance_full')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* TRADE */}
      {tab === 'trade' && inAlliance && (
        <TradePanel myKingdomId={kingdom?.id ?? ''} t={t} onMsg={showMsg} />
      )}

      {/* CREATE */}
      {tab === 'create' && !inAlliance && (
        <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(244,208,63,0.15)', borderRadius: 14, padding: '16px' }}>
          <div style={{ color: '#888', fontSize: 12, marginBottom: 14 }}>
            <img src="/assets/icon_gem.png" style={{ width: 14, height: 14, objectFit: 'contain', verticalAlign: 'middle', marginRight: 3 }} />
            {t('alliance_create_cost')}: <strong style={{ color: '#f4d03f' }}>500</strong>
            &nbsp;·&nbsp; {t('your_balance')}: <strong style={{ color: gems >= 500 ? '#27ae60' : '#e74c3c' }}>{gems}</strong>
            <img src="/assets/icon_gem.png" style={{ width: 12, height: 12, objectFit: 'contain', verticalAlign: 'middle', marginLeft: 2 }} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{t('alliance_name')} *</div>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={40}
              placeholder={t('alliance_name_placeholder')}
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', color: '#fff', fontSize: 13 }} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{t('alliance_tag')} * (2-6)</div>
            <input value={tag} onChange={e => setTag(e.target.value.toUpperCase())} maxLength={6}
              placeholder="KW"
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', color: '#f4d03f', fontSize: 14, fontWeight: 700, letterSpacing: 2 }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{t('alliance_desc')} ({t('optional')})</div>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} maxLength={200} rows={2}
              placeholder={t('alliance_desc_placeholder')}
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', color: '#aaa', fontSize: 12, resize: 'none' }} />
          </div>

          <button className="btn btn-gold" style={{ width: '100%', padding: '12px', fontSize: 14, opacity: gems >= 500 && name.trim() && tag.trim() ? 1 : 0.5 }}
            disabled={loading || gems < 500 || !name.trim() || !tag.trim()} onClick={doCreate}>
            {loading ? '...' : <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>🤝 {t('alliance_create_btn')} — 500 <img src="/assets/icon_gem.png" style={{ width:14, height:14, objectFit:'contain' }} /></span>}
          </button>
        </div>
      )}
    </div>
  );
}
