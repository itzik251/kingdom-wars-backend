import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { useT } from '../i18n/useT';
import Countdown from '../components/Countdown';
import { ResIcon } from '../components/ResIcon';

// ── Types ────────────────────────────────────────────────────────────────────
interface MapNode {
  id: string; x: number; y: number;
  type: 'resource' | 'rare_resource' | 'hero';
  resourceType?: string; amount?: number; heroType?: string;
  discovered: boolean; lastRaidedAt?: string;
  raidCooldownDays: number; canRaid: boolean;
}
interface Mission {
  id: string; targetX: number; targetY: number;
  distance: number; returnsAt: string; status: string;
  discoveredNodeIds?: string[];
}
interface MapData {
  fogRadius: number; academyLevel: number;
  explorerCount: number; maxExplorers: number;
  explorerTrainingEndsAt: string | null;
  explorerTrainingCount: number;
  trainingQueue: string[];
  nodes: MapNode[]; activeMissions: Mission[];
  returnedMissions: Mission[]; magic: number;
}

// ── World → canvas coordinate mapping ────────────────────────────────────────
// World coords: center=0,0  range ≈ -12..+12
// Map image: drawn to fill canvas, centered
const MAP_R = 22;        // world radius (matches generateKingdomMap MAP_RADIUS)
const WORLD_SCALE = 22;  // pixels per world unit (at zoom=1)

// Icon images
const ICON_SRCS: Record<string, string> = {
  gold:  '/assets/icon_gold.png',
  wood:  '/assets/icon_wood.png',
  stone: '/assets/icon_stone.png',
  food:  '/assets/icon_food.png',
  magic: '/assets/icon_gem.png',
  kingdom_1:  '/assets/building_town_hall_1.png',
  kingdom_5:  '/assets/building_town_hall_5.png',
  kingdom_10: '/assets/building_town_hall_10.png',
};
const NODE_EMOJI: Record<string, string> = {
  gold:'💰', wood:'🌲', stone:'⛏️', food:'🌾', magic:'✨',
  ogre:'👹', mage:'🔮', dwarf_fighter:'⚒️',
};
const HERO_GEM_COST: Record<string, number> = {
  ogre: 150, mage: 180, dwarf_fighter: 120,
};

const loadedImgs: Record<string, HTMLImageElement> = {};
function preload(srcs: Record<string, string>, cb: () => void) {
  const keys = Object.keys(srcs);
  let n = keys.length;
  if (n === 0) { cb(); return; }
  keys.forEach(k => {
    if (loadedImgs[k]) { if (--n === 0) cb(); return; }
    const img = new Image();
    img.onload = img.onerror = () => { loadedImgs[k] = img; if (--n === 0) cb(); };
    img.src = srcs[k];
  });
}

function kingdomKey(lvl: number) {
  return lvl >= 10 ? 'kingdom_10' : lvl >= 5 ? 'kingdom_5' : 'kingdom_1';
}

