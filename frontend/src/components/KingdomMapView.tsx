import { useRef, useState, useCallback, useEffect, useMemo } from 'react';

// ── Constants (mirrored from HomeScreen) ─────────────────────────────
const B: Record<string, { icon: string; top: string; left: string; right: string; glow: string }> = {
  town_hall:    { icon:'🏛️', top:'#c8a040', left:'#7a5c18', right:'#4a3808', glow:'rgba(200,160,64,0.8)'  },
  gold_mine:    { icon:'⛏️', top:'#d4a820', left:'#8a6010', right:'#5a3808', glow:'rgba(212,168,32,0.7)'  },
  lumber_mill:  { icon:'🪵', top:'#5a8c30', left:'#2c5018', right:'#183008', glow:'rgba(90,140,48,0.7)'   },
  stone_quarry: { icon:'🪨', top:'#808890', left:'#505860', right:'#303840', glow:'rgba(128,136,144,0.6)' },
  farm:         { icon:'🌾', top:'#78c030', left:'#407818', right:'#285008', glow:'rgba(120,192,48,0.7)'  },
  barracks:     { icon:'⚔️', top:'#c03030', left:'#781818', right:'#480808', glow:'rgba(192,48,48,0.7)'   },
  academy:      { icon:'📚', top:'#9050c8', left:'#502878', right:'#300858', glow:'rgba(144,80,200,0.7)'  },
  wall:         { icon:'🧱', top:'#909090', left:'#585858', right:'#383838', glow:'rgba(144,144,144,0.6)' },
  watch_tower:  { icon:'🗼', top:'#3090d8', left:'#185888', right:'#083058', glow:'rgba(48,144,216,0.7)'  },
  hospital:     { icon:'🏥', top:'#e74c3c', left:'#922b21', right:'#641e16', glow:'rgba(231,76,60,0.7)'   },
  arcane_tower: { icon:'🔮', top:'#9b59b6', left:'#5b2c6f', right:'#3a1a45', glow:'rgba(155,89,182,0.7)' },
  gem_forge:    { icon:'💎', top:'#1aafbf', left:'#0d7080', right:'#074850', glow:'rgba(26,175,191,0.7)'  },
};

const GRID = 16;
const TILE_W = 68, TILE_H = 40;

const LAYOUT: Record<string, { gx: number; gy: number; size?: number }> = {
  town_hall:    { gx: 7,  gy: 7,  size: 2 },
  barracks:     { gx: 5,  gy: 3  },
  academy:      { gx: 3,  gy: 5  },
  wall:         { gx: 8,  gy: 2  },
  watch_tower:  { gx: 11, gy: 3  },
  hospital:     { gx: 13, gy: 5  },
  stone_quarry: { gx: 3,  gy: 8  },
  gold_mine:    { gx: 3,  gy: 11 },
  farm:         { gx: 12, gy: 8  },
  lumber_mill:  { gx: 12, gy: 11 },
  arcane_tower: { gx: 6,  gy: 14 },
  gem_forge:    { gx: 9,  gy: 14 },
};

const EXTRA_POSITIONS: Record<string, Array<{ gx: number; gy: number }>> = {
  gold_mine:    [{ gx:2,gy:11 },{ gx:3,gy:12 },{ gx:2,gy:12 },{ gx:3,gy:13 },{ gx:2,gy:13 }],
  stone_quarry: [{ gx:2,gy:8  },{ gx:3,gy:9  },{ gx:2,gy:9  },{ gx:3,gy:10 },{ gx:2,gy:10 }],
  lumber_mill:  [{ gx:13,gy:11},{ gx:12,gy:12},{ gx:13,gy:12},{ gx:12,gy:13},{ gx:13,gy:13}],
  farm:         [{ gx:13,gy:8 },{ gx:12,gy:9 },{ gx:13,gy:9 },{ gx:12,gy:10},{ gx:13,gy:10}],
  gem_forge:    [{ gx:8,gy:14 },{ gx:10,gy:14}],
};

