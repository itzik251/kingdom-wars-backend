"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = WorldMapScreen;
const react_1 = require("react");
const client_1 = require("../api/client");
const format_1 = require("../utils/format");
const gameStore_1 = require("../store/gameStore");
const KingdomProfileSheet_1 = require("../components/KingdomProfileSheet");
const useT_1 = require("../i18n/useT");
const Countdown_1 = require("../components/Countdown");
const W = 64, H = 32;
function iso(gx, gy) {
    return { x: (gx - gy) * W, y: (gx + gy) * H };
}
function shade(h, s, l, delta) {
    return `hsl(${h},${s}%,${Math.max(5, Math.min(90, l + delta))}%)`;
}
function WorldMapScreen() {
    const { kingdom, refresh } = (0, gameStore_1.useGameStore)();
    const t = (0, useT_1.useT)();
    const [kingdoms, setKingdoms] = (0, react_1.useState)([]);
    const [selected, setSelected] = (0, react_1.useState)(null);
    const [profileId, setProfileId] = (0, react_1.useState)(null);
    const [attacking, setAttacking] = (0, react_1.useState)(false);
    const [battle, setBattle] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [pan, setPan] = (0, react_1.useState)({ x: 0, y: 0 });
    const [zoom, setZoom] = (0, react_1.useState)(1);
    const dragRef = (0, react_1.useRef)(null);
    const isDragging = (0, react_1.useRef)(false);
    const containerRef = (0, react_1.useRef)(null);
    const lastPinchDist = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        client_1.api.get('/leaderboard?all=true').then((data) => {
            const raw = Array.isArray(data) ? data : data.leaderboard || [];
            const norm = raw.map((k, i) => ({
                id: k.id, rank: k.rank ?? i + 1,
                kingdomName: k.kingdomName ?? k.name,
                username: k.username ?? k.user?.username ?? k.user?.firstName,
                score: k.score ?? 0,
                shieldActive: k.shieldActive ?? k.isShielded ?? false,
                shieldUntil: k.shieldUntil ?? null,
                usdtBalance: k.usdtBalance ?? 0,
                gameBalance: k.gameBalance ?? 0,
            }));
            setKingdoms(norm);
            setLoading(false);
            setTimeout(() => {
                const cW = containerRef.current?.clientWidth ?? window.innerWidth;
                const cH = containerRef.current?.clientHeight ?? 400;
                const cols = Math.max(4, Math.ceil(Math.sqrt(norm.length)));
                const myIdx = norm.findIndex(k => k.kingdomName === kingdom?.name);
                const idx = myIdx >= 0 ? myIdx : 0;
                const gx = idx % cols, gy = Math.floor(idx / cols);
                const { x, y } = iso(gx + 0.5, gy + 0.5);
                const minX = iso(0, Math.ceil(norm.length / cols)).x - W * 2;
                setPan({ x: cW / 2 - (x - minX), y: cH / 2 - y - 40 });
            }, 100);
        }).catch(() => setLoading(false));
    }, []);
    const onPointerDown = (0, react_1.useCallback)((e) => {
        if (e.target.closest('[data-kingdom]'))
            return;
        isDragging.current = false;
        dragRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
        e.currentTarget.setPointerCapture(e.pointerId);
    }, [pan]);
    const onPointerMove = (0, react_1.useCallback)((e) => {
        if (!dragRef.current)
            return;
        const dx = e.clientX - dragRef.current.sx;
        const dy = e.clientY - dragRef.current.sy;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5)
            isDragging.current = true;
        if (isDragging.current)
            setPan({ x: dragRef.current.px + dx, y: dragRef.current.py + dy });
    }, []);
    const onPointerUp = (0, react_1.useCallback)(() => {
        dragRef.current = null;
        lastPinchDist.current = null;
        setTimeout(() => { isDragging.current = false; }, 10);
    }, []);
    const onWheel = (0, react_1.useCallback)((e) => {
        e.preventDefault();
        setZoom(z => Math.max(0.4, Math.min(3, z - e.deltaY * 0.001)));
    }, []);
    const onTouchMove = (0, react_1.useCallback)((e) => {
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (lastPinchDist.current !== null) {
                const delta = dist - lastPinchDist.current;
                setZoom(z => Math.max(0.4, Math.min(3, z + delta * 0.005)));
            }
            lastPinchDist.current = dist;
        }
    }, []);
    async function doAttack(profile) {
        setAttacking(true);
        try {
            const result = await client_1.api.post('/combat/attack', { defenderKingdomId: profile.id });
            setProfileId(null);
            setSelected(null);
            setBattle({ ...result, targetName: profile.name });
            await refresh();
        }
        catch (e) {
            alert(e.response?.data?.message || t('attack_error'));
        }
        finally {
            setAttacking(false);
        }
    }
    const COLS = Math.max(4, Math.ceil(Math.sqrt(kingdoms.length)));
    const maxScore = Math.max(1, ...kingdoms.map(k => k.score));
    const totalRows = Math.ceil(kingdoms.length / COLS);
    const allCorners = [iso(0, 0), iso(COLS, 0), iso(0, totalRows), iso(COLS, totalRows)];
    const minX = Math.min(...allCorners.map(c => c.x)) - W;
    const maxX = Math.max(...allCorners.map(c => c.x)) + W;
    const sceneW = maxX - minX;
    const sceneH = (COLS + totalRows) * H + H + 140;
    return (<div style={{ background: '#050d1a', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none' }}>

      
      <div style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(52,152,219,0.25)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#3498db' }}>{t('worldmap_title')}</div>
          <div style={{ fontSize: 11, color: '#5d8aa8', marginTop: 1 }}>{t('wm_subtitle', { n: kingdoms.length })}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#5d8aa8' }}>
          <span>{t('worldmap_you')}</span>
          <span>{t('worldmap_others')}</span>
          <span>{t('worldmap_protected')}</span>
        </div>
      </div>

      
      <div ref={containerRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={onWheel} onTouchMove={onTouchMove} style={{
            flex: 1, minHeight: 0, position: 'relative',
            background: 'radial-gradient(ellipse at 50% 40%,#0a1a2e 0%,#050d1a 70%)',
            overflow: 'hidden', cursor: 'grab', touchAction: 'none',
        }}>
        
        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 400, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          <button onClick={() => setZoom(z => Math.max(0.4, z - 0.2))} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
        </div>

        
        {[...Array(30)].map((_, i) => (<div key={i} style={{
                position: 'absolute',
                left: `${(i * 31 + 7) % 98}%`, top: `${(i * 17 + 5) % 90}%`,
                width: i % 4 === 0 ? 2 : 1, height: i % 4 === 0 ? 2 : 1,
                background: 'white', borderRadius: '50%',
                opacity: 0.2 + (i % 5) * 0.1, pointerEvents: 'none',
            }}/>))}

        
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%,transparent 40%,rgba(0,0,0,0.7) 100%)', pointerEvents: 'none', zIndex: 50 }}/>

        {loading ? (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#5d8aa8', gap: 12 }}>
            <div style={{ fontSize: 36 }}>🌍</div>
            <div className="skeleton" style={{ width: 160, height: 12, borderRadius: 6 }}/>
          </div>) : kingdoms.length === 0 ? (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#5d8aa8', gap: 12 }}>
            <div style={{ fontSize: 40 }}>🏜️</div>
            <div style={{ fontSize: 14 }}>{t('no_kingdoms_yet')}</div>
          </div>) : (<div style={{ position: 'absolute', left: pan.x, top: pan.y, width: sceneW, height: sceneH, willChange: 'transform', transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
            {kingdoms.map((k, i) => {
                const gx = i % COLS, gy = Math.floor(i / COLS);
                const { x, y } = iso(gx, gy);
                const px = x - minX, py = y;
                const isMe = k.kingdomName === kingdom?.name;
                const isSel = selected?.kingdomName === k.kingdomName;
                const hue = (i * 53 + 120) % 360;
                const h = 20 + Math.round((k.score / maxScore) * 55);
                const tw = 36;
                return (<div key={k.id || i}>
                  
                  <div style={{
                        position: 'absolute', left: px - W, top: py,
                        width: W * 2, height: H,
                        clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)',
                        background: isMe
                            ? 'linear-gradient(135deg,#2a4a1a,#1a3010)'
                            : 'linear-gradient(135deg,#0d2a3a,#071520)',
                        zIndex: gx + gy,
                    }}/>
                  
                  <div style={{ position: 'absolute', left: px - W, top: py + H / 2, width: W, height: 8, background: isMe ? '#162a0a' : '#051018', transform: 'skewY(26.6deg)', transformOrigin: 'top left', zIndex: gx + gy }}/>
                  <div style={{ position: 'absolute', left: px, top: py + H / 2, width: W, height: 8, background: isMe ? '#0e1e06' : '#030c12', transform: 'skewY(-26.6deg)', transformOrigin: 'top right', zIndex: gx + gy }}/>

                  
                  <div data-kingdom="true" onClick={() => { if (!isDragging.current)
                    setSelected(isSel ? null : k); }} style={{
                        position: 'absolute',
                        left: px - tw / 2, top: py - h,
                        width: tw, height: h + H * 0.6,
                        zIndex: 200 + gx + gy,
                        cursor: 'pointer',
                    }}>
                    
                    <div style={{ position: 'absolute', left: 0, top: h * 0.4, width: tw / 2, height: h * 0.8, background: shade(hue, 55, 20, -5), transform: 'skewY(26.6deg)', transformOrigin: 'top left' }}/>
                    <div style={{ position: 'absolute', right: 0, top: h * 0.4, width: tw / 2, height: h * 0.8, background: shade(hue, 55, 20, -15), transform: 'skewY(-26.6deg)', transformOrigin: 'top right' }}/>
                    
                    <div style={{
                        position: 'absolute', left: 0, top: 0, width: tw, height: H * 0.8,
                        clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)',
                        background: isMe
                            ? 'linear-gradient(135deg,#f4d03f,#b8860b)'
                            : `linear-gradient(135deg,${shade(hue, 65, 40, 15)},${shade(hue, 65, 40, 0)})`,
                        boxShadow: isSel || isMe ? `0 0 16px ${isMe ? 'rgba(244,208,63,0.8)' : `hsla(${hue},70%,55%,0.7)`}` : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: 12, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))' }}>
                        {isMe ? '⭐' : k.shieldActive ? '🛡️' : '🏰'}
                      </span>
                    </div>

                    
                    <div style={{
                        position: 'absolute', left: '50%', top: -18, transform: 'translateX(-50%)',
                        background: isMe ? 'rgba(184,134,11,0.9)' : 'rgba(0,0,0,0.8)',
                        border: `1px solid ${isMe ? '#f4d03f' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 8, padding: '2px 6px',
                        fontSize: 8, fontWeight: 700, color: isMe ? '#000' : '#cfe6f5',
                        whiteSpace: 'nowrap', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      #{k.rank} {k.kingdomName.substring(0, 8)}
                    </div>
                  </div>
                </div>);
            })}
          </div>)}
      </div>

      
      {selected && (<div style={{
                position: 'absolute', bottom: 130, left: 12, right: 12, zIndex: 400,
                background: 'linear-gradient(135deg,rgba(5,15,30,0.98),rgba(10,25,50,0.98))',
                border: '1px solid rgba(52,152,219,0.4)', borderRadius: 14, padding: 14,
                boxShadow: '0 -4px 24px rgba(0,0,0,0.8)', animation: 'slideUp 0.2s ease-out',
            }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#e8f4f8' }}>🏰 {selected.kingdomName}</div>
              {selected.username && <div style={{ fontSize: 11, color: '#5d8aa8', marginTop: 2 }}>@{selected.username}</div>}
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#5d8aa8', fontSize: 20, cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(52,152,219,0.12)', borderRadius: 8, padding: '5px 10px', fontSize: 12, color: '#3498db' }}>🏆 #{selected.rank}</div>
            <div style={{ background: 'rgba(244,208,63,0.1)', borderRadius: 8, padding: '5px 10px', fontSize: 12, color: '#f4d03f' }}>⚡ {t('score_pts', { n: (0, format_1.fmt)(selected.score) })}</div>
            {selected.shieldActive && selected.shieldUntil && (<div style={{ background: 'rgba(52,152,219,0.1)', borderRadius: 8, padding: '5px 10px', fontSize: 12, color: '#3498db' }}>
                🛡️ {t('protected_label')} · <Countdown_1.default endsAt={selected.shieldUntil}/>
              </div>)}
            {(selected.usdtBalance ?? 0) > 0 && (<div style={{ background: 'rgba(39,174,96,0.1)', borderRadius: 8, padding: '5px 10px', fontSize: 12, color: '#27ae60' }}>
                💵 {selected.usdtBalance?.toFixed(4)} USDT
              </div>)}
            {(selected.gameBalance ?? 0) > 0 && (<div style={{ background: 'rgba(155,89,182,0.1)', borderRadius: 8, padding: '5px 10px', fontSize: 12, color: '#9b59b6' }}>
                🎮 {selected.gameBalance?.toFixed(4)} GAME
              </div>)}
          </div>
          {selected.kingdomName !== kingdom?.name && (<button className="btn" onClick={() => { if (selected.id) {
                setProfileId(selected.id);
                setSelected(null);
            } }} style={{ width: '100%', background: 'linear-gradient(135deg,#7b1515,#c0392b)', border: '1px solid #e74c3c', color: '#fff', padding: '11px', borderRadius: 10, fontWeight: 700 }}>
              {t('check_and_attack')}
            </button>)}
        </div>)}

      
      {profileId && (<KingdomProfileSheet_1.default kingdomId={profileId} attacking={attacking} onClose={() => setProfileId(null)} onAttack={doAttack}/>)}

      
      {battle && (<div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, textAlign: 'center' }} onClick={() => setBattle(null)}>
          <div style={{ fontSize: 64 }}>{battle.attackerWins ? '🏆' : '💀'}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: battle.attackerWins ? '#f4d03f' : '#e74c3c' }}>
            {battle.attackerWins ? t('battle_win') : t('battle_loss')}
          </div>
          {battle.attackerWins && battle.winStreak >= 2 && (<div style={{ background: 'rgba(244,208,63,0.15)', border: '1px solid #f4d03f', borderRadius: 20, padding: '4px 14px', color: '#f4d03f', fontWeight: 700, fontSize: 13 }}>
              {t('win_streak', { n: battle.winStreak })}{battle.streakBonus > 0 ? ` · +${(0, format_1.fmt)(battle.streakBonus)} 💰` : ''}
            </div>)}
          {battle.attackerWins && (<div style={{ background: 'rgba(244,208,63,0.1)', border: '1px solid rgba(244,208,63,0.3)', borderRadius: 12, padding: '10px 20px' }}>
              <div style={{ fontSize: 11, color: '#a0845a', marginBottom: 6 }}>{t('loot_label')}</div>
              <div style={{ display: 'flex', gap: 18, fontSize: 16, fontWeight: 700 }}>
                <span>💰 {(0, format_1.fmt)(battle.loot?.gold)}</span>
                <span>🪵 {(0, format_1.fmt)(battle.loot?.wood)}</span>
                <span>🪨 {(0, format_1.fmt)(battle.loot?.stone)}</span>
              </div>
            </div>)}
          {battle.buildingDamaged && (<div style={{ fontSize: 12, color: '#e67e22' }}>
              {t('building_damaged', { name: t('b_' + battle.buildingDamaged.type), n: battle.buildingDamaged.newLevel })}
            </div>)}
          {battle.attackerLosses && Object.values(battle.attackerLosses).some((v) => v > 0) && (<div style={{ fontSize: 12, color: '#e74c3c' }}>
              {t('your_losses')} {Object.entries(battle.attackerLosses).filter(([, v]) => v > 0).map(([k, v]) => `${(0, format_1.fmt)(v)} ${t('u_' + k)}`).join(', ')}
            </div>)}
          <button className="btn btn-gold" style={{ marginTop: 8, padding: '12px 36px' }} onClick={() => setBattle(null)}>{t('continue_btn')}</button>
        </div>)}
    </div>);
}
//# sourceMappingURL=WorldMapScreen.js.map