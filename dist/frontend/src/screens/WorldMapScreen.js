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
const TILE_W = 64, TILE_H = 32, WALL_H = 14;
const STEP = 2;
function isoXY(gx, gy) {
    return { x: (gx - gy) * (TILE_W / 2), y: (gx + gy) * (TILE_H / 2) };
}
const TERRAIN = {
    grass1: { top: '#4aaa28', left: '#2d6818', right: '#1a400c' },
    grass2: { top: '#3d9820', left: '#266014', right: '#163a0a' },
    path: { top: '#c8a060', left: '#8a6030', right: '#503818' },
    dirt: { top: '#9a7848', left: '#6a5030', right: '#3a2c18' },
    rock: { top: '#7a7a80', left: '#4a4a58', right: '#2a2a38', icon: '🪨' },
    forest: { top: '#2a6a10', left: '#164008', right: '#0a2004', icon: '🌲' },
    water: { top: '#2a5890', left: '#183858', right: '#0c2038' },
};
function terrainFor(i, j) {
    if ((i + j) % 7 === 0 && i % 2 === 1)
        return 'water';
    const h = ((i * 2654435761) ^ (j * 2246822519)) >>> 0;
    const v = h % 100;
    if (v < 8)
        return 'forest';
    if (v < 16)
        return 'rock';
    if (v < 26)
        return 'grass2';
    if (v < 36)
        return 'dirt';
    return 'grass1';
}
function kingdomColors(k, isMe) {
    if (isMe)
        return { top: '#4aaa28', left: '#2d6818', right: '#1a400c' };
    if (k.rank === 1)
        return { top: '#c8a040', left: '#7a5c18', right: '#4a3808' };
    if (k.rank === 2)
        return { top: '#909090', left: '#585858', right: '#383838' };
    if (k.rank === 3)
        return { top: '#a06030', left: '#603818', right: '#382008' };
    if (k.shieldActive)
        return { top: '#2860a8', left: '#183868', right: '#0c2038' };
    const hue = (k.rank * 47 + 160) % 360;
    return { top: `hsl(${hue},45%,22%)`, left: `hsl(${hue},40%,13%)`, right: `hsl(${hue},35%,8%)` };
}
function IsoTile({ colors, icon, size = 1, glow = false, glowColor = '#f4d03f', zBase = 0, px, py, onClick, children }) {
    const tW = TILE_W * size, tH = TILE_H * size;
    const bodyH = size === 2 ? 28 : WALL_H;
    return (<div onClick={onClick} style={{ position: 'absolute', left: px - tW / 2, top: py - bodyH, width: tW, height: tH + bodyH, zIndex: zBase, cursor: onClick ? 'pointer' : 'default' }}>
      
      <div style={{ position: 'absolute', left: 0, top: tH / 2, width: tW / 2, height: bodyH, background: `linear-gradient(180deg,${colors.left},${colors.right})`, transform: 'skewY(26.6deg)', transformOrigin: 'top left' }}/>
      
      <div style={{ position: 'absolute', right: 0, top: tH / 2, width: tW / 2, height: bodyH, background: `linear-gradient(180deg,${colors.right},rgba(0,0,0,0.85))`, transform: 'skewY(-26.6deg)', transformOrigin: 'top right' }}/>
      
      <div style={{ position: 'absolute', left: 0, top: 0, width: tW, height: tH, clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)', background: `radial-gradient(ellipse at 40% 35%,${colors.top},${colors.left})`, boxShadow: glow ? `0 0 18px ${glowColor}88, 0 0 6px ${glowColor}44` : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon && <span style={{ fontSize: size === 2 ? 24 : 15, paddingTop: tH * 0.2, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))' }}>{icon}</span>}
      </div>
      {children}
    </div>);
}
function WorldMapScreen() {
    const { kingdom, refresh } = (0, gameStore_1.useGameStore)();
    const t = (0, useT_1.useT)();
    const [kingdoms, setKingdoms] = (0, react_1.useState)([]);
    const [selected, setSelected] = (0, react_1.useState)(null);
    const [profileId, setProfileId] = (0, react_1.useState)(null);
    const [attackingId, setAttackingId] = (0, react_1.useState)(null);
    const [marchCountdown, setMarchCountdown] = (0, react_1.useState)(0);
    const cancelMarchRef = (0, react_1.useRef)(false);
    const [battle, setBattle] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [attackError, setAttackError] = (0, react_1.useState)('');
    const [pan, setPan] = (0, react_1.useState)({ x: 0, y: 0 });
    const [zoom, setZoom] = (0, react_1.useState)(1);
    const dragRef = (0, react_1.useRef)(null);
    const isDragging = (0, react_1.useRef)(false);
    const containerRef = (0, react_1.useRef)(null);
    const lastPinch = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        client_1.api.get('/leaderboard?all=true').then((data) => {
            const raw = Array.isArray(data) ? data : data.leaderboard || [];
            const norm = raw.map((k, i) => ({
                id: k.id, rank: k.rank ?? i + 1,
                kingdomName: k.kingdomName ?? k.name,
                username: k.username ?? k.user?.username ?? k.user?.firstName,
                score: k.score ?? 0, shieldActive: k.shieldActive ?? false,
                shieldUntil: k.shieldUntil ?? null, usdtBalance: k.usdtBalance ?? 0,
            }));
            setKingdoms(norm);
            setLoading(false);
            setTimeout(() => {
                const cW = containerRef.current?.clientWidth ?? window.innerWidth;
                const cH = containerRef.current?.clientHeight ?? 400;
                const COLS = Math.max(4, Math.ceil(Math.sqrt(norm.length)));
                const myIdx = Math.max(0, norm.findIndex(k => k.kingdomName === kingdom?.name));
                const gx = (myIdx % COLS) * STEP + 1;
                const gy = Math.floor(myIdx / COLS) * STEP + 1;
                const { x, y } = isoXY(gx, gy);
                const ROWS = Math.ceil(norm.length / COLS);
                const corners = [isoXY(0, 0), isoXY(COLS * STEP + 2, 0), isoXY(0, ROWS * STEP + 2), isoXY(COLS * STEP + 2, ROWS * STEP + 2)];
                const mX = Math.min(...corners.map(c => c.x)) - TILE_W * 2;
                setPan({ x: cW / 2 - (x - mX), y: cH / 2 - y - 40 });
            }, 100);
        }).catch(() => setLoading(false));
    }, []);
    const onPointerDown = (0, react_1.useCallback)((e) => {
        if (e.target.closest('[data-tile]'))
            return;
        isDragging.current = false;
        dragRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
        e.currentTarget.setPointerCapture(e.pointerId);
    }, [pan]);
    const onPointerMove = (0, react_1.useCallback)((e) => {
        if (!dragRef.current)
            return;
        const dx = e.clientX - dragRef.current.sx, dy = e.clientY - dragRef.current.sy;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4)
            isDragging.current = true;
        if (isDragging.current)
            setPan({ x: dragRef.current.px + dx, y: dragRef.current.py + dy });
    }, []);
    const onPointerUp = (0, react_1.useCallback)(() => {
        dragRef.current = null;
        lastPinch.current = null;
        setTimeout(() => { isDragging.current = false; }, 10);
    }, []);
    const onWheel = (0, react_1.useCallback)((e) => {
        e.preventDefault();
        setZoom(z => Math.max(0.35, Math.min(3, z - e.deltaY * 0.001)));
    }, []);
    const onTouchMove = (0, react_1.useCallback)((e) => {
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (lastPinch.current !== null)
                setZoom(z => Math.max(0.35, Math.min(3, z + (dist - lastPinch.current) * 0.005)));
            lastPinch.current = dist;
        }
    }, []);
    async function doAttack(profile, squadOptions) {
        if (attackingId)
            return;
        setAttackingId(profile.id);
        setAttackError('');
        cancelMarchRef.current = false;
        try {
            const boostActive = !!kingdom?.attackSpeedBoostUntil && new Date() < new Date(kingdom.attackSpeedBoostUntil);
            const baseMarch = profile.marchSeconds || 5;
            const marchSecs = boostActive ? Math.max(1, Math.ceil(baseMarch / 2)) : baseMarch;
            setMarchCountdown(marchSecs);
            await new Promise((res, rej) => {
                let rem = marchSecs;
                const tick = setInterval(() => {
                    if (cancelMarchRef.current) {
                        clearInterval(tick);
                        rej(new Error('CANCELLED'));
                        return;
                    }
                    rem--;
                    setMarchCountdown(rem);
                    if (rem <= 0) {
                        clearInterval(tick);
                        res();
                    }
                }, 1000);
            });
            setMarchCountdown(0);
            const result = await client_1.api.post('/combat/attack', {
                defenderKingdomId: profile.id,
                heroType: squadOptions?.heroType,
                squad: squadOptions?.squad,
            });
            setProfileId(null);
            setSelected(null);
            setBattle({ ...result, targetName: profile.name });
            await refresh();
        }
        catch (e) {
            if (e?.message === 'CANCELLED')
                return;
            setAttackError(e.response?.data?.message || t('attack_error'));
            setTimeout(() => setAttackError(''), 5000);
        }
        finally {
            setAttackingId(null);
            setMarchCountdown(0);
        }
    }
    const COLS = Math.max(4, Math.ceil(Math.sqrt(kingdoms.length)));
    const ROWS = Math.ceil(kingdoms.length / COLS);
    const GCOLS = COLS * STEP + 2;
    const GROWS = ROWS * STEP + 2;
    const allCorners = [isoXY(0, 0), isoXY(GCOLS, 0), isoXY(0, GROWS), isoXY(GCOLS, GROWS)];
    const minX = Math.min(...allCorners.map(c => c.x)) - TILE_W;
    const maxX = Math.max(...allCorners.map(c => c.x)) + TILE_W;
    const sceneW = maxX - minX;
    const sceneH = (GCOLS + GROWS) * (TILE_H / 2) + TILE_H * 3 + 80;
    const allTiles = (0, react_1.useMemo)(() => {
        const list = [];
        for (let j = 0; j < GROWS; j++)
            for (let i = 0; i < GCOLS; i++) {
                const col = (i - 1) / STEP;
                const row = (j - 1) / STEP;
                const isKingdom = Number.isInteger(col) && Number.isInteger(row) && col >= 0 && row >= 0;
                const kIdx = isKingdom ? (row * COLS + col) : undefined;
                list.push({ i, j, isKingdom: isKingdom && kIdx !== undefined && kIdx < kingdoms.length, kIdx });
            }
        return list.sort((a, b) => (a.i + a.j) - (b.i + b.j));
    }, [GCOLS, GROWS, COLS, kingdoms.length]);
    return (<div style={{ background: '#060e06', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none' }}>

      {attackError && (<div style={{ position: 'absolute', top: 60, left: 12, right: 12, zIndex: 600, background: 'rgba(231,76,60,0.95)', border: '1px solid #e74c3c', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 14, fontWeight: 700, textAlign: 'center' }}>
          ⛔ {attackError}
        </div>)}

      
      <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.75)', borderBottom: '1px solid rgba(244,208,63,0.2)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f4d03f' }}>{t('worldmap_title')}</div>
          <div style={{ fontSize: 11, color: '#a0845a', marginTop: 1 }}>{t('wm_subtitle', { n: kingdoms.length })}</div>
        </div>
        
        <div style={{ display: 'flex', gap: 6, fontSize: 10, color: '#a0845a', alignItems: 'center' }}>
          <span>⭐ {t('worldmap_you')}</span>
          <span style={{ color: '#333' }}>·</span>
          <span>🏰 {t('worldmap_others')}</span>
          <span style={{ color: '#333' }}>·</span>
          <span>🛡️ {t('worldmap_protected')}</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 10, color: '#3a5a30', padding: '3px 0', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
        {t('map_hint')}
      </div>

      
      <div ref={containerRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={onWheel} onTouchMove={onTouchMove} style={{ flex: 1, minHeight: 0, position: 'relative', background: 'radial-gradient(ellipse at 50% 40%,#0f2a0a 0%,#060e06 70%)', overflow: 'hidden', cursor: 'grab', touchAction: 'none' }}>
        
        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 400, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          <button onClick={() => setZoom(z => Math.max(0.35, z - 0.2))} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
        </div>

        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%,transparent 40%,rgba(0,0,0,0.65) 100%)', pointerEvents: 'none', zIndex: 300 }}/>

        {loading ? (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#5d8aa8', gap: 12 }}>
            <div style={{ fontSize: 36 }}>🌍</div>
            <div className="skeleton" style={{ width: 160, height: 12, borderRadius: 6 }}/>
          </div>) : kingdoms.length === 0 ? (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#5d8aa8', gap: 12 }}>
            <div style={{ fontSize: 40 }}>🏜️</div>
            <div style={{ fontSize: 14 }}>{t('no_kingdoms_yet')}</div>
          </div>) : (<div style={{ position: 'absolute', left: pan.x, top: pan.y, width: sceneW, height: sceneH, willChange: 'transform', transform: `scale(${zoom})`, transformOrigin: '0 0' }}>

            {allTiles.map(({ i, j, isKingdom, kIdx }) => {
                const { x, y } = isoXY(i, j);
                const px = x - minX, py = y;
                const zBase = i + j;
                if (!isKingdom || kIdx === undefined) {
                    const tr = TERRAIN[terrainFor(i, j)];
                    return (<div key={`t${i},${j}`} style={{ position: 'absolute', left: px - TILE_W / 2, top: py, width: TILE_W, height: TILE_H + WALL_H, zIndex: zBase, pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', left: 0, top: TILE_H / 2, width: TILE_W / 2, height: WALL_H, background: tr.left, transform: 'skewY(26.6deg)', transformOrigin: 'top left' }}/>
                    <div style={{ position: 'absolute', right: 0, top: TILE_H / 2, width: TILE_W / 2, height: WALL_H, background: tr.right, transform: 'skewY(-26.6deg)', transformOrigin: 'top right' }}/>
                    <div style={{ position: 'absolute', left: 0, top: 0, width: TILE_W, height: TILE_H, clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)', background: `linear-gradient(135deg,${tr.top},${tr.left})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {tr.icon && <span style={{ fontSize: 10, opacity: 0.7, paddingTop: TILE_H * 0.2 }}>{tr.icon}</span>}
                    </div>
                  </div>);
                }
                const BODY = 20;
                const k = kingdoms[kIdx];
                const isMe = k.kingdomName === kingdom?.name;
                const isSel = selected?.id === k.id;
                const colors = kingdomColors(k, isMe);
                const castleEmoji = isMe ? '⭐' : k.rank === 1 ? '👑' : k.rank === 2 ? '🏆' : k.rank === 3 ? '🥉' : k.shieldActive ? '🛡️' : '🏰';
                const zK = zBase + 200 + (isSel || isMe ? 100 : 0);
                return (<div key={`k${kIdx}`}>
                  
                  <div style={{ position: 'absolute', left: px - TILE_W / 2, top: py, width: TILE_W, height: TILE_H + WALL_H, zIndex: zBase + 10, pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', left: 0, top: TILE_H / 2, width: TILE_W / 2, height: WALL_H, background: '#2d6818', transform: 'skewY(26.6deg)', transformOrigin: 'top left' }}/>
                    <div style={{ position: 'absolute', right: 0, top: TILE_H / 2, width: TILE_W / 2, height: WALL_H, background: '#1a400c', transform: 'skewY(-26.6deg)', transformOrigin: 'top right' }}/>
                    <div style={{ position: 'absolute', left: 0, top: 0, width: TILE_W, height: TILE_H, clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)', background: 'linear-gradient(135deg,#4aaa28,#2d6818)' }}/>
                  </div>

                  
                  <div data-tile="true" onClick={() => { if (!isDragging.current)
                    setSelected(isSel ? null : k); }} style={{ position: 'absolute', left: px - TILE_W / 2, top: py - BODY, width: TILE_W, height: TILE_H + BODY, zIndex: zK, cursor: 'pointer' }}>
                    
                    <div style={{ position: 'absolute', left: 0, top: TILE_H / 2, width: TILE_W / 2, height: BODY, background: `linear-gradient(180deg,${colors.left},${colors.right})`, transform: 'skewY(26.6deg)', transformOrigin: 'top left' }}/>
                    
                    <div style={{ position: 'absolute', right: 0, top: TILE_H / 2, width: TILE_W / 2, height: BODY, background: `linear-gradient(180deg,${colors.right},rgba(0,0,0,0.85))`, transform: 'skewY(-26.6deg)', transformOrigin: 'top right' }}/>
                    
                    <div style={{ position: 'absolute', left: 0, top: 0, width: TILE_W, height: TILE_H, clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)', background: `radial-gradient(ellipse at 40% 35%,${colors.top},${colors.left})`, filter: isSel ? 'brightness(1.4)' : isMe ? 'brightness(1.1)' : undefined, boxShadow: (isSel || isMe) ? `0 0 20px ${colors.top}88` : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 17, paddingTop: TILE_H * 0.18, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.9))' }}>{castleEmoji}</span>
                    </div>
                    
                    <div style={{ position: 'absolute', left: '50%', top: -14, transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.85)', border: `1px solid ${isMe ? '#f4d03f' : 'rgba(255,255,255,0.12)'}`, borderRadius: 8, padding: '2px 6px', fontSize: 8, fontWeight: 800, color: isMe ? '#f4d03f' : 'rgba(200,220,255,0.9)', textShadow: '0 1px 3px rgba(0,0,0,1)', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                      #{k.rank}
                    </div>
                  </div>

                  
                  <div style={{ position: 'absolute', left: px - 38, top: py + TILE_H + WALL_H + 2, width: 76, textAlign: 'center', fontSize: 8, fontWeight: 700, color: isMe ? '#f4d03f' : 'rgba(200,220,255,0.75)', textShadow: '0 1px 4px rgba(0,0,0,1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 1000 }}>
                    {k.kingdomName.substring(0, 11)}
                  </div>
                </div>);
            })}
          </div>)}
      </div>

      
      {selected && (<div style={{ position: 'absolute', bottom: 130, left: 12, right: 12, zIndex: 400, background: 'linear-gradient(135deg,rgba(6,14,6,0.98),rgba(10,22,10,0.98))', border: '1px solid rgba(244,208,63,0.3)', borderRadius: 14, padding: 14, boxShadow: '0 -4px 24px rgba(0,0,0,0.8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f4d03f' }}>🏰 {selected.kingdomName}</div>
              {selected.username && <div style={{ fontSize: 11, color: '#a0845a', marginTop: 2 }}>@{selected.username}</div>}
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#a0845a', fontSize: 20, cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(244,208,63,0.1)', borderRadius: 8, padding: '5px 10px', fontSize: 12, color: '#f4d03f' }}>🏆 #{selected.rank}</div>
            <div style={{ background: 'rgba(244,208,63,0.08)', borderRadius: 8, padding: '5px 10px', fontSize: 12, color: '#a0845a' }}>⚡ {t('score_pts', { n: (0, format_1.fmt)(selected.score) })}</div>
            {selected.shieldActive && selected.shieldUntil && (<div style={{ background: 'rgba(52,152,219,0.1)', borderRadius: 8, padding: '5px 10px', fontSize: 12, color: '#3498db' }}>
                🛡️ {t('protected_label')} · <Countdown_1.default endsAt={selected.shieldUntil}/>
              </div>)}
            {(selected.usdtBalance ?? 0) > 0 && (<div style={{ background: 'rgba(39,174,96,0.1)', borderRadius: 8, padding: '5px 10px', fontSize: 12, color: '#27ae60' }}>💵 {selected.usdtBalance?.toFixed(4)} USDT</div>)}
          </div>
          {selected.kingdomName !== kingdom?.name && (<button className="btn" onClick={() => { if (selected.id) {
                setProfileId(selected.id);
                setSelected(null);
            } }} style={{ width: '100%', background: 'linear-gradient(135deg,#7b1515,#c0392b)', border: '1px solid #e74c3c', color: '#fff', padding: '11px', borderRadius: 10, fontWeight: 700 }}>
              {t('check_and_attack')}
            </button>)}
        </div>)}

      {profileId && (<KingdomProfileSheet_1.default kingdomId={profileId} attacking={attackingId === profileId} marchCountdown={marchCountdown} onClose={() => setProfileId(null)} onAttack={doAttack}/>)}

      {battle && (<div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, textAlign: 'center' }} onClick={() => setBattle(null)}>
          <div style={{ fontSize: 64 }}>{battle.attackerWins ? '🏆' : '💀'}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: battle.attackerWins ? '#f4d03f' : '#e74c3c' }}>{battle.attackerWins ? t('battle_win') : t('battle_loss')}</div>
          {battle.attackerWins && (<div style={{ background: 'rgba(244,208,63,0.1)', border: '1px solid rgba(244,208,63,0.3)', borderRadius: 12, padding: '10px 20px' }}>
              <div style={{ fontSize: 11, color: '#a0845a', marginBottom: 6 }}>{t('loot_label')}</div>
              <div style={{ display: 'flex', gap: 18, fontSize: 16, fontWeight: 700, flexWrap: 'wrap', justifyContent: 'center' }}>
                <span>💰 {(0, format_1.fmt)(battle.loot?.gold)}</span>
                <span>🪵 {(0, format_1.fmt)(battle.loot?.wood)}</span>
                <span>🪨 {(0, format_1.fmt)(battle.loot?.stone)}</span>
                {battle.loot?.usdt > 0 && <span style={{ color: '#27ae60' }}>💵 ${battle.loot.usdt.toFixed(4)}</span>}
              </div>
            </div>)}
          {battle.attackerLosses && Object.values(battle.attackerLosses).some((v) => v > 0) && (<div style={{ fontSize: 12, color: '#e74c3c' }}>{t('your_losses')} {Object.entries(battle.attackerLosses).filter(([, v]) => v > 0).map(([k, v]) => `${(0, format_1.fmt)(v)} ${t('u_' + k)}`).join(', ')}</div>)}
          <button className="btn btn-gold" style={{ marginTop: 8, padding: '12px 36px' }} onClick={() => setBattle(null)}>{t('continue_btn')}</button>
        </div>)}
    </div>);
}
//# sourceMappingURL=WorldMapScreen.js.map