function isoXY(gx: number, gy: number) {
  return { x: (gx - gy) * (TILE_W / 2), y: (gx + gy) * (TILE_H / 2) };
}

const V = '?v=3';
function buildingImg(type: string, level: number): string | null {
  switch (type) {
    case 'town_hall':    return (level >= 10 ? '/assets/building_town_hall_10.png' : level >= 5 ? '/assets/building_town_hall_5.png' : '/assets/building_town_hall_1.png') + V;
    case 'gold_mine':    return '/assets/building_gold_mine.png' + V;
    case 'lumber_mill':  return '/assets/building_lumber_mill.png' + V;
    case 'stone_quarry': return '/assets/building_stone_quarry.png' + V;
    case 'farm':         return '/assets/building_farm.png' + V;
    case 'barracks':     return '/assets/building_barracks.png' + V;
    case 'academy':      return '/assets/building_academy.png' + V;
    case 'wall':         return '/assets/building_wall.png' + V;
    case 'watch_tower':  return '/assets/building_watch_tower.png' + V;
    case 'hospital':     return '/assets/building_hospital.png' + V;
    case 'arcane_tower': return '/assets/building_arcane.png' + V;
    case 'gem_forge':    return '/assets/building_gem_forge.png' + V;
    default:             return null;
  }
}

// ── Props ─────────────────────────────────────────────────────────────
interface Props {
  buildings: { type: string; level: number }[];
  name: string;
  onClose: () => void;
}