function HeroNodePanel({ heroType, alreadyRecruited, onRecruit, t }: {
  heroType: string; alreadyRecruited: boolean; onRecruit: () => void; t: (k: string, v?: Record<string,string|number>) => string;
}) {
  const heroName = t('u_' + heroType);
  const gemCost = HERO_GEM_COST[heroType] ?? 150;
  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 900, color: '#9b59b6', marginBottom: 4 }}>{NODE_EMOJI[heroType] ?? '🦸'} {t('hero_node_discovered', { hero: heroName })}</div>
      <div style={{ fontSize: 11, color: '#a0845a', marginBottom: 10 }}>{t('hero_recruit_cost', { n: gemCost })}</div>
      {alreadyRecruited
        ? <div style={{ width: '100%', padding: 10, borderRadius: 10, background: 'rgba(39,174,96,0.2)', border: '1px solid #27ae60', color: '#27ae60', fontWeight: 900, fontSize: 13, textAlign: 'center' }}>{t('hero_already_recruited', { hero: heroName })}</div>
        : <button onClick={onRecruit} style={{ width: '100%', padding: 10, borderRadius: 10, background: 'linear-gradient(135deg,#8e44ad,#9b59b6)', border: 'none', color: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer' }}>{t('hero_recruit_btn', { n: gemCost })}</button>
      }
    </>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
export default function WorldMapScreen() {
  const t = useT();
  const { buildings, refresh, units, kingdom } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgsReady, setImgsReady] = useState(false);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<MapNode | null>(null);
  const [sendTarget, setSendTarget] = useState<{ wx: number; wy: number } | null>(null);
  const [actionMsg, setActionMsg] = useState('');
  const [hiring, setHiring] = useState(false);
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<'map' | 'missions'>('map');
  const [fogMsg, setFogMsg] = useState('');

  const hasAcademy = buildings?.some(b => b.type === 'academy') ?? false;
  const thLevel = buildings?.find(b => b.type === 'town_hall')?.level ?? 1;

  async function load() {
    try {
      const data = await api.get('/exploration/map');
      setMapData(data);
    } catch {
      setMapData({ fogRadius: 0, academyLevel: 0, explorerCount: 0, maxExplorers: 0, explorerTrainingEndsAt: null, explorerTrainingCount: 0, trainingQueue: [], nodes: [], activeMissions: [], returnedMissions: [], magic: 0 });
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // preload map bg + icons
    const mapImg = new Image();
    mapImg.onload = mapImg.onerror = () => {
      loadedImgs['__map'] = mapImg;
      preload(ICON_SRCS, () => setImgsReady(true));
    };
    mapImg.src = '/assets/map_v2.png';
  }, []);

  // Center on load
  const centered = useRef(false);
  useEffect(() => {
    if (loading || centered.current || !containerRef.current) return;
    centered.current = true;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    setPan({ x: cw / 2, y: ch / 2 });
    // auto-fit zoom accounting for the /1.5 scale factor applied during draw
    const mapImg = loadedImgs['__map'];
    if (mapImg) {
      const fw = cw / (mapImg.naturalWidth);
      const fh = ch / (mapImg.naturalHeight);
      setZoom(Math.min(fw, fh, 1) * 0.98 * 3.6);
    }
  }, [loading, imgsReady]);

  // Scale factors: world ±MAP_R maps to ±half of map image in pixels
  const _mapImg = loadedImgs['__map'];
  const _mw = _mapImg?.naturalWidth  || 1016;
  const _mh = _mapImg?.naturalHeight || 601;
  const wsX = (_mw / 1.5) / (2 * MAP_R);  // px per world unit (x)
  const wsY = (_mh / 1.5) / (2 * MAP_R);  // px per world unit (y)

  // World coord → canvas pixel
  function w2s(wx: number, wy: number) {
    return {
      sx: pan.x + wx * wsX * zoom,
      sy: pan.y + wy * wsY * zoom,
    };
  }

  // Canvas pixel → world coord
  function s2w(sx: number, sy: number) {
    return {
      wx: (sx - pan.x) / (wsX * zoom),
      wy: (sy - pan.y) / (wsY * zoom),
    };
  }

  // ── Draw ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    if (!cw || !ch) return;
    canvas.width = cw;
    canvas.height = ch;
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    ctx.clearRect(0, 0, cw, ch);

    const mapImg = loadedImgs['__map'];
    const fogR = mapData?.fogRadius ?? 0;

    // ── Background map image ──────────────────────────────────────────────
    if (mapImg?.complete && mapImg.naturalWidth > 0) {
      const iw = mapImg.naturalWidth * zoom / 1.5;
      const ih = mapImg.naturalHeight * zoom / 1.5;
      ctx.drawImage(mapImg, pan.x - iw / 2, pan.y - ih / 2, iw, ih);
    } else {
      // fallback solid bg
      ctx.fillStyle = '#1a3010';
      ctx.fillRect(0, 0, cw, ch);
    }

    // ── Active mission targets (drawn before fog so fog covers faraway ones) ─
    mapData?.activeMissions.forEach(m => {
      const { sx, sy } = w2s(m.targetX, m.targetY);
      const r = 14 * zoom;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(244,208,63,0.25)'; ctx.fill();
      ctx.strokeStyle = '#f4d03f'; ctx.lineWidth = 1.5 * zoom; ctx.stroke();
      ctx.font = `${Math.round(14 * zoom)}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🧭', sx, sy);
    });

    // ── Discovered nodes (drawn BEFORE fog — only visible if in clear zone) ─
    mapData?.nodes.filter(n => n.discovered).forEach(n => {
      const { sx, sy } = w2s(n.x, n.y);
      const isSelected = selected?.id === n.id;
      const r = 13 * zoom;
      const iconKey = n.type !== 'hero' ? (n.resourceType ?? null) : null;
      const img = iconKey ? loadedImgs[iconKey] : null;

      if (isSelected) {
        ctx.shadowColor = '#f4d03f'; ctx.shadowBlur = 14 * zoom;
      }

      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = n.type === 'hero'
        ? 'rgba(100,40,160,0.92)'
        : n.type === 'rare_resource' ? 'rgba(10,120,100,0.92)' : 'rgba(130,90,10,0.92)';
      ctx.globalAlpha = (!n.canRaid && n.type !== 'hero') ? 0.55 : 1;
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#f4d03f' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = isSelected ? 2.5 * zoom : 1 * zoom;
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (img) {
        const s = r * 1.4;
        ctx.save();
        ctx.beginPath(); ctx.arc(sx, sy, r - zoom * 0.5, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(img, sx - s / 2, sy - s / 2, s, s);
        ctx.restore();
      } else {
        const emoji = n.type === 'hero' ? (NODE_EMOJI[n.heroType!] ?? '🦸') : (NODE_EMOJI[n.resourceType!] ?? '📦');
        ctx.font = `${Math.round(11 * zoom)}px serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(emoji, sx, sy);
      }
      ctx.globalAlpha = 1;
    });

    // ── Fog of war overlay ────────────────────────────────────────────────
    if (mapData && fogR < MAP_R) {
      const { sx: cx, sy: cy } = w2s(0, 0);
      // Ellipse radii proportional to map image dimensions
      const mw = mapImg?.naturalWidth ?? 1;
      const mh = mapImg?.naturalHeight ?? 1;
      const mapPixW = mw * zoom / 1.5;
      const mapPixH = mh * zoom / 1.5;
      const rx = (fogR / MAP_R) * (mapPixW / 2);
      const ry = (fogR / MAP_R) * (mapPixH / 2);

      // Solid fog outside the ellipse
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, cw, ch);
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2, true);
      ctx.clip();
      ctx.fillStyle = 'rgba(0,0,0,0.88)';
      ctx.fillRect(0, 0, cw, ch);
      ctx.restore();

      // Soft gradient ONLY inside the ellipse (0.65→1.0), no overlap with solid fog
      if (rx > 0 && ry > 0) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(rx, ry);
        ctx.beginPath(); ctx.arc(0, 0, 1.0, 0, Math.PI * 2); ctx.clip();
        const grad = ctx.createRadialGradient(0, 0, 0.65, 0, 0, 1.0);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.82)');
        ctx.beginPath(); ctx.arc(0, 0, 1.0, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }
    }

    // ── sendTarget ring (always visible above fog) ────────────────────────
    if (sendTarget) {
      const { sx, sy } = w2s(sendTarget.wx, sendTarget.wy);
      ctx.beginPath(); ctx.arc(sx, sy, 16 * zoom, 0, Math.PI * 2);
      ctx.strokeStyle = '#f4d03f'; ctx.lineWidth = 2 * zoom;
      ctx.setLineDash([4 * zoom, 3 * zoom]); ctx.stroke(); ctx.setLineDash([]);
    }

    // ── Kingdom at center (always above fog) ──────────────────────────────
    const { sx: kx, sy: ky } = w2s(0, 0);
    const kSize = 44 * zoom;
    ctx.shadowColor = 'rgba(244,208,63,0.9)'; ctx.shadowBlur = 16 * zoom;
    const kImg = loadedImgs[kingdomKey(thLevel)];
    if (kImg) {
      ctx.drawImage(kImg, kx - kSize / 2, ky - kSize, kSize, kSize);
    } else {
      ctx.font = `${Math.round(26 * zoom)}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#fff';
      ctx.fillText('🏰', kx, ky);
    }
    ctx.shadowBlur = 0;

  }, [loading, mapData, pan, zoom, selected, sendTarget, imgsReady, thLevel, tab]);

  // ── Pointer events (drag + pinch zoom) ───────────────────────────────────
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
  const pinchRef = useRef<{ dist: number; cx: number; cy: number; z: number; px: number; py: number } | null>(null);
  const moved = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (pointersRef.current.size === 1) {
      moved.current = false;
      dragRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
      pinchRef.current = null;
    } else if (pointersRef.current.size === 2) {
      dragRef.current = null;
      const pts = Array.from(pointersRef.current.values());
      const dx = pts[1].x - pts[0].x, dy = pts[1].y - pts[0].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const rect = canvasRef.current?.getBoundingClientRect();
      const cx = ((pts[0].x + pts[1].x) / 2) - (rect?.left ?? 0);
      const cy = ((pts[0].y + pts[1].y) / 2) - (rect?.top ?? 0);
      pinchRef.current = { dist, cx, cy, z: zoom, px: pan.x, py: pan.y };
    }
  }, [pan, zoom]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2 && pinchRef.current) {
      const pts = Array.from(pointersRef.current.values());
      const dx = pts[1].x - pts[0].x, dy = pts[1].y - pts[0].y;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      const scale = newDist / pinchRef.current.dist;
      const nz = Math.max(0.3, Math.min(3, pinchRef.current.z * scale));
      const { cx, cy, px, py, z: oz } = pinchRef.current;
      setZoom(nz);
      setPan({ x: cx - (cx - px) * (nz / oz), y: cy - (cy - py) * (nz / oz) });
    } else if (pointersRef.current.size === 1 && dragRef.current) {
      const dx = e.clientX - dragRef.current.sx;
      const dy = e.clientY - dragRef.current.sy;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved.current = true;
      if (moved.current) setPan({ x: dragRef.current.px + dx, y: dragRef.current.py + dy });
    }
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const wasSingle = pointersRef.current.size === 1;
    pointersRef.current.delete(e.pointerId);
    if (wasSingle && !moved.current) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) handleClick(e.clientX - rect.left, e.clientY - rect.top);
    }
    if (pointersRef.current.size === 0) {
      dragRef.current = null;
      pinchRef.current = null;
      setTimeout(() => { moved.current = false; }, 10);
    }
  }, [pan, zoom, mapData, selected, tab]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.11;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setZoom(z => {
      const nz = Math.max(0.3, Math.min(3, z * factor));
      // zoom toward cursor
      setPan(p => ({
        x: mx - (mx - p.x) * (nz / z),
        y: my - (my - p.y) * (nz / z),
      }));
      return nz;
    });
  }, []);

  function handleClick(sx: number, sy: number) {
    const { wx, wy } = s2w(sx, sy);
    const dist = Math.sqrt(wx * wx + wy * wy);

    // Hit test nodes in screen space (14px radius)
    const hitNode = mapData?.nodes.find(n => {
      if (!n.discovered) return false;
      const { sx: nsx, sy: nsy } = w2s(n.x, n.y);
      return Math.sqrt((nsx - sx) ** 2 + (nsy - sy) ** 2) < 14 * zoom;
    });

    if (hitNode) {
      setSelected(prev => prev?.id === hitNode.id ? null : hitNode);
      setSendTarget(null);
    } else if (dist > 1.5) {
      const fogR = mapData?.fogRadius ?? 0;
      const { sx: cx, sy: cy } = w2s(0, 0);
      const dxPx = sx - cx, dyPx = sy - cy;
      const fogRxPx = (fogR / MAP_R) * (_mw / 1.5 / 2) * zoom;
      const fogRyPx = (fogR / MAP_R) * (_mh / 1.5 / 2) * zoom;
      const inFog = fogR > 0 && ((dxPx / fogRxPx) ** 2 + (dyPx / fogRyPx) ** 2) > 1;
      if (inFog) {
        setSelected(null); setSendTarget(null);
        if (!hasAcademy) {
          setFogMsg(t('fog_need_academy'));
          setTimeout(() => setFogMsg(''), 3000);
        }
        return;
      }
      if (fogR === 0 && !hasAcademy) {
        setFogMsg(t('fog_need_academy'));
        setTimeout(() => setFogMsg(''), 3000);
        return;
      }
      const clamped = { wx: Math.max(-MAP_R, Math.min(MAP_R, Math.round(wx))), wy: Math.max(-MAP_R, Math.min(MAP_R, Math.round(wy))) };
      setSendTarget(clamped);
      setSelected(null);
    } else {
      setSelected(null);
      setSendTarget(null);
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async function hireExplorer() {
    setHiring(true);
    try {
      const r = await api.post('/exploration/hire-explorer');
      const total = r.explorerCount + (r.trainingQueue?.length ?? 0);
      showMsg(`${t('exp_hired_msg')} (${total}/${r.maxExplorers})`);
      await load();
    } catch (e: any) { showMsg('❌ ' + (e.response?.data?.message || t('error'))); }
    finally { setHiring(false); }
  }

  async function sendMission() {
    if (!sendTarget) return;
    setSending(true);
    try {
      const r = await api.post('/exploration/mission', { targetX: sendTarget.wx, targetY: sendTarget.wy });
      showMsg(t('exp_sent_msg', { h: r.hoursUntilReturn }));
      setSendTarget(null);
      await load();
    } catch (e: any) { showMsg('❌ ' + (e.response?.data?.message || t('error'))); }
    finally { setSending(false); }
  }

  async function raidNode() {
    if (!selected) return;
    try {
      const r = await api.post(`/exploration/raid/${selected.id}`);
      const gained = Object.entries(r.gained).map(([k, v]) => `+${v} ${k}`).join(', ');
      showMsg(`✅ ${gained}`);
      setSelected(null);
      await Promise.all([load(), refresh()]);
    } catch (e: any) { showMsg('❌ ' + (e.response?.data?.message || t('error'))); }
  }

  async function recruitHero() {
    if (!selected) return;
    try {
      await api.post(`/exploration/recruit/${selected.id}`);
      showMsg(`✅ ${t('u_' + selected.heroType)} ${t('recruited_msg') || 'גויס!'}`);
      setSelected(null);
      await Promise.all([load(), refresh()]);
    } catch (e: any) { showMsg('❌ ' + (e.response?.data?.message || t('error'))); }
  }

  function showMsg(m: string) {
    setActionMsg(m);
    setTimeout(() => setActionMsg(''), 4000);
  }

  const explorerCount = mapData?.explorerCount ?? 0;
  const maxExp = mapData?.maxExplorers ?? 0;
  const activeCount = mapData?.activeMissions?.length ?? 0;
  const freeExplorers = Math.max(0, explorerCount - activeCount);
  const academyLevel = mapData?.academyLevel ?? 0;
  const inTraining = mapData?.trainingQueue?.length ?? 0;
  const totalExplorers = explorerCount + inTraining;

  if (loading) return (
    <div style={{ textAlign: 'center', paddingTop: 80, color: '#a0845a' }}>{t('loading_map')}</div>
  );

  return (
    <div className="screen" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: '8px 14px', background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#f4d03f' }}>{t('map_title')}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {(['map', 'missions'] as const).map(tb => (
            <button key={tb} onClick={() => setTab(tb)} style={{
              padding: '4px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700,
              background: tab === tb ? 'rgba(244,208,63,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${tab === tb ? 'rgba(244,208,63,0.5)' : 'rgba(255,255,255,0.08)'}`,
              color: tab === tb ? '#f4d03f' : '#555', cursor: 'pointer',
            }}>
              {tb === 'map' ? t('tab_map') : `${t('tab_missions')}${activeCount > 0 ? ` (${activeCount})` : ''}`}
            </button>
          ))}
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#a0845a', fontWeight: 700 }}>
            <span>🧭</span><span>{freeExplorers}/{explorerCount}</span>
          </span>
        </div>
      </div>

      {actionMsg && (
        <div style={{ padding: '6px 14px', fontSize: 12, textAlign: 'center', flexShrink: 0,
          background: actionMsg.startsWith('✅') ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)',
          color: actionMsg.startsWith('✅') ? '#27ae60' : '#e74c3c' }}>
          {actionMsg}
        </div>
      )}

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, background: '#0a1a08', touchAction: 'none', userSelect: 'none', visibility: tab === 'map' ? 'visible' : 'hidden', pointerEvents: tab === 'map' ? 'auto' : 'none' }}>
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
            style={{ display: 'block', cursor: 'grab' }}
          />

          {/* Explorer + magic counters — bottom right */}

          {/* Zoom buttons + counters */}
          <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
            {[['＋', 1.2], ['－', 0.83]].map(([label, f]) => (
              <button key={label as string} onClick={() => setZoom(z => Math.max(0.3, Math.min(3, z * (f as number))))}
                style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}>
                {label}
              </button>
            ))}
          </div>

          {/* How-to hint — shown when map is idle */}
          {!selected && !sendTarget && hasAcademy && freeExplorers > 0 && (
            <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.72)', border: '1px solid rgba(244,208,63,0.25)', borderRadius: 20, padding: '5px 14px', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 11, color: '#c8a84b' }}>👆 {t('exp_send_hint')}</span>
            </div>
          )}
          {!selected && !sendTarget && hasAcademy && freeExplorers === 0 && activeCount > 0 && (
            <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.72)', border: '1px solid rgba(244,208,63,0.25)', borderRadius: 20, padding: '5px 14px', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 11, color: '#c8a84b' }}>{t('exp_all_busy', { n: activeCount })}</span>
            </div>
          )}

          {/* Fog tap message */}
          {fogMsg && (
            <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(244,208,63,0.4)', borderRadius: 14, padding: '8px 16px', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 20 }}>
              <span style={{ fontSize: 12, color: '#f4d03f' }}>{fogMsg}</span>
            </div>
          )}

          {/* No academy hint */}
          {!hasAcademy && (
            <div style={{ position: 'absolute', bottom: 16, left: 14, right: 14, background: 'rgba(0,0,0,0.88)', border: '1px solid rgba(244,208,63,0.3)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#f4d03f', fontWeight: 700, marginBottom: 4 }}>🔒 {t('fog_need_academy')}</div>
              <div style={{ fontSize: 11, color: '#a0845a' }}>{t('fog_academy_desc')}</div>
            </div>
          )}

          {/* Help panel — shown when idle */}
          {!selected && !sendTarget && hasAcademy && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.82)', borderTop: '1px solid rgba(244,208,63,0.15)', padding: '8px 14px' }}>
              <div style={{ fontSize: 11, color: '#f4d03f', fontWeight: 700, marginBottom: 4 }}>{t('map_help_title')}</div>
              {(['map_help1','map_help2','map_help3','map_help4'] as const).map(k => (
                <div key={k} style={{ fontSize: 10, color: '#a0845a', marginBottom: 2 }}>{t(k)}</div>
              ))}
            </div>
          )}

          {/* Send panel */}
          {sendTarget && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(180deg,rgba(15,8,0,0.97),rgba(8,12,0,0.99))', borderTop: '1px solid rgba(244,208,63,0.3)', padding: 14 }}>
              <div style={{ fontSize: 13, color: '#f4d03f', fontWeight: 700, marginBottom: 4 }}>{t('exp_send_confirm')}</div>
              <div style={{ fontSize: 11, color: '#a0845a', marginBottom: 10 }}>
                {(() => {
                  const dist = Math.sqrt(sendTarget.wx ** 2 + sendTarget.wy ** 2);
                  const hrs = Math.min(24, Math.max(1, Math.round(dist * 0.5)));
                  return t('exp_distance', { d: dist.toFixed(1), h: hrs });
                })()}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setSendTarget(null)} style={{ flex: 1, padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#888', fontSize: 13, cursor: 'pointer' }}>{t('cancel')}</button>
                <button onClick={sendMission} disabled={sending || freeExplorers === 0}
                  style={{ flex: 2, padding: 10, borderRadius: 10, background: freeExplorers > 0 ? 'linear-gradient(135deg,#f39c12,#f4d03f)' : 'rgba(255,255,255,0.06)', border: 'none', color: freeExplorers > 0 ? '#000' : '#555', fontWeight: 900, fontSize: 14, cursor: freeExplorers > 0 ? 'pointer' : 'not-allowed' }}>
                  {sending ? '...' : freeExplorers > 0 ? t('exp_send_btn') : t('exp_no_free')}
                </button>
              </div>
            </div>
          )}

          {/* Node detail panel */}
          {selected && !sendTarget && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(180deg,rgba(15,8,0,0.97),rgba(8,12,0,0.99))', borderTop: '1px solid rgba(244,208,63,0.3)', padding: 14 }}>
              {selected.type === 'hero' ? (
                <HeroNodePanel
                  heroType={selected.heroType!}
                  alreadyRecruited={(units ?? []).some(u => u.type === selected.heroType && u.count > 0)}
                  onRecruit={recruitHero}
                  t={t}
                />
              ) : (
                <>
                  <div style={{ fontSize: 14, fontWeight: 900, color: selected.type === 'rare_resource' ? '#16a085' : '#b8860b', marginBottom: 4 }}>
                    {selected.resourceType ? <ResIcon type={selected.resourceType} size={16} /> : '📦'} {t(selected.resourceType!)} · {selected.resourceType === 'magic' ? 3 : selected.amount?.toLocaleString()}
                    {selected.type === 'rare_resource' && <span style={{ fontSize: 11, fontWeight: 400, color: '#16a085' }}> {t('exp_rare')}</span>}
                  </div>
                  {selected.lastRaidedAt && !selected.canRaid && (
                    <div style={{ fontSize: 11, color: '#a0845a', marginBottom: 10 }}>
                      ⏳ <Countdown endsAt={new Date(new Date(selected.lastRaidedAt).getTime() + 86400000).toISOString()} onEnd={load} />
                    </div>
                  )}
                  <button onClick={selected.canRaid ? raidNode : undefined} disabled={!selected.canRaid}
                    style={{ width: '100%', padding: 10, borderRadius: 10, background: selected.canRaid ? 'linear-gradient(135deg,#f39c12,#f4d03f)' : 'rgba(255,255,255,0.08)', border: 'none', color: selected.canRaid ? '#000' : '#555', fontWeight: 900, fontSize: 14, cursor: selected.canRaid ? 'pointer' : 'not-allowed' }}>
                    {selected.canRaid ? <><ResIcon type={selected.resourceType ?? ''} size={14} /> {t('node_attack_btn')}</> : t('node_cooldown_active')}
                  </button>
                </>
              )}
              <button onClick={() => setSelected(null)} style={{ width: '100%', marginTop: 8, padding: '6px', background: 'none', border: 'none', color: '#555', fontSize: 12, cursor: 'pointer' }}>{t('node_close')}</button>
            </div>
          )}
        </div>

      {tab === 'missions' && (
        <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: 14, background: 'linear-gradient(180deg,#0f0800,#080c00)', zIndex: 1 }}>
          <div style={{ background: 'linear-gradient(135deg,rgba(39,174,96,0.1),rgba(26,138,64,0.05))', border: '1px solid rgba(39,174,96,0.25)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#27ae60', marginBottom: 8 }}>{t('exp_tab_explorers')}</div>
            <div style={{ fontSize: 12, color: '#a0845a', marginBottom: 8 }}>
              {t('exp_hired', { n: totalExplorers })} / {t('exp_max_label', { n: academyLevel > 0 ? maxExp : '—' })}
              {!hasAcademy && <span style={{ color: '#e74c3c' }}> · {t('exp_need_academy')}</span>}
            </div>

            {(mapData?.trainingQueue ?? []).length > 0 && (
              <div style={{ background: 'rgba(52,152,219,0.1)', border: '1px solid rgba(52,152,219,0.3)', borderRadius: 10, padding: '8px 12px', marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: '#3498db', fontWeight: 700, marginBottom: 4 }}>{t('exp_training')}</div>
                {[...mapData!.trainingQueue].sort().map((endsAt, i) => (
                  <div key={endsAt} style={{ fontSize: 11, color: '#a0845a', marginTop: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <span>🧭 {t('explorer')} #{explorerCount + i + 1}</span>
                    <Countdown endsAt={endsAt} onEnd={load} />
                  </div>
                ))}
              </div>
            )}

            {academyLevel > 0 && totalExplorers < maxExp && (
              <>
                <button onClick={hireExplorer} disabled={hiring} style={{ width: '100%', padding: 10, borderRadius: 10, background: 'linear-gradient(135deg,#27ae60,#1e8449)', border: 'none', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                  {hiring ? t('exp_hiring') : t('exp_hire_btn')}
                </button>
                <div style={{ fontSize: 10, color: '#666', textAlign: 'center', marginTop: 5 }}>
                  ⏱️ {t('exp_train_time')}: {(() => {
                    const isVip = kingdom?.vipExpiresAt && new Date() < new Date(kingdom.vipExpiresAt);
                    const base = academyLevel >= 10 ? 30 : academyLevel >= 6 ? 60 : academyLevel >= 3 ? 120 : 240;
                    const mins = isVip ? Math.floor(base * 0.75) : base;
                    return mins >= 60 ? `${mins/60}h` : `${mins}m`;
                  })()}{kingdom?.vipExpiresAt && new Date() < new Date(kingdom.vipExpiresAt) ? ' ⚡' : ''}
                </div>
              </>
            )}
            {totalExplorers >= maxExp && maxExp > 0 && (
              <div style={{ fontSize: 11, color: '#27ae60', textAlign: 'center' }}>
                ✅ {totalExplorers}/{maxExp} · {t('exp_max_reached').replace(/^✅\s*[^·]*·\s*/, '')}
              </div>
            )}
          </div>

          {activeCount > 0 && <>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#f4d03f', marginBottom: 8 }}>{t('exp_active_title')}</div>
            {mapData!.activeMissions.map(m => (
              <div key={m.id} style={{ background: 'rgba(244,208,63,0.07)', border: '1px solid rgba(244,208,63,0.2)', borderRadius: 12, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: '#f4d03f' }}>🧭 ({m.targetX}, {m.targetY})</div>
                <div style={{ fontSize: 11, color: '#a0845a', marginTop: 2 }}>{t('exp_returns')} <Countdown endsAt={m.returnsAt} onEnd={load} /></div>
              </div>
            ))}
          </>}

          {(mapData?.returnedMissions.length ?? 0) > 0 && <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#27ae60' }}>{t('exp_done_title')}</div>
              <button onClick={async () => { await api.delete('/exploration/missions/completed'); await load(); }}
                style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c', cursor: 'pointer' }}>
                🗑️ {t('clear')}
              </button>
            </div>
            {mapData!.returnedMissions.map(m => {
              const nodeMap = new Map(mapData!.nodes.map(n => [n.id, n]));
              const found = (m.discoveredNodeIds ?? []).map(id => nodeMap.get(id)).filter(Boolean) as MapNode[];
              const nodeLabel = (n: MapNode) => {
                if (n.type === 'hero') return <>{t('exp_hero_node')} {t('u_' + n.heroType!)}</>;
                const resType = n.resourceType ?? '';
                const rarity = n.type === 'rare_resource' ? ` ${t('exp_rare')}` : '';
                return <><ResIcon type={resType} size={11} /> {t(n.resourceType!)}{rarity}</>;
              };
              return (
                <div key={m.id} style={{ background: 'rgba(39,174,96,0.07)', border: '1px solid rgba(39,174,96,0.15)', borderRadius: 12, padding: '10px 12px', marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#27ae60', marginBottom: 4 }}>{t('exp_target')} ({m.targetX}, {m.targetY})</div>
                  {found.length > 0
                    ? found.map((n, i) => <div key={i} style={{ fontSize: 11, color: '#e8d5a3', marginTop: 2, display:'flex', alignItems:'center', gap:3 }}>{t('exp_found')}{nodeLabel(n)}</div>)
                    : <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{t('exp_nothing')}</div>
                  }
                </div>
              );
            })}
          </>}

          {explorerCount === 0 && academyLevel === 0 && (
            <div style={{ textAlign: 'center', color: '#666', paddingTop: 40, fontSize: 12 }}>{t('exp_no_academy')}</div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
