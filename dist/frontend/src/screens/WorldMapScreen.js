"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = WorldMapScreen;
const react_1 = require("react");
const client_1 = require("../api/client");
const gameStore_1 = require("../store/gameStore");
const useT_1 = require("../i18n/useT");
const Countdown_1 = require("../components/Countdown");
const TILE_W = 72, TILE_H = 36, WALL_H = 10;
const MAP_R = 12;
const GRID = MAP_R * 2 + 1;
const CENTER = MAP_R;
function isoXY(gx, gy) {
    return { x: (gx - gy) * (TILE_W / 2), y: (gx + gy) * (TILE_H / 2) };
}
function tileTypeAt(gx, gy) {
    const dx = gx - CENTER, dy = gy - CENTER;
    const d = Math.max(Math.abs(dx), Math.abs(dy));
    if (d >= MAP_R)
        return 'water';
    if (d >= MAP_R - 1)
        return 'forest';
    if ((gx * 3 + gy * 7) % 11 === 0)
        return 'rock';
    if ((gx + gy * 2) % 8 === 0)
        return 'dirt';
    return 'grass';
}
const TERRAIN_COLORS = {
    grass: ['#4aaa28', '#2d6818', '#1a400c'],
    dirt: ['#c8a060', '#8a6030', '#503818'],
    rock: ['#7a7a80', '#4a4a58', '#2a2a38'],
    forest: ['#2a7a10', '#164008', '#0a2004'],
    water: ['#2a5890', '#183858', '#0c2038'],
};
const NODE_ICONS = {
    gold: '💰', wood: '🌲', stone: '⛏️', food: '🌾',
    magic: '✨', ogre: '👹', mage: '🧙', dwarf_fighter: '⚒️',
};
function WorldMapScreen() {
    const t = (0, useT_1.useT)();
    const { buildings, refresh } = (0, gameStore_1.useGameStore)();
    const canvasRef = (0, react_1.useRef)(null);
    const containerRef = (0, react_1.useRef)(null);
    const [mapData, setMapData] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [pan, setPan] = (0, react_1.useState)({ x: 0, y: 0 });
    const [zoom, setZoom] = (0, react_1.useState)(0.75);
    const [selected, setSelected] = (0, react_1.useState)(null);
    const [sendTarget, setSendTarget] = (0, react_1.useState)(null);
    const [actionMsg, setActionMsg] = (0, react_1.useState)('');
    const [hiring, setHiring] = (0, react_1.useState)(false);
    const [sending, setSending] = (0, react_1.useState)(false);
    const [tab, setTab] = (0, react_1.useState)('map');
    const hasAcademy = buildings?.some(b => b.type === 'academy') ?? false;
    async function load() {
        try {
            const data = await client_1.api.get('/exploration/map');
            setMapData(data);
        }
        catch {
            setMapData({ fogRadius: 0, academyLevel: 0, explorerCount: 0, maxExplorers: 0, nodes: [], activeMissions: [], returnedMissions: [], magic: 0 });
        }
        setLoading(false);
    }
    (0, react_1.useEffect)(() => { load(); }, []);
    const sceneMetrics = (0, react_1.useMemo)(() => {
        const corners = [isoXY(0, 0), isoXY(GRID, 0), isoXY(0, GRID), isoXY(GRID, GRID)];
        const minX = Math.min(...corners.map(c => c.x));
        const maxX = Math.max(...corners.map(c => c.x));
        const minY = Math.min(...corners.map(c => c.y));
        const maxY = Math.max(...corners.map(c => c.y)) + WALL_H;
        return { minX, minY, sceneW: maxX - minX + TILE_W, sceneH: maxY - minY + TILE_H };
    }, []);
    const panInitialized = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(() => {
        if (loading || panInitialized.current)
            return;
        panInitialized.current = true;
        const cw = containerRef.current?.clientWidth ?? 380;
        const ch = containerRef.current?.clientHeight ?? 400;
        const cp = isoXY(CENTER, CENTER);
        setPan({
            x: cw / 2 - (cp.x - sceneMetrics.minX + TILE_W / 2) * zoom,
            y: ch / 2 - (cp.y - sceneMetrics.minY + TILE_H / 2) * zoom - 20,
        });
    }, [loading]);
    (0, react_1.useEffect)(() => {
        if (loading || !canvasRef.current || !containerRef.current)
            return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        const cw = containerRef.current.clientWidth;
        const ch = containerRef.current.clientHeight;
        canvas.width = cw;
        canvas.height = ch;
        ctx.clearRect(0, 0, cw, ch);
        const fogR = mapData?.fogRadius ?? 0;
        const nodeMap = new Map();
        mapData?.nodes.forEach(n => nodeMap.set(`${n.x},${n.y}`, n));
        const missionSet = new Set(mapData?.activeMissions.map(m => `${m.targetX},${m.targetY}`));
        const tiles = [];
        for (let gy = 0; gy < GRID; gy++)
            for (let gx = 0; gx < GRID; gx++)
                tiles.push({ gx, gy });
        tiles.sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));
        for (const { gx, gy } of tiles) {
            const { x, y } = isoXY(gx, gy);
            const px = (x - sceneMetrics.minX) * zoom + pan.x;
            const py = (y - sceneMetrics.minY) * zoom + pan.y;
            const hw = TILE_W * zoom / 2;
            const hh = (TILE_H + WALL_H) * zoom;
            if (px + hw < 0 || px - hw > cw || py + hh < 0 || py - TILE_H * zoom > ch)
                continue;
            const tw = TILE_W * zoom, th = TILE_H * zoom, wh = WALL_H * zoom;
            const wxOff = gx - CENTER, wyOff = gy - CENTER;
            const dist = Math.sqrt(wxOff * wxOff + wyOff * wyOff);
            const fogged = dist > fogR;
            const type = tileTypeAt(gx, gy);
            const [topC, leftC, rightC] = fogged
                ? ['#050e04', '#030903', '#020602']
                : TERRAIN_COLORS[type];
            const cx = px + tw / 2, topY = py, midY = py + th / 2, botY = py + th;
            ctx.beginPath();
            ctx.moveTo(cx, botY);
            ctx.lineTo(px, midY);
            ctx.lineTo(px, midY + wh);
            ctx.lineTo(cx, botY + wh);
            ctx.closePath();
            ctx.fillStyle = leftC;
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx, botY);
            ctx.lineTo(px + tw, midY);
            ctx.lineTo(px + tw, midY + wh);
            ctx.lineTo(cx, botY + wh);
            ctx.closePath();
            ctx.fillStyle = rightC;
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx, topY);
            ctx.lineTo(px + tw, midY);
            ctx.lineTo(cx, botY);
            ctx.lineTo(px, midY);
            ctx.closePath();
            ctx.fillStyle = topC;
            ctx.fill();
            if (!fogged && type === 'forest') {
                ctx.font = `${Math.round(12 * zoom)}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🌲', cx, midY - 4 * zoom);
            }
            if (fogged && dist <= MAP_R - 0.5) {
                ctx.font = `${Math.round(8 * zoom)}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.globalAlpha = 0.12;
                ctx.fillText('🌑', cx, midY);
                ctx.globalAlpha = 1;
            }
            if (!fogged && missionSet.has(`${wxOff},${wyOff}`)) {
                ctx.beginPath();
                ctx.moveTo(cx, topY);
                ctx.lineTo(px + tw, midY);
                ctx.lineTo(cx, botY);
                ctx.lineTo(px, midY);
                ctx.closePath();
                ctx.fillStyle = 'rgba(244,208,63,0.3)';
                ctx.fill();
                ctx.font = `${Math.round(16 * zoom)}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText('🧭', cx, topY - 2 * zoom);
            }
            if (sendTarget && sendTarget.wx === wxOff && sendTarget.wy === wyOff) {
                ctx.beginPath();
                ctx.moveTo(cx, topY);
                ctx.lineTo(px + tw, midY);
                ctx.lineTo(cx, botY);
                ctx.lineTo(px, midY);
                ctx.closePath();
                ctx.fillStyle = 'rgba(244,208,63,0.45)';
                ctx.fill();
            }
            const node = nodeMap.get(`${wxOff},${wyOff}`);
            if (node?.discovered) {
                const icon = node.type === 'hero'
                    ? (NODE_ICONS[node.heroType] ?? '🦸')
                    : (NODE_ICONS[node.resourceType] ?? '📦');
                const isSelected = selected?.id === node.id;
                const r = 13 * zoom;
                const circleX = cx, circleY = topY - 4 * zoom;
                ctx.beginPath();
                ctx.arc(circleX, circleY, r, 0, Math.PI * 2);
                ctx.fillStyle = node.type === 'hero'
                    ? 'rgba(155,89,182,0.9)'
                    : node.type === 'rare_resource'
                        ? 'rgba(22,160,133,0.9)'
                        : 'rgba(184,134,11,0.9)';
                ctx.fill();
                if (isSelected) {
                    ctx.strokeStyle = '#f4d03f';
                    ctx.lineWidth = 2 * zoom;
                    ctx.stroke();
                }
                ctx.font = `${Math.round(12 * zoom)}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.globalAlpha = (!node.canRaid && node.type !== 'hero') ? 0.5 : 1;
                ctx.fillText(icon, circleX, circleY);
                ctx.globalAlpha = 1;
            }
        }
        const cp = isoXY(CENTER, CENTER);
        const cpx = (cp.x - sceneMetrics.minX) * zoom + pan.x + TILE_W * zoom / 2;
        const cpy = (cp.y - sceneMetrics.minY) * zoom + pan.y + TILE_H * zoom / 2;
        ctx.font = `${Math.round(28 * zoom)}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.shadowColor = 'rgba(244,208,63,0.7)';
        ctx.shadowBlur = 10 * zoom;
        ctx.fillText('🏰', cpx, cpy - TILE_H * zoom / 2);
        ctx.shadowBlur = 0;
    }, [loading, mapData, pan, zoom, selected, sendTarget]);
    function screenToTile(sx, sy) {
        const wx = (sx - pan.x) / zoom + sceneMetrics.minX;
        const wy = (sy - pan.y) / zoom + sceneMetrics.minY;
        const gx = Math.round((wx / (TILE_W / 2) + wy / (TILE_H / 2)) / 2);
        const gy = Math.round((wy / (TILE_H / 2) - wx / (TILE_W / 2)) / 2);
        if (gx < 0 || gy < 0 || gx >= GRID || gy >= GRID)
            return null;
        return { gx, gy };
    }
    const dragRef = (0, react_1.useRef)(null);
    const moved = (0, react_1.useRef)(false);
    const onPointerDown = (0, react_1.useCallback)((e) => {
        moved.current = false;
        dragRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
        e.currentTarget.setPointerCapture(e.pointerId);
    }, [pan]);
    const onPointerMove = (0, react_1.useCallback)((e) => {
        if (!dragRef.current)
            return;
        const dx = e.clientX - dragRef.current.sx;
        const dy = e.clientY - dragRef.current.sy;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4)
            moved.current = true;
        if (moved.current)
            setPan({ x: dragRef.current.px + dx, y: dragRef.current.py + dy });
    }, []);
    const onPointerUp = (0, react_1.useCallback)((e) => {
        if (!moved.current && dragRef.current) {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect)
                return;
            const sx = e.clientX - rect.left;
            const sy = e.clientY - rect.top;
            const tile = screenToTile(sx, sy);
            if (tile)
                handleTileClick(tile.gx, tile.gy);
        }
        dragRef.current = null;
    }, [pan, zoom, mapData, selected]);
    const onWheel = (0, react_1.useCallback)((e) => {
        e.preventDefault();
        setZoom(z => Math.max(0.3, Math.min(2.5, z * (e.deltaY > 0 ? 0.9 : 1.1))));
    }, []);
    function handleTileClick(gx, gy) {
        const wxOff = gx - CENTER, wyOff = gy - CENTER;
        const node = mapData?.nodes.find(n => n.x === wxOff && n.y === wyOff && n.discovered);
        const dist = Math.sqrt(wxOff * wxOff + wyOff * wyOff);
        const fogR = mapData?.fogRadius ?? 0;
        if (node) {
            setSelected(prev => prev?.id === node.id ? null : node);
            setSendTarget(null);
        }
        else if (dist > fogR && dist <= MAP_R - 1.5 && (mapData?.explorerCount ?? 0) > 0) {
            setSendTarget({ wx: wxOff, wy: wyOff });
            setSelected(null);
        }
        else {
            setSelected(null);
            setSendTarget(null);
        }
    }
    async function hireExplorer() {
        setHiring(true);
        try {
            const r = await client_1.api.post('/exploration/hire-explorer');
            showMsg(`✅ Explorer hired! (${r.explorerCount}/${r.maxExplorers})`);
            await load();
        }
        catch (e) {
            showMsg('❌ ' + (e.response?.data?.message || t('error')));
        }
        finally {
            setHiring(false);
        }
    }
    async function sendMission() {
        if (!sendTarget)
            return;
        setSending(true);
        try {
            const r = await client_1.api.post('/exploration/mission', { targetX: sendTarget.wx, targetY: sendTarget.wy });
            showMsg(`🧭 Explorer sent! Returns in ${r.hoursUntilReturn}h`);
            setSendTarget(null);
            await load();
        }
        catch (e) {
            showMsg('❌ ' + (e.response?.data?.message || t('error')));
        }
        finally {
            setSending(false);
        }
    }
    async function raidNode() {
        if (!selected)
            return;
        try {
            const r = await client_1.api.post(`/exploration/raid/${selected.id}`);
            const gained = Object.entries(r.gained).map(([k, v]) => `+${v} ${k}`).join(', ');
            showMsg(`✅ ${gained}`);
            setSelected(null);
            await Promise.all([load(), refresh()]);
        }
        catch (e) {
            showMsg('❌ ' + (e.response?.data?.message || t('error')));
        }
    }
    async function recruitHero() {
        if (!selected)
            return;
        try {
            await client_1.api.post(`/exploration/recruit/${selected.id}`);
            showMsg(`✅ ${selected.heroType} recruited!`);
            setSelected(null);
            await Promise.all([load(), refresh()]);
        }
        catch (e) {
            showMsg('❌ ' + (e.response?.data?.message || t('error')));
        }
    }
    function showMsg(m) {
        setActionMsg(m);
        setTimeout(() => setActionMsg(''), 4000);
    }
    const explorerCount = mapData?.explorerCount ?? 0;
    const maxExp = mapData?.maxExplorers ?? 0;
    const activeCount = mapData?.activeMissions?.filter(m => m.status === 'active').length ?? 0;
    const freeExplorers = explorerCount - activeCount;
    const academyLevel = mapData?.academyLevel ?? 0;
    if (loading)
        return (<div style={{ textAlign: 'center', paddingTop: 80, color: '#a0845a' }}>⏳ Loading map...</div>);
    return (<div className="screen" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>

      
      <div style={{ padding: '8px 14px', background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#f4d03f' }}>🗺️ Exploration Map</div>
          <div style={{ display: 'flex', gap: 10, fontSize: 12, color: '#a0845a' }}>
            {(mapData?.magic ?? 0) > 0 && <span>✨ {mapData.magic}</span>}
            <span>🧭 {freeExplorers}/{explorerCount}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['map', 'missions'].map(tb => (<button key={tb} onClick={() => setTab(tb)} style={{
                padding: '4px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                background: tab === tb ? 'rgba(244,208,63,0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${tab === tb ? 'rgba(244,208,63,0.5)' : 'rgba(255,255,255,0.08)'}`,
                color: tab === tb ? '#f4d03f' : '#555', cursor: 'pointer',
            }}>
              {tb === 'map' ? '🗺️ Map' : `🧭 Missions${activeCount > 0 ? ` (${activeCount})` : ''}`}
            </button>))}
        </div>
      </div>

      {actionMsg && (<div style={{ padding: '6px 14px', fontSize: 12, textAlign: 'center', background: actionMsg.startsWith('✅') ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)', color: actionMsg.startsWith('✅') ? '#27ae60' : '#e74c3c', flexShrink: 0 }}>
          {actionMsg}
        </div>)}

      {tab === 'map' && (<div ref={containerRef} style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#050e03', touchAction: 'none', userSelect: 'none' }}>
          <canvas ref={canvasRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={onWheel} style={{ display: 'block', width: '100%', height: '100%', cursor: 'grab' }}/>

          
          <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button onClick={() => setZoom(z => Math.min(2.5, z * 1.2))} style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>+</button>
            <button onClick={() => setZoom(z => Math.max(0.3, z * 0.83))} style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>−</button>
          </div>

          
          {!hasAcademy && (<div style={{ position: 'absolute', bottom: 16, left: 14, right: 14, background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(244,208,63,0.3)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#f4d03f', fontWeight: 700, marginBottom: 4 }}>🔒 בנה אקדמיה כדי לחקור</div>
              <div style={{ fontSize: 11, color: '#a0845a' }}>גייס חוקרים לגלות משאבים, גיבורים וקסם</div>
            </div>)}

          
          {sendTarget && (<div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(180deg,rgba(20,10,0,0.97),rgba(10,15,0,0.99))', borderTop: '1px solid rgba(244,208,63,0.3)', padding: 14 }}>
              <div style={{ fontSize: 13, color: '#f4d03f', fontWeight: 700, marginBottom: 4 }}>🧭 לשלוח חוקר לכאן?</div>
              <div style={{ fontSize: 11, color: '#a0845a', marginBottom: 10 }}>
                {(() => {
                    const dist = Math.sqrt(sendTarget.wx ** 2 + sendTarget.wy ** 2);
                    const hrs = Math.min(12, Math.max(1, Math.round(dist * 0.5)));
                    return `מרחק ${dist.toFixed(1)} · ~${hrs}ש' חזרה`;
                })()}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setSendTarget(null)} style={{ flex: 1, padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#888', fontSize: 13, cursor: 'pointer' }}>ביטול</button>
                <button onClick={sendMission} disabled={sending || freeExplorers === 0} style={{ flex: 2, padding: 10, borderRadius: 10, background: freeExplorers > 0 ? 'linear-gradient(135deg,#f39c12,#f4d03f)' : 'rgba(255,255,255,0.06)', border: 'none', color: freeExplorers > 0 ? '#000' : '#555', fontWeight: 900, fontSize: 14, cursor: freeExplorers > 0 ? 'pointer' : 'not-allowed' }}>
                  {sending ? '...' : freeExplorers > 0 ? '🧭 שלח!' : 'אין חוקרים פנויים'}
                </button>
              </div>
            </div>)}

          
          {selected && !sendTarget && (<div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(180deg,rgba(20,10,0,0.97),rgba(10,15,0,0.99))', borderTop: '1px solid rgba(244,208,63,0.3)', padding: 14 }}>
              {selected.type === 'hero' ? (<>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#9b59b6', marginBottom: 4 }}>{NODE_ICONS[selected.heroType] ?? '🦸'} {selected.heroType?.replace('_', ' ')} התגלה!</div>
                  <div style={{ fontSize: 11, color: '#a0845a', marginBottom: 10 }}>גייס גיבור אגדי לצבאך</div>
                  <button onClick={recruitHero} style={{ width: '100%', padding: 10, borderRadius: 10, background: 'linear-gradient(135deg,#8e44ad,#9b59b6)', border: 'none', color: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer' }}>⚔️ גייס</button>
                </>) : (<>
                  <div style={{ fontSize: 14, fontWeight: 900, color: selected.type === 'rare_resource' ? '#16a085' : '#b8860b', marginBottom: 4 }}>
                    {NODE_ICONS[selected.resourceType] ?? '📦'} {selected.resourceType} · ~{selected.amount?.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: '#a0845a', marginBottom: 10 }}>
                    קולדאון: {selected.raidCooldownDays}י׳
                    {selected.lastRaidedAt && !selected.canRaid && (<> · <Countdown_1.default endsAt={new Date(new Date(selected.lastRaidedAt).getTime() + selected.raidCooldownDays * 86400000).toISOString()} onEnd={load}/></>)}
                  </div>
                  <button onClick={selected.canRaid ? raidNode : undefined} disabled={!selected.canRaid} style={{ width: '100%', padding: 10, borderRadius: 10, background: selected.canRaid ? 'linear-gradient(135deg,#f39c12,#f4d03f)' : 'rgba(255,255,255,0.08)', border: 'none', color: selected.canRaid ? '#000' : '#555', fontWeight: 900, fontSize: 14, cursor: selected.canRaid ? 'pointer' : 'not-allowed' }}>
                    {selected.canRaid ? '⚔️ תקוף!' : '⏳ קולדאון פעיל'}
                  </button>
                </>)}
              <button onClick={() => setSelected(null)} style={{ width: '100%', marginTop: 8, padding: '6px', background: 'none', border: 'none', color: '#555', fontSize: 12, cursor: 'pointer' }}>סגור</button>
            </div>)}
        </div>)}

      {tab === 'missions' && (<div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          
          <div style={{ background: 'linear-gradient(135deg,rgba(39,174,96,0.1),rgba(26,138,64,0.05))', border: '1px solid rgba(39,174,96,0.25)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#27ae60', marginBottom: 8 }}>🧭 חוקרים</div>
            <div style={{ fontSize: 12, color: '#a0845a', marginBottom: 8 }}>
              מגויסים: <strong>{explorerCount}</strong> / מקסימום: <strong>{academyLevel > 0 ? maxExp : '—'}</strong>
              {!hasAcademy && <span style={{ color: '#e74c3c' }}> · בנה אקדמיה תחילה</span>}
            </div>
            {explorerCount < maxExp && academyLevel > 0 && (<button onClick={hireExplorer} disabled={hiring} style={{ width: '100%', padding: 10, borderRadius: 10, background: 'linear-gradient(135deg,#27ae60,#1e8449)', border: 'none', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                {hiring ? '...' : '➕ גייס חוקר (200💰 + 20💎)'}
              </button>)}
            {explorerCount >= maxExp && maxExp > 0 && (<div style={{ fontSize: 11, color: '#27ae60', textAlign: 'center' }}>✅ מקסימום חוקרים · שדרג אקדמיה לעוד</div>)}
          </div>

          {activeCount > 0 && <>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#f4d03f', marginBottom: 8 }}>⏳ פעילות</div>
            {mapData.activeMissions.map(m => (<div key={m.id} style={{ background: 'rgba(244,208,63,0.07)', border: '1px solid rgba(244,208,63,0.2)', borderRadius: 12, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: '#f4d03f' }}>🧭 ({m.targetX}, {m.targetY})</div>
                <div style={{ fontSize: 11, color: '#a0845a', marginTop: 2 }}>חוזר: <Countdown_1.default endsAt={m.returnsAt} onEnd={load}/></div>
              </div>))}
          </>}

          {(mapData?.returnedMissions.length ?? 0) > 0 && <>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#27ae60', marginBottom: 8, marginTop: 12 }}>✅ הושלמו</div>
            {mapData.returnedMissions.map(m => (<div key={m.id} style={{ background: 'rgba(39,174,96,0.07)', border: '1px solid rgba(39,174,96,0.15)', borderRadius: 12, padding: '10px 12px', marginBottom: 8, opacity: 0.8 }}>
                <div style={{ fontSize: 12, color: '#27ae60' }}>✅ ({m.targetX}, {m.targetY})</div>
                <div style={{ fontSize: 11, color: '#a0845a', marginTop: 2 }}>{(m.discoveredNodeIds?.length ?? 0) > 0 ? `🔍 ${m.discoveredNodeIds.length} צמתים נמצאו` : '🔍 לא נמצא חדש'}</div>
              </div>))}
          </>}

          {explorerCount === 0 && academyLevel === 0 && (<div style={{ textAlign: 'center', color: '#666', paddingTop: 40, fontSize: 12 }}>בנה אקדמיה → גייס חוקרים → גלה את העולם</div>)}
        </div>)}
    </div>);
}
//# sourceMappingURL=WorldMapScreen.js.map