export default function KingdomMapView({ buildings, name, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgImgRef = useRef<HTMLVideoElement>(null);
  const groundImgRef = useRef<HTMLImageElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.4);
  const isDragging = useRef(false);
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const lastPinchDist = useRef<number | null>(null);

  // Compute scene bounds
  const allCorners = [isoXY(0, 0), isoXY(GRID, 0), isoXY(0, GRID), isoXY(GRID, GRID)];
  const minX = Math.min(...allCorners.map(c => c.x)) - TILE_W;
  const maxX = Math.max(...allCorners.map(c => c.x)) + TILE_W;
  const minY = Math.min(...allCorners.map(c => c.y)) - TILE_H;
  const maxY = Math.max(...allCorners.map(c => c.y)) + TILE_H + 120;
  const sceneW = maxX - minX;
  const sceneH = maxY - minY;

  // Assign positions: count each type to pick primary vs extra slot
  const positionedBuildings = useMemo(() => {
    const typeCount: Record<string, number> = {};
    return buildings
      .filter(b => LAYOUT[b.type])
      .map(b => {
        const slot = typeCount[b.type] ?? 0;
        typeCount[b.type] = slot + 1;
        const base = slot > 0 && EXTRA_POSITIONS[b.type] ? (EXTRA_POSITIONS[b.type][slot - 1] ?? LAYOUT[b.type]) : LAYOUT[b.type];
        const sz = base.size ?? 1;
        return { ...b, gx: base.gx, gy: base.gy, size: sz };
      })
      .sort((a, b) => (a.gx + a.gy + (a as any).size) - (b.gx + b.gy + (b as any).size));
  }, [buildings]);

  const wallLevel = buildings.find(b => b.type === 'wall')?.level ?? 0;
  const wallH = wallLevel > 0 ? Math.min(14 + wallLevel * 3, 40) : 0;

  const wallSegments = useMemo(() => {
    if (!wallLevel) return [];
    const segs: Array<{ gx: number; gy: number; side: 'SE' | 'SW' | 'NE' | 'NW' }> = [];
    for (let g = 0; g < GRID; g++) {
      segs.push({ gx: GRID - 1, gy: g,       side: 'SE' });
      segs.push({ gx: g,        gy: GRID - 1, side: 'SW' });
      segs.push({ gx: g,        gy: 0,        side: 'NE' });
      segs.push({ gx: 0,        gy: g,        side: 'NW' });
    }
    return segs;
  }, [wallLevel]);

  // Video bounds in scene coords (map_gb.mp4: 3:4 ratio, width 1300 → height 1733)
  const BG = { left: -40, top: -507, right: 1260, bottom: 1226 } as const;
  const zoomRef = useRef(1);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  useEffect(() => {
    if (bgImgRef.current) {
      bgImgRef.current.style.transform = `translate(${pan.x + (-40) * zoom}px, ${pan.y + (-507) * zoom}px) scale(${zoom})`;
      bgImgRef.current.play().catch(() => {});
    }
    if (groundImgRef.current)
      groundImgRef.current.style.transform = `translate(${pan.x + 68 * zoom}px, ${pan.y + 40 * zoom}px) scale(${zoom})`;
  }, [pan, zoom]);

  const clampPan = useCallback((x: number, y: number, z: number) => {
    const cw = containerRef.current?.clientWidth  ?? window.innerWidth;
    const ch = containerRef.current?.clientHeight ?? window.innerHeight;
    return {
      x: Math.max(cw  - BG.right  * z, Math.min(-BG.left  * z, x)),
      y: Math.max(ch  - BG.bottom * z, Math.min(-BG.top   * z, y)),
    };
  }, []);

  // Center on town hall on mount
  useEffect(() => {
    const containerW = containerRef.current?.clientWidth ?? window.innerWidth;
    const containerH = containerRef.current?.clientHeight ?? 400;
    const th = LAYOUT.town_hall;
    const thPos = isoXY(th.gx + 1, th.gy + 1);
    const initZ = 0.4;
    setPan(clampPan(
      containerW / 2 - (thPos.x - minX) * initZ,
      containerH / 2 - (thPos.y - minY) * initZ - 40,
      initZ,
    ));
  }, [clampPan]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = false;
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [pan]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) isDragging.current = true;
    if (isDragging.current) {
      setPan(clampPan(dragRef.current.panX + dx, dragRef.current.panY + dy, zoomRef.current));
    }
  }, [clampPan]);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
    lastPinchDist.current = null;
    setTimeout(() => { isDragging.current = false; }, 10);
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const newZ = Math.max(0.4, Math.min(3, zoom - e.deltaY * 0.001));
    setZoom(newZ);
    setPan(p => clampPan(p.x, p.y, newZ));
  }, [zoom, clampPan]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastPinchDist.current !== null) {
        const delta = dist - lastPinchDist.current;
        const newZ = Math.max(0.4, Math.min(3, zoom + delta * 0.005));
        setZoom(newZ);
        setPan(p => clampPan(p.x, p.y, newZ));
      }
      lastPinchDist.current = dist;
    }
  }, [zoom, clampPan]);

  const wc = wallLevel <= 3
    ? { se: '#7a4a20', sw: '#9a6030', ne: '#c88840', nw: '#b07038', top: '#d4a060', mortar: '#5a3818' }
    : wallLevel <= 6
    ? { se: '#484840', sw: '#606058', ne: '#989088', nw: '#808078', top: '#b0a898', mortar: '#2a2a2a' }
    : { se: '#2e2e2e', sw: '#464646', ne: '#727070', nw: '#5a5a5a', top: '#909090', mortar: '#181818' };

  const bg = (col: string) =>
    `repeating-linear-gradient(to bottom, ${col} 0px, ${col} 5px, ${wc.mortar} 5px, ${wc.mortar} 6px)`;

  const showMerlons = wallLevel >= 5;
  const W = TILE_W / 2;
  const TH = TILE_H;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', background: '#060e06' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'rgba(0,0,0,0.8)', borderBottom: '1px solid rgba(244,208,63,0.2)', flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#f4d03f' }}>🏰 {name}</div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#aaa', fontSize: 20, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>

      {/* Map */}
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onTouchMove={onTouchMove}
        style={{ flex: 1, overflow: 'hidden', position: 'relative', cursor: isDragging.current ? 'grabbing' : 'grab', background: 'radial-gradient(ellipse at 50% 40%, #0f2a0a 0%, #060e06 70%)', touchAction: 'none', userSelect: 'none' }}
      >
        {/* Zoom controls */}
        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 400, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button onClick={() => { const nz = Math.min(3, zoom + 0.2); setZoom(nz); setPan(p => clampPan(p.x, p.y, nz)); }} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          <button onClick={() => { const nz = Math.max(0.4, zoom - 0.2); setZoom(nz); setPan(p => clampPan(p.x, p.y, nz)); }} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
        </div>

        {/* Video background — outside scene to avoid scale flicker */}
        <video ref={bgImgRef} autoPlay loop muted playsInline
          style={{ position: 'absolute', top: 0, left: 0, width: 1300, pointerEvents: 'none', zIndex: 0, transformOrigin: '0 0' }}>
          <source src="/assets/map_gb.mp4" type="video/mp4" />
        </video>

        {/* Ground floor — outside scene to avoid drag flicker */}
        <img ref={groundImgRef} src="/assets/map_ground.png" alt=""
          style={{ position: 'absolute', top: 0, left: 0, width: 1088, height: 640, pointerEvents: 'none', zIndex: 1, transformOrigin: '0 0' }} />

        {/* Vignette */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.65) 100%)', pointerEvents: 'none', zIndex: 300 }} />

        {/* Scene */}
        <div style={{ position: 'absolute', left: pan.x, top: pan.y, width: sceneW, height: sceneH, willChange: 'transform', transform: `scale(${zoom})`, transformOrigin: '0 0', zIndex: 2 }}>

          {/* Walls */}
          {wallLevel > 0 && wallSegments.flatMap(({ gx, gy, side }) => {
            const { x, y } = isoXY(gx, gy);
            const px = x - minX;
            const py = y - minY;
            const els: React.ReactNode[] = [];
            if (side === 'SE') {
              const z = 108 + gx + gy;
              els.push(
                <div key={`wSE-${gx}-${gy}`} style={{ position:'absolute', left:px, top:py+TH-wallH, width:W, height:wallH, background:bg(wc.se), transform:'skewY(-30.4deg)', transformOrigin:'bottom left', zIndex:z, pointerEvents:'none' }} />,
                <div key={`wSE-cap-${gx}-${gy}`} style={{ position:'absolute', left:px, top:py+TH-wallH-3, width:W, height:3, background:wc.top, transform:'skewY(-30.4deg)', transformOrigin:'bottom left', zIndex:z+1, pointerEvents:'none' }} />,
              );
              if (showMerlons) [6, 20].forEach((ox, i) => els.push(
                <div key={`wSE-m${i}-${gx}-${gy}`} style={{ position:'absolute', left:px+ox, top:py+TH-wallH-7, width:9, height:7, background:wc.top, transform:'skewY(-30.4deg)', transformOrigin:'bottom left', zIndex:z+2, pointerEvents:'none' }} />
              ));
            } else if (side === 'SW') {
              const z = 108 + gx + gy;
              els.push(
                <div key={`wSW-${gx}-${gy}`} style={{ position:'absolute', left:px-W, top:py+TH-wallH, width:W, height:wallH, background:bg(wc.sw), transform:'skewY(30.4deg)', transformOrigin:'bottom right', zIndex:z, pointerEvents:'none' }} />,
                <div key={`wSW-cap-${gx}-${gy}`} style={{ position:'absolute', left:px-W, top:py+TH-wallH-3, width:W, height:3, background:wc.top, transform:'skewY(30.4deg)', transformOrigin:'bottom right', zIndex:z+1, pointerEvents:'none' }} />,
              );
              if (showMerlons) [6, 20].forEach((ox, i) => els.push(
                <div key={`wSW-m${i}-${gx}-${gy}`} style={{ position:'absolute', left:px-W+ox, top:py+TH-wallH-7, width:9, height:7, background:wc.top, transform:'skewY(30.4deg)', transformOrigin:'bottom right', zIndex:z+2, pointerEvents:'none' }} />
              ));
            } else if (side === 'NE') {
              const z = 105 + gx + gy;
              els.push(
                <div key={`wNE-${gx}-${gy}`} style={{ position:'absolute', left:px, top:py-wallH, width:W, height:wallH, background:bg(wc.ne), transform:'skewY(30.4deg)', transformOrigin:'bottom left', zIndex:z, pointerEvents:'none' }} />,
                <div key={`wNE-cap-${gx}-${gy}`} style={{ position:'absolute', left:px, top:py-wallH-3, width:W, height:3, background:wc.top, transform:'skewY(30.4deg)', transformOrigin:'bottom left', zIndex:z+1, pointerEvents:'none' }} />,
              );
            } else if (side === 'NW') {
              const z = 105 + gx + gy;
              els.push(
                <div key={`wNW-${gx}-${gy}`} style={{ position:'absolute', left:px-W, top:py-wallH, width:W, height:wallH, background:bg(wc.nw), transform:'skewY(-30.4deg)', transformOrigin:'bottom right', zIndex:z, pointerEvents:'none' }} />,
                <div key={`wNW-cap-${gx}-${gy}`} style={{ position:'absolute', left:px-W, top:py-wallH-3, width:W, height:3, background:wc.top, transform:'skewY(-30.4deg)', transformOrigin:'bottom right', zIndex:z+1, pointerEvents:'none' }} />,
              );
            }
            return els;
          })}

          {/* Buildings */}
          {positionedBuildings.map((b, idx) => {
            const cfg = B[b.type];
            if (!cfg) return null;
            const sz = b.size;
            const { x, y } = isoXY(b.gx, b.gy);
            const px = x - minX;
            const py = y - minY;
            const tW = TILE_W * sz;
            const tH = TILE_H * sz;
            const BODY = sz === 2 ? 42 : 30;
            const imgW = sz === 2 ? 222 : 144;
            const imgH = imgW;
            const imgTop = sz === 2 ? -135 : -93;
            const vOff = Math.abs(imgTop);
            const imgSrc = buildingImg(b.type, b.level);

            return (
              <div
                key={idx}
                style={{ position:'absolute', left:px - imgW/2 + 10, top:py + imgTop - BODY + 10, width:imgW-20, height:imgH-20, zIndex:200 + b.gx + b.gy + sz*10, pointerEvents:'none' }}
              >
                {imgSrc ? (
                  <img src={imgSrc} alt={b.type} style={{ position:'absolute', width:imgW, height:imgH, left:-10, top:-10, pointerEvents:'none', objectFit:'contain', filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.9))' }} />
                ) : (
                  <>
                    <div style={{ position:'absolute', left:-10, top:vOff+tH/2-10, width:tW/2, height:BODY, background:`linear-gradient(180deg,${cfg.left},${cfg.right})`, transform:'skewY(30.4deg)', transformOrigin:'top left' }} />
                    <div style={{ position:'absolute', right:-10, top:vOff+tH/2-10, width:tW/2, height:BODY, background:`linear-gradient(180deg,${cfg.right},rgba(0,0,0,0.85))`, transform:'skewY(-30.4deg)', transformOrigin:'top right' }} />
                    <div style={{ position:'absolute', left:-10, top:vOff-10, width:tW, height:tH, clipPath:'polygon(50% 0%,100% 50%,50% 100%,0% 50%)', background:`radial-gradient(ellipse at 38% 28%,${cfg.top},${cfg.left})`, boxShadow:`0 0 8px ${cfg.glow}55`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontSize:sz===2?26:17, filter:'drop-shadow(0 2px 3px rgba(0,0,0,0.95))', paddingTop:tH*0.18 }}>{cfg.icon}</span>
                    </div>
                  </>
                )}
                {/* Level badge */}
                <div style={{ position:'absolute', bottom:-4, right:-4, background:'rgba(0,0,0,0.85)', border:'1px solid rgba(244,208,63,0.5)', borderRadius:6, padding:'1px 5px', fontSize:9, fontWeight:700, color:'#f4d03f', zIndex:10, pointerEvents:'none' }}>
                  {b.level}
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}
