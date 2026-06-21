import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { fmt } from '../utils/format';
import { useT, useLangStore } from '../i18n/useT';
import { LANGUAGES } from '../i18n/translations';
import Countdown from '../components/Countdown';
import { api } from '../api/client';
import { upgradeCost } from '../utils/costs';
import WorkersPanel from '../components/WorkersPanel';
import WorldEventPopup from '../components/WorldEventPopup';

// ── Building visual config ──────────────────────────────────────────
const B: Record<string, { icon: string; top: string; left: string; right: string; glow: string; label: string }> = {
  town_hall:    { icon:'🏛️', top:'#c8a040', left:'#7a5c18', right:'#4a3808', glow:'rgba(200,160,64,0.8)',  label:'Town Hall'    },
  gold_mine:    { icon:'⛏️', top:'#d4a820', left:'#8a6010', right:'#5a3808', glow:'rgba(212,168,32,0.7)',  label:'Gold Mine'    },
  lumber_mill:  { icon:'🪵', top:'#5a8c30', left:'#2c5018', right:'#183008', glow:'rgba(90,140,48,0.7)',   label:'Lumber Mill'  },
  stone_quarry: { icon:'🪨', top:'#808890', left:'#505860', right:'#303840', glow:'rgba(128,136,144,0.6)', label:'Quarry'       },
  farm:         { icon:'🌾', top:'#78c030', left:'#407818', right:'#285008', glow:'rgba(120,192,48,0.7)',  label:'Farm'         },
  barracks:     { icon:'⚔️', top:'#c03030', left:'#781818', right:'#480808', glow:'rgba(192,48,48,0.7)',   label:'Barracks'     },
  academy:      { icon:'📚', top:'#9050c8', left:'#502878', right:'#300858', glow:'rgba(144,80,200,0.7)',  label:'Academy'      },
  wall:         { icon:'🧱', top:'#909090', left:'#585858', right:'#383838', glow:'rgba(144,144,144,0.6)', label:'Wall'         },
  watch_tower:  { icon:'🗼', top:'#3090d8', left:'#185888', right:'#083058', glow:'rgba(48,144,216,0.7)',  label:'Watch Tower'  },
  hospital:     { icon:'🏥', top:'#e74c3c', left:'#922b21', right:'#641e16', glow:'rgba(231,76,60,0.7)',  label:'Hospital'     },
  arcane_tower: { icon:'🔮', top:'#9b59b6', left:'#5b2c6f', right:'#3a1a45', glow:'rgba(155,89,182,0.7)', label:'Arcane Tower' },
  gem_forge:    { icon:'💎', top:'#1aafbf', left:'#0d7080', right:'#074850', glow:'rgba(26,175,191,0.7)', label:'Gem Mine'     },
};

// ── Map grid: 16×16 virtual world, buildings live in the center ─────
const GRID = 16;
const TILE_W = 68, TILE_H = 40;

// Building positions — all within gx:3-12, gy:3-12 (no water/forest), organized by category
// Center: (8,8). Valid settled range at start: dist≤5 → gx/gy: 3–13, but avoid gx/gy=13 (forest)
const LAYOUT: Record<string, { gx: number; gy: number; size?: number }> = {
  // ── Core ──────────────────────────────────
  town_hall:    { gx: 7, gy: 7, size: 2 },   // center

  // ── Military (NW) ────────────────────────
  barracks:     { gx: 5, gy: 3 },              // N of center
  academy:      { gx: 3, gy: 5 },              // far NW, gap from stone zone

  // ── Defense (NE) ──────────────────────────
  wall:         { gx: 14, gy: 11 },            // SE gate (bridge)
  watch_tower:  { gx: 11, gy: 3 },
  hospital:     { gx: 13, gy: 5 },             // far NE, gap from farm zone

  // ── Production West: stone (gx 2-3, gy 8-10) / gold (gx 2-3, gy 11-13) ──
  stone_quarry: { gx: 3, gy: 8  },
  gold_mine:    { gx: 3, gy: 11 },

  // ── Production East: farm (gx 12-13, gy 8-10) / lumber (gx 12-13, gy 11-13) ──
  farm:         { gx: 12, gy: 8 },
  lumber_mill:  { gx: 12, gy: 11 },

  // ── Special (S) — 2-tile gap from production zones ─────────────
  arcane_tower: { gx: 6, gy: 14 },
  gem_forge:    { gx: 9, gy: 14 },
};

// Extra duplicate slots — 5 extras per type = 6 total (2 cols × 3 rows per resource zone)
// gold_mine   SW zone: gx 3-4, gy 10-12
// stone_quarry W zone: gx 3-4, gy  7-9
// lumber_mill SE zone: gx11-12, gy10-12
// farm         E zone: gx11-12, gy  7-9
const EXTRA_POSITIONS: Record<string, Array<{ gx: number; gy: number }>> = {
  // gold zone: gx 2-3, gy 11-13 (gap from stone at gy 8-10)
  gold_mine:    [{ gx:2,gy:11 },{ gx:3,gy:12 },{ gx:2,gy:12 },{ gx:3,gy:13 },{ gx:2,gy:13 }],
  // stone zone: gx 2-3, gy 8-10 (gap from academy at 3,5)
  stone_quarry: [{ gx:2,gy:8  },{ gx:3,gy:9  },{ gx:2,gy:9  },{ gx:3,gy:10 },{ gx:2,gy:10 }],
  // lumber zone: gx 12-13, gy 11-13 (gap from hospital at 13,5)
  lumber_mill:  [{ gx:13,gy:11},{ gx:12,gy:12},{ gx:13,gy:12},{ gx:12,gy:13},{ gx:13,gy:13}],
  // farm zone: gx 12-13, gy 8-10
  farm:         [{ gx:13,gy:8 },{ gx:12,gy:9 },{ gx:13,gy:9 },{ gx:12,gy:10},{ gx:13,gy:10}],
  // gem forge extras: in S zone
  gem_forge:    [{ gx:8,gy:14 },{ gx:10,gy:14}],
};

// ── Building info per level ─────────────────────────────────────
function buildingStats(type: string, level: number, t: (k: string, v?: Record<string,string|number>) => string, explorerCount = 1, isVip = false): string[] {
  const fmt2 = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(Math.floor(n));
  const vipProd = isVip ? 1.5 : 1.0;
  const prod = (base: number) => fmt2(base * Math.pow(1.12, level - 1) * vipProd);
  const prodNext = (base: number) => fmt2(base * Math.pow(1.12, level) * vipProd);
  const storage = (base: number) => fmt2(base * (1 + (level - 1) * 3.2));
  const storage2 = (base: number) => fmt2(base * (1 + level * 3.2));

  const BARRACKS_UNLOCKS: Record<number, string> = {
    1: `${t('u_spearman')}, ${t('u_archer')}`,
    2: t('u_swordsman'),
    3: `${t('u_cavalry')}, ${t('u_paladin')} (VIP)`,
    5: `${t('u_catapult')}, ${t('u_dragon_rider')} (VIP)`,
    8: t('u_elite_guard'),
  };

  switch (type) {
    case 'town_hall': return [
      t('stat_storage_row1', { gold: storage(5000), wood: storage(4000) }),
      t('stat_storage_row2', { stone: storage(3000), food: storage(2000) }),
      t('stat_storage_row1_next', { n: level + 1, gold: storage2(5000), wood: storage2(4000) }),
      t('stat_storage_row2_next', { n: level + 1, stone: storage2(3000), food: storage2(2000) }),
    ];
    case 'gold_mine': return [
      t('stat_prod_now', { n: prod(100), res: t('gold') }),
      t('stat_prod_next', { n: level + 1, next: prodNext(100), res: t('gold') }),
      t('stat_res_storage', { n: 300, res: t('gold') }),
    ];
    case 'lumber_mill': return [
      t('stat_prod_now', { n: prod(80), res: t('wood') }),
      t('stat_prod_next', { n: level + 1, next: prodNext(80), res: t('wood') }),
      t('stat_res_storage', { n: 250, res: t('wood') }),
    ];
    case 'stone_quarry': return [
      t('stat_prod_now', { n: prod(60), res: t('stone') }),
      t('stat_prod_next', { n: level + 1, next: prodNext(60), res: t('stone') }),
      t('stat_res_storage', { n: 200, res: t('stone') }),
    ];
    case 'farm': return [
      t('stat_prod_now', { n: prod(50), res: t('food') }),
      t('stat_prod_next', { n: level + 1, next: prodNext(50), res: t('food') }),
      t('stat_res_storage', { n: 150, res: t('food') }),
      t('stat_food_warn'),
    ];
    case 'barracks': {
      const unlocks = Object.entries(BARRACKS_UNLOCKS)
        .filter(([lvl]) => Number(lvl) <= level)
        .map(([, units]) => units).join(', ');
      const nextUnlock = Object.entries(BARRACKS_UNLOCKS)
        .find(([lvl]) => Number(lvl) > level);
      return [
        t('stat_units_avail', { units: unlocks || t('u_spearman') }),
        nextUnlock ? t('stat_unlocks_at', { n: nextUnlock[0], units: nextUnlock[1] }) : t('stat_all_units'),
        t('stat_train_fast'),
      ];
    }
    case 'academy': {
      const maxExp = Math.ceil(level / 3);
      const baseMins = level >= 10 ? 30 : level >= 6 ? 60 : level >= 3 ? 120 : 240;
      const trainMins = isVip ? Math.floor(baseMins * 0.75) : baseMins;
      const trainH = trainMins >= 60 ? `${trainMins / 60}h` : `${trainMins}m`;
      const trainHNext = (() => { const b = (level+1) >= 10 ? 30 : (level+1) >= 6 ? 60 : (level+1) >= 3 ? 120 : 240; const m = isVip ? Math.floor(b*0.75) : b; return m >= 60 ? `${m/60}h` : `${m}m`; })();
      const discPct = level >= 10 ? 95 : level >= 6 ? 80 : level >= 3 ? 65 : 45;
      const fogR = Math.min(22, Math.round(2 + (level - 1) * 20 / 29));
      const fogRNext = Math.min(22, Math.round(2 + level * 20 / 29));
      const fogPct = Math.round(fogR / 22 * 100);
      const fogPctNext = Math.round(fogRNext / 22 * 100);
      return [
        t('stat_prod_boost', { n: level * 2 }),
        t('stat_prod_boost_next', { n: level + 1, next: (level + 1) * 2 }),
        t('stat_academy_fog_radius', { n: fogPct, next: fogPctNext, lv: level + 1 }),
        t('stat_academy_explorers', { n: maxExp }),
        t('stat_academy_train_time', { t: trainH }),
        t('stat_academy_disc_chance', { n: discPct }),
      ];
    }
    case 'wall': return [
      t('stat_wall_def', { n: level * 50 }),
      t('stat_wall_next', { n: level + 1, next: (level + 1) * 50 }),
      t('stat_wall_perimeter'),
    ];
    case 'watch_tower': return [
      t('stat_tower_boost', { n: level * 10 }),
      t('stat_tower_next', { n: level + 1, next: (level + 1) * 10 }),
      t('stat_tower_detect'),
    ];
    case 'hospital': return [
      t('stat_hospital_heal', { n: 5 + level * 10 }),
      t('stat_hospital_next', { n: level + 1, next: 5 + (level + 1) * 10 }),
      t('stat_hospital_base'),
    ];
    case 'arcane_tower': return [
      t('stat_arcane_atk', { n: (level * 5).toFixed(0) }),
      t('stat_arcane_next', { n: level + 1, next: ((level + 1) * 5).toFixed(0) }),
      t('stat_arcane_vip'),
    ];
    case 'gem_forge': return [
      t('stat_gem_forge_now', { n: Math.floor(5 * Math.pow(1.2, level - 1)) }),
      t('stat_gem_forge_next', { level: level + 1, gems: Math.floor(5 * Math.pow(1.2, level)) }),
      t('stat_gem_forge_cost', { cost: ((level + 1) * 0.05).toFixed(2) }),
    ];
    default: return [t('stat_upgrade_default')];
  }
}

function getLayout(type: string, slot: number, gridX?: number | null, gridY?: number | null): { gx: number; gy: number; size?: number } | undefined {
  const base = slot > 0 && EXTRA_POSITIONS[type] ? (EXTRA_POSITIONS[type][slot - 1] ?? LAYOUT[type]) : LAYOUT[type];
  if (!base) return undefined;
  return { ...base, gx: gridX ?? base.gx, gy: gridY ?? base.gy };
}


// בדיקת pixel alpha — מחזיר false אם הלחיצה על פיקסל שקוף
function hitTestImg(e: React.MouseEvent<HTMLElement>): boolean {
  const img = e.currentTarget.querySelector('img[data-hit]') as HTMLImageElement | null;
  if (!img || !img.complete || !img.naturalWidth) return true;
  const rect = img.getBoundingClientRect();
  const x = Math.round((e.clientX - rect.left) * img.naturalWidth / rect.width);
  const y = Math.round((e.clientY - rect.top) * img.naturalHeight / rect.height);
  if (x < 0 || y < 0 || x >= img.naturalWidth || y >= img.naturalHeight) return false;
  try {
    const cv = document.createElement('canvas');
    cv.width = img.naturalWidth; cv.height = img.naturalHeight;
    const ctx = cv.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(x, y, 1, 1).data[3] > 10;
  } catch { return true; }
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

function isoXY(gx: number, gy: number) {
  return {
    x: (gx - gy) * (TILE_W / 2),
    y: (gx + gy) * (TILE_H / 2),
  };
}

export default function HomeScreen() {
  const { kingdom, buildings, productionRates, refresh } = useGameStore();
  const storeMaxWorkers = useGameStore(s => s.kingdom?.maxWorkers ?? 5);
  const tr = useT();
  const { lang } = useLangStore();
  const isRtl = LANGUAGES.find(l => l.code === lang)?.rtl ?? true;
  const mapCtrlSide = isRtl ? 'right' : 'left';
  const [selected, setSelected] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [speedingUp, setSpeedingUp] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [buildModal, setBuildModal] = useState(false);
  const [building, setBuilding] = useState<string | null>(null);
  const [buildMsg, setBuildMsg] = useState('');
  const [moveModeOn, setMoveModeOn] = useState(false);
  const [dragGhost, setDragGhost] = useState<{ id: string; type: string; sx: number; sy: number } | null>(null);
  const [snapCell, setSnapCell] = useState<{ gx: number; gy: number } | null>(null);
  const dragBuildingId = useRef<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressStartPos = useRef<{ x: number; y: number } | null>(null);
  const moveModeRef = useRef(false);

  // Pan + zoom state
  const containerRef = useRef<HTMLDivElement>(null);
  const bgImgRef = useRef<HTMLVideoElement>(null);
  const groundImgRef = useRef<HTMLImageElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.4);
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const isDragging = useRef(false);
  const lastPinchDist = useRef<number | null>(null);
  const zoomRef = useRef(1);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  // Move video + ground via ref to avoid React re-render flicker
  useEffect(() => {
    if (bgImgRef.current) {
      bgImgRef.current.style.transform = `translate(${pan.x + (-40) * zoom}px, ${pan.y + (-500) * zoom}px) scale(${zoom})`;
      bgImgRef.current.play().catch(() => {});
    }
    if (groundImgRef.current)
      groundImgRef.current.style.transform = `translate(${pan.x + 68 * zoom}px, ${pan.y + 40 * zoom}px) scale(${zoom})`;
  }, [pan, zoom]);

  // גבולות תמונת הרקע בסצנה (left/top/right/bottom בפיקסלים)
  const BG = { left: -40, top: -500, right: 1260, bottom: 1233 } as const;

  const clampPan = useCallback((x: number, y: number, z: number) => {
    const cw = containerRef.current?.clientWidth  ?? window.innerWidth;
    const ch = containerRef.current?.clientHeight ?? window.innerHeight;
    return {
      x: Math.max(cw  - BG.right  * z, Math.min(-BG.left  * z, x)),
      y: Math.max(ch  - BG.bottom * z, Math.min(-BG.top   * z, y)),
    };
  }, []);
  const screenToGridRef = useRef<(x: number, y: number) => { gx: number; gy: number } | null>(() => null);
  const moveBuildingAPIRef = useRef<(id: string, gx: number, gy: number) => void>(() => {});

  const selectedBuilding = buildings.find(b => b.id === selected);
  const selectedType = selectedBuilding?.type ?? '';
  const thBuilding = buildings.find(b => b.type === 'town_hall');
  const wallBuilding = buildings.find(b => b.type === 'wall');

  const totalPower = buildings.reduce((sum, b) => sum + b.level, 0);
  const playerLevel = Math.floor(Math.sqrt((kingdom?.score || 0) / 10)) + 1;
  const [showWorkers, setShowWorkers] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showEvent, setShowEvent] = useState(false);
  const [eventStatus, setEventStatus] = useState<'announced' | 'active' | null>(null);

  useEffect(() => {
    async function checkEvent() {
      try {
        const res = await api.get('/world-event/current');
        const st = res.data?.event?.status;
        setEventStatus(st === 'announced' || st === 'active' ? st : null);
      } catch { setEventStatus(null); }
    }
    checkEvent();
    const iv = setInterval(checkEvent, 60_000);
    return () => clearInterval(iv);
  }, []);

  // ── Animated map characters ─────────────────────────────────────────
  // Routes based on actual building positions (from LAYOUT)
  // Workers: בית עיר ↔ מבני משאבים
  const WORKER_ROUTES = [
    [[8,8],[4,10],[8,8],[4,8],[8,8]],           // w0: TH ↔ מכרה ↔ מחצבה
    [[8,8],[11,10],[8,8],[11,8],[8,8]],          // w1: TH ↔ מסור ↔ חווה
    [[8,9],[7,8],[8,8],[9,8],[8,9]],             // w2: ממוקד סביב TH
  ];
  // Guard: סיור פרימטר
  const GUARD_ROUTE = [[5,3],[8,3],[11,4],[12,7],[11,10],[8,12],[5,12],[3,9],[3,6],[5,3]];
  // Soldiers: בין צריף, אקדמיה, בית חולים, מגדל שמירה
  const SOLDIER_ROUTES = [
    [[5,4],[4,6],[8,8],[5,4]],                  // s0: צריף → אקדמיה → TH → צריף
    [[11,4],[11,6],[8,8],[11,4]],                // s1: מגדל → בית חולים → TH → מגדל
    [[5,4],[8,8],[11,4],[11,6],[4,6],[5,4]],     // s2: סיור מלא צבאי
  ];

  const numWorkers  = Math.min(Math.max((kingdom as any)?.workers ?? 0, 1), 3);
  const storeUnits  = useGameStore(s => s.units);
  const totalUnits  = storeUnits?.reduce((a: number, u: any) => a + (u.count || 0), 0) ?? 0;
  const numSoldiers = Math.min(Math.floor(totalUnits / 80) + 1, 3);

  type MapChar = { id: string; emoji: string; gx: number; gy: number; wpIdx: number; route: number[][]; speed: number; flip: boolean };

  const [chars, setChars] = useState<MapChar[]>(() => {
    const list: MapChar[] = [];
    for (let i = 0; i < 3; i++) {
      const r = WORKER_ROUTES[i];
      list.push({ id:`w${i}`, emoji:'👷', gx: r[0][0], gy: r[0][1], wpIdx: 0, route: r, speed: 2.8 + i * 0.5, flip: false });
    }
    list.push({ id:'g0', emoji:'💂', gx: GUARD_ROUTE[0][0], gy: GUARD_ROUTE[0][1], wpIdx: 0, route: GUARD_ROUTE, speed: 3.5, flip: false });
    for (let i = 0; i < 3; i++) {
      const r = SOLDIER_ROUTES[i];
      list.push({ id:`s${i}`, emoji:'🪖', gx: r[0][0], gy: r[0][1], wpIdx: 0, route: r, speed: 2.4 + i * 0.4, flip: false });
    }
    return list;
  });

  useEffect(() => {
    const id = setInterval(() => {
      setChars(prev => prev.map(c => {
        const nextIdx = (c.wpIdx + 1) % c.route.length;
        const [ngx, ngy] = c.route[nextIdx];
        const movingRight = ngx > c.gx || (ngx === c.gx && ngy < c.gy);
        return { ...c, gx: ngx, gy: ngy, wpIdx: nextIdx, flip: movingRight };
      }));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const visibleChars = chars.filter(c => {
    if (c.id.startsWith('w')) return parseInt(c.id[1]) < numWorkers;
    if (c.id === 'g0') return true;
    return parseInt(c.id[1]) < numSoldiers;
  });

  // Compute full scene bounds
  const allCorners = [isoXY(0, 0), isoXY(GRID, 0), isoXY(0, GRID), isoXY(GRID, GRID)];
  const minX = Math.min(...allCorners.map(c => c.x)) - TILE_W;
  const maxX = Math.max(...allCorners.map(c => c.x)) + TILE_W;
  const minY = Math.min(...allCorners.map(c => c.y)) - TILE_H;
  const maxY = Math.max(...allCorners.map(c => c.y)) + TILE_H + 120;
  const sceneW = maxX - minX;
  const sceneH = maxY - minY;

  // עדכון screenToGrid בכל render כדי ש-onPointerUp תמיד ישתמש ב-pan/zoom עדכניים
  screenToGridRef.current = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const innerX = (clientX - rect.left - pan.x) / zoom;
    const innerY = (clientY - rect.top - pan.y) / zoom;
    const sceneX = innerX + minX;
    const sceneY = innerY + minY;
    const gx = Math.round(sceneX / TILE_W + sceneY / TILE_H);
    const gy = Math.round(sceneY / TILE_H - sceneX / TILE_W);
    if (gx < 0 || gx >= GRID || gy < 0 || gy >= GRID) return null;
    return { gx, gy };
  };

  // Center map on town hall initially
  useEffect(() => {
    const containerW = containerRef.current?.clientWidth ?? window.innerWidth;
    const containerH = containerRef.current?.clientHeight ?? 400;
    const th = LAYOUT.town_hall;
    const thPos = isoXY(th.gx + 1, th.gy + 1);
    const initZ = 0.4;
    setPan(clampPan(
      containerW / 2 - (thPos.x - minX) * initZ,
      containerH / 2 - (thPos.y - minY) * initZ + 30,
      initZ,
    ));
  }, [clampPan]);

  // Touch/mouse pan handlers
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-building]')) return;
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

  // סנכרון ref עם state של move mode
  useEffect(() => { moveModeRef.current = moveModeOn; }, [moveModeOn]);

  useEffect(() => {
    const handler = () => setShowWorkers(true);
    window.addEventListener('open-workers', handler);
    return () => window.removeEventListener('open-workers', handler);
  }, []);

  useEffect(() => {
    const handler = () => setShowRename(true);
    window.addEventListener('open-rename', handler);
    return () => window.removeEventListener('open-rename', handler);
  }, []);

  // מאזיני window קבועים לגרירת מבנה — touch ו-pointer ביחד
  useEffect(() => {
    const doMove = (x: number, y: number) => {
      if (!dragBuildingId.current) return;
      setDragGhost(g => g ? { ...g, sx: x, sy: y } : null);
      const grid = screenToGridRef.current(x, y);
      setSnapCell(grid ?? null);
    };
    const doDrop = (x: number, y: number) => {
      if (!dragBuildingId.current) return;
      const grid = screenToGridRef.current(x, y);
      if (grid) moveBuildingAPIRef.current(dragBuildingId.current, grid.gx, grid.gy);
      dragBuildingId.current = null;
      setDragGhost(null);
      setSnapCell(null);
    };
    const clearTimer = () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } };
    const doCancel  = () => { clearTimer(); dragBuildingId.current = null; setDragGhost(null); setSnapCell(null); };
    const onPMove   = (e: PointerEvent) => doMove(e.clientX, e.clientY);
    const onPUp     = (e: PointerEvent) => { clearTimer(); doDrop(e.clientX, e.clientY); };
    const onPCancel = () => doCancel();
    const onTMove   = (e: TouchEvent)   => { const t = e.touches[0]; if (t) doMove(t.clientX, t.clientY); };
    const onTEnd    = (e: TouchEvent)   => { clearTimer(); const t = e.changedTouches[0]; if (t) doDrop(t.clientX, t.clientY); };
    const onTCancel = () => doCancel();
    window.addEventListener('pointermove',   onPMove);
    window.addEventListener('pointerup',     onPUp);
    window.addEventListener('pointercancel', onPCancel);
    window.addEventListener('touchmove',   onTMove, { passive: true });
    window.addEventListener('touchend',    onTEnd);
    window.addEventListener('touchcancel', onTCancel);
    return () => {
      window.removeEventListener('pointermove',   onPMove);
      window.removeEventListener('pointerup',     onPUp);
      window.removeEventListener('pointercancel', onPCancel);
      window.removeEventListener('touchmove',   onTMove);
      window.removeEventListener('touchend',    onTEnd);
      window.removeEventListener('touchcancel', onTCancel);
    };
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


  // Sorted buildings
  const sortedBuildings = useMemo(() =>
    [...buildings].filter(b => getLayout(b.type, b.slot ?? 0, b.gridX, b.gridY))
      .sort((a, b) => {
        const la = getLayout(a.type, a.slot ?? 0, a.gridX, a.gridY)!, lb = getLayout(b.type, b.slot ?? 0, b.gridX, b.gridY)!;
        return (la.gx + la.gy + (la.size || 1)) - (lb.gx + lb.gy + (lb.size || 1));
      }),
    [buildings]);

  async function upgrade() {
    if (!selected || !selectedBuilding) return;
    setUpgrading(selected);
    setMsg('');
    try {
      if (selectedBuilding.type === 'gem_forge') {
        await api.post('/kingdom/upgrade-gem-forge', { buildingId: selected });
      } else {
        await api.post('/buildings/upgrade', { type: selectedBuilding.type, buildingId: selected });
      }
      await refresh();
      window.dispatchEvent(new Event('usdt-balance-refresh'));
      setMsg(tr('upgrade_started_msg'));
      setSelected(null);
    } catch (e: any) {
      setMsg('❌ ' + (e.response?.data?.message || tr('error')));
    } finally { setUpgrading(null); }
  }

  // Singular buildings that can be constructed (not in initial set)
  const BUILDABLE = ['academy', 'wall', 'watch_tower', 'hospital', 'arcane_tower'] as const;
  // Resource buildings that can be duplicated (up to 3 copies)
  const RESOURCE_BUILDABLE = ['gold_mine', 'lumber_mill', 'stone_quarry', 'farm'] as const;

  const countOfType = (t: string) => buildings.filter(b => b.type === t).length;
  const existingTypes = buildings.map(b => b.type);

  const BUILD_COSTS: Record<string, { gold: number; wood: number; stone: number }> = {
    academy: { gold: 500, wood: 300, stone: 200 },
    wall: { gold: 200, wood: 0, stone: 400 },
    watch_tower: { gold: 150, wood: 200, stone: 100 },
    hospital: { gold: 300, wood: 200, stone: 100 },
    arcane_tower: { gold: 800, wood: 400, stone: 400 },
    gold_mine: { gold: 200, wood: 100, stone: 0 },
    lumber_mill: { gold: 150, wood: 0, stone: 100 },
    stone_quarry: { gold: 150, wood: 100, stone: 0 },
    farm: { gold: 100, wood: 150, stone: 0 },
    gem_forge: { gold: 0, wood: 0, stone: 0 }, // cost is 0.1 USDT, handled separately
  };
  const BUILD_DESC: Record<string, string> = {
    academy: tr('bd_academy'), wall: tr('bd_wall'),
    barracks: tr('bd_barracks'), watch_tower: tr('bd_watch_tower'), hospital: tr('bd_hospital'),
    arcane_tower: tr('bd_arcane_tower'), gold_mine: tr('bd_gold_mine'),
    lumber_mill: tr('bd_lumber_mill'), stone_quarry: tr('bd_stone_quarry'), farm: tr('bd_farm'),
    gem_forge: tr('gem_forge_desc'),
  };

  // Singular buildings not yet built + duplicable resource buildings with < 3 copies
  const availableToBuild: string[] = [
    ...BUILDABLE.filter(t => !existingTypes.includes(t)),
    ...RESOURCE_BUILDABLE.filter(t => countOfType(t) < 6),
    ...(countOfType('gem_forge') < 3 ? ['gem_forge'] : []),
  ];

  function costFor(type: string) {
    const base = BUILD_COSTS[type] ?? { gold: 200, wood: 100, stone: 100 };
    const mult = (RESOURCE_BUILDABLE as readonly string[]).includes(type)
      ? Math.pow(2, countOfType(type)) : 1;
    return { gold: Math.floor(base.gold * mult), wood: Math.floor(base.wood * mult), stone: Math.floor(base.stone * mult) };
  }

  async function buildNew(type: string) {
    setBuilding(type); setBuildMsg('');
    try {
      if (type === 'gem_forge') {
        await api.post('/kingdom/build-gem-forge');
      } else {
        await api.post('/buildings/build', { type });
      }
      await refresh();
      setBuildModal(false);
      setMsg(tr('building_built', { name: tr('b_' + type) }));
    } catch (e: any) {
      const msg = e.response?.data?.message;
      setBuildMsg('❌ ' + (Array.isArray(msg) ? msg.join(', ') : msg || tr('error')));
    } finally {
      setBuilding(null);
    }
  }

  async function speedUp() {
    if (!selected || !selectedBuilding?.upgradeEndsAt) return;
    setSpeedingUp(selected);
    try {
      await api.post('/buildings/speedup', { type: selectedBuilding.type, buildingId: selected });
      await refresh();
      setMsg(tr('speedup_done_msg'));
      setSelected(null);
    } catch (e: any) {
      const raw: string = e.response?.data?.message || '';
      const needGems = raw.match(/Need (\d+) gems/);
      setMsg(needGems ? tr('need_gems_speedup', { n: needGems[1] }) : '❌ ' + (raw || tr('error')));
    } finally { setSpeedingUp(null); }
  }

  async function moveBuildingAPI(id: string, gx: number, gy: number) {
    try {
      await api.patch(`/buildings/${id}/position`, { gridX: gx, gridY: gy });
      await refresh();
    } catch (e: any) {
    }
  }
  moveBuildingAPIRef.current = moveBuildingAPI;

  return (
    <div style={{ background: '#060e06', height: '100%', minHeight: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`@keyframes snapPulse { from { opacity:0.3; } to { opacity:0.85; } } @keyframes hammerSwing { from { transform: translateX(-50%) rotate(-30deg); } to { transform: translateX(-50%) rotate(15deg); } } @keyframes buildingGlow { from { filter: drop-shadow(0 0 6px #4fc3f7) drop-shadow(0 0 12px #4fc3f799) drop-shadow(0 4px 8px rgba(0,0,0,0.9)); } to { filter: drop-shadow(0 0 14px #4fc3f7) drop-shadow(0 0 28px #4fc3f7bb) drop-shadow(0 4px 8px rgba(0,0,0,0.9)); } } @keyframes waterDrift { 0% { background-position: 0px 0px, 40px 20px; } 100% { background-position: 160px 80px, 200px 100px; } } @keyframes waterShimmer { 0%,100% { opacity:0.55; } 50% { opacity:1; } }`}</style>

      {/* ── World Event floating button — only visible during announced/active ── */}
      {eventStatus && (
        <button
          onClick={() => setShowEvent(true)}
          style={{ position: 'fixed', bottom: kingdom?.shieldActive ? 44 : 16, right: 14, zIndex: 450, background: 'linear-gradient(135deg,#7b0000,#c82020)', border: '1px solid #ff6666', borderRadius: 20, padding: '5px 10px', color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer', boxShadow: '0 2px 10px rgba(200,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <img src="/assets/fx_attack.png" alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
          {tr('nav_event')}
        </button>
      )}

      {showEvent && <WorldEventPopup onClose={() => setShowEvent(false)} />}

      {/* ── Shield floating indicator ── */}
      {kingdom?.shieldActive && (
        <div style={{ position: 'fixed', bottom: 16, right: 14, zIndex: 450, display: 'flex', alignItems: 'center', gap: 4, color: '#3498db', fontSize: 12, fontWeight: 700, pointerEvents: 'none' }}>
          🛡️<Countdown endsAt={kingdom.shieldUntil} />
        </div>
      )}

      {/* ── Strike banner ── */}
      {(kingdom as any)?.strikeStartedAt && (() => {
        const goldStrike = (kingdom?.workers ?? 0) > 0 && (kingdom?.gold ?? 0) <= 0;
        const foodStrike = (kingdom?.food ?? 0) <= 0;
        const gemStrike  = (kingdom?.gems ?? 0) <= 0;
        const strikeDesc = goldStrike && foodStrike && gemStrike
          ? tr('strike_desc_all')
          : goldStrike && foodStrike
          ? tr('strike_desc_both')
          : goldStrike && gemStrike
          ? tr('strike_desc_gold_gems')
          : foodStrike && gemStrike
          ? tr('strike_desc_food_gems')
          : goldStrike
          ? tr('strike_desc_gold')
          : foodStrike
          ? tr('strike_desc_food')
          : tr('strike_desc_gems');
        return (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'linear-gradient(90deg,#7b0000,#a00)', borderTop: '2px solid #ff4444', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, zIndex: 600 }}>
          <span style={{ fontSize: 20 }}>✊</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#fff' }}>{tr('strike_title')}</div>
            <div style={{ fontSize: 11, color: '#ffaaaa' }}>
              {strikeDesc}
              {' · '}
              <span style={{ fontWeight: 700, color: '#ffdd44' }}>
                {tr('strike_countdown')} <Countdown endsAt={new Date(new Date((kingdom as any).strikeStartedAt).getTime() + 72 * 3_600_000).toISOString()} />
              </span>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ── Map hint ── */}
      <div style={{ textAlign: 'center', fontSize: 10, color: '#3a5a30', padding: '3px 0', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
        {tr('map_hint')}
      </div>


      {/* ── Pannable Map Container ── */}
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onTouchMove={onTouchMove}
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          cursor: isDragging.current ? 'grabbing' : 'grab',
          background: 'radial-gradient(ellipse at 50% 40%, #0f2a0a 0%, #060e06 70%)',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
{/* Zoom controls */}
        <div style={{ position: 'absolute', top: 8, [mapCtrlSide]: 8, zIndex: 400, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button onClick={() => { const nz = Math.min(3, zoom + 0.2); setZoom(nz); setPan(p => clampPan(p.x, p.y, nz)); }} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          <button onClick={() => { const nz = Math.max(0.4, zoom - 0.2); setZoom(nz); setPan(p => clampPan(p.x, p.y, nz)); }} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
          <button
            onClick={() => setMoveModeOn(v => !v)}
            title={moveModeOn ? 'כבה הזזת מבנים' : 'הפעל הזזת מבנים'}
            style={{
              width: 28, height: 28, borderRadius: 6, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15,
              background: moveModeOn ? 'rgba(244,208,63,0.25)' : 'rgba(0,0,0,0.7)',
              border: moveModeOn ? '1.5px solid #f4d03f' : '1px solid rgba(255,255,255,0.15)',
              boxShadow: moveModeOn ? '0 0 8px rgba(244,208,63,0.5)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {moveModeOn ? '🔓' : '🔒'}
          </button>
          <button
            onClick={() => setShowWorkers(true)}
            style={{ width: 28, height: 28, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            🧑
          </button>
        </div>

        {/* Move mode hint */}
        {moveModeOn && (
          <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 400, pointerEvents: 'none', whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.78)', border: '1px solid rgba(244,208,63,0.4)', borderRadius: 20, padding: '6px 16px' }}>
            <span style={{ fontSize: 12, color: '#f4d03f' }}>✋ החזק מבנה והזז למקום הרצוי</span>
          </div>
        )}

        {/* Ground floor — outside scene to avoid drag flicker */}
        <img
          ref={groundImgRef}
          src="/assets/map_ground.png"
          alt=""
          style={{ position: 'absolute', top: 0, left: 0, width: 1088, height: 640, pointerEvents: 'none', zIndex: 1, transformOrigin: '0 0' }}
        />

        {/* Video background — outside scene to avoid scale flicker */}
        <video
          ref={bgImgRef}
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: 1300,
            height: 'auto',
            pointerEvents: 'none',
            zIndex: 0,
            transformOrigin: '0 0',
          }}
        >
          <source src="/assets/map_gb.mp4" type="video/mp4" />
        </video>

        {/* Vignette overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.65) 100%)', pointerEvents: 'none', zIndex: 300 }} />

        {/* Map inner scene */}
        <div style={{
          position: 'absolute',
          left: pan.x,
          top: pan.y,
          width: sceneW,
          height: sceneH,
          willChange: 'transform',
          transform: `scale(${zoom})`,
          zIndex: 2,
          transformOrigin: '0 0',
        }}>



          {/* ── Snap target highlight when dragging a building ── */}
          {snapCell && (() => {
            const { x, y } = isoXY(snapCell.gx, snapCell.gy);
            const px = x - minX;
            const py = y - minY;
            return (
              <div style={{
                position: 'absolute',
                left: px - TILE_W / 2,
                top: py - TILE_H / 2,
                width: TILE_W,
                height: TILE_H,
                clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)',
                background: 'rgba(244,208,63,0.35)',
                border: 'none',
                zIndex: 500,
                pointerEvents: 'none',
                boxSizing: 'border-box',
                animation: 'snapPulse 0.7s ease-in-out infinite alternate',
              }} />
            );
          })()}

          {/* ── Animated characters — workers & soldiers ── */}
          {visibleChars.map(c => {
            const { x, y } = isoXY(c.gx, c.gy);
            const px = x - minX;
            const py = y - minY;
            return (
              // Outer div: handles smooth position transition + flip
              <div
                key={c.id}
                style={{
                  position: 'absolute',
                  left: px - 10,
                  top: py - 22,
                  width: 20,
                  zIndex: 190 + c.gx + c.gy,
                  transition: `left ${c.speed}s ease-in-out, top ${c.speed}s ease-in-out`,
                  pointerEvents: 'none',
                  transform: c.flip ? 'scaleX(-1)' : 'scaleX(1)',
                }}
              >
                {/* Inner span: bob animation + shadow, no conflicting transform */}
                <div style={{ position: 'relative', textAlign: 'center', animation: 'charBob 0.85s ease-in-out infinite', fontSize: 15, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.95))' }}>
                  {c.emoji}
                  <div style={{
                    position: 'absolute',
                    bottom: -2, left: '50%', transform: 'translateX(-50%)',
                    width: 9, height: 3,
                    background: 'rgba(0,0,0,0.4)',
                    borderRadius: '50%',
                    filter: 'blur(1.5px)',
                  }} />
                </div>
              </div>
            );
          })}

          {/* ── Buildings — each sits exactly on its own tile ── */}
          {sortedBuildings.map(b => {
            const pos = getLayout(b.type, b.slot ?? 0, b.gridX, b.gridY)!;
            const cfg = B[b.type];
            const isSelected = selected === b.id;
            const isUpg = !!(b.upgradeEndsAt && new Date() < new Date(b.upgradeEndsAt));
            const isRepairing = !isUpg && !!(b.repairEndsAt && new Date() < new Date(b.repairEndsAt));
            const isDamaged = !isUpg && !isRepairing && !!b.needsRepair;
            const sz = pos.size ?? 1;

            // Position: top corner of the building's grid tile
            const { x, y } = isoXY(pos.gx, pos.gy);
            const px = x - minX;
            const py = y - minY;

            const tW = TILE_W * sz;   // tile diamond width
            const tH = TILE_H * sz;   // tile diamond height
            const BODY = sz === 2 ? 32 : 23;
            const imgW = sz === 2 ? 171 : 111;
            const imgH = imgW;
            const imgTop = sz === 2 ? -104 : -72; // image offset above tile origin
            const vOff = Math.abs(imgTop);        // how far container is raised

            const topColor  = isUpg ? '#3a7ab0' : isRepairing ? '#b05a1a' : cfg.top;
            const leftColor = isUpg ? '#1a3a60' : isRepairing ? '#5a2a08' : cfg.left;
            const rightColor= isUpg ? '#0a1e38' : isRepairing ? '#2e1204' : cfg.right;

            return (
              <div
                key={b.id}
                data-building="true"
                onClick={(e) => { if (!isDragging.current && !dragGhost && hitTestImg(e)) { setSelected(isSelected ? null : b.id); setMsg(''); } }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (!moveModeRef.current) return;
                  const startX = e.clientX, startY = e.clientY;
                  const bId = b.id, bType = b.type;
                  if (longPressTimer.current) clearTimeout(longPressTimer.current);
                  longPressStartPos.current = { x: startX, y: startY };
                  longPressTimer.current = setTimeout(() => {
                    dragBuildingId.current = bId;
                    setDragGhost({ id: bId, type: bType, sx: startX, sy: startY });
                    longPressTimer.current = null;
                    longPressStartPos.current = null;
                  }, 300);
                }}
                onPointerMove={(e) => {
                  if (!dragBuildingId.current && longPressTimer.current && longPressStartPos.current) {
                    const dx = e.clientX - longPressStartPos.current.x;
                    const dy = e.clientY - longPressStartPos.current.y;
                    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                      clearTimeout(longPressTimer.current);
                      longPressTimer.current = null;
                    }
                  }
                }}
                onPointerCancel={() => {
                  if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
                }}
                style={{
                  position: 'absolute',
                  left: px - imgW / 2,
                  top:  py + imgTop - BODY,
                  width: imgW,
                  height: imgH,
                  zIndex: 200 + pos.gx + pos.gy + sz * 10,
                  cursor: 'pointer',
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
              >
                {/* Building visual */}
                {(() => {
                  const imgSrc = (!isRepairing && !isUpg && !isDamaged) ? buildingImg(b.type, b.level) : null;

                  // מבנה הרוס — תמונת חורבה
                  if (isDamaged) {
                    return (
                      <img data-hit src="/assets/ruined_building.png" alt="" style={{
                        position: 'absolute', width: imgW, height: imgH,
                        left: 0, top: 0,
                        pointerEvents: 'none',
                      }} />
                    );
                  }

                  // שדרוג / תיקון — Construction במקום המבנה + אייקון מונפש מעליה
                  if (isUpg || isRepairing) {
                    return (
                      <>
                        <img data-hit src="/assets/construction.png" alt="" style={{
                          position: 'absolute', width: imgW, height: imgH,
                          left: 0, top: 0,
                          pointerEvents: 'none',
                        }} />
                        <span style={{
                          position: 'absolute',
                          left: '50%', top: imgH * 0.1 + 10,
                          fontSize: sz === 2 ? 32 : 22,
                          transform: 'translateX(-50%)',
                          animation: 'hammerSwing 0.5s ease-in-out infinite alternate',
                          display: 'block', pointerEvents: 'none',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
                        }}>{isRepairing ? '🔧' : '🔨'}</span>
                      </>
                    );
                  }

                  if (imgSrc) {
                    return (
                      <img
                        data-hit
                        src={imgSrc}
                        alt={b.type}
                        style={{
                          position: 'absolute',
                          width: imgW, height: imgH,
                          left: 0, top: 0,
                          objectFit: 'contain',
                          pointerEvents: 'none',
                          filter: isSelected ? undefined : 'drop-shadow(0 4px 8px rgba(0,0,0,0.9))',
                          animation: isSelected ? 'buildingGlow 1.2s ease-in-out infinite alternate' : undefined,
                          transition: isSelected ? undefined : 'filter 0.2s',
                        }}
                      />
                    );
                  }

                  // CSS isometric art fallback — offset by vOff since container is raised
                  return (
                    <>
                      <div style={{
                        position: 'absolute', left: 0, top: vOff + tH / 2,
                        width: tW / 2, height: BODY,
                        background: `linear-gradient(180deg,${leftColor},${rightColor})`,
                        transform: 'skewY(30.4deg)', transformOrigin: 'top left',
                      }} />
                      <div style={{
                        position: 'absolute', right: 0, top: vOff + tH / 2,
                        width: tW / 2, height: BODY,
                        background: `linear-gradient(180deg,${rightColor},rgba(0,0,0,0.85))`,
                        transform: 'skewY(-30.4deg)', transformOrigin: 'top right',
                      }} />
                      <div style={{
                        position: 'absolute', left: 0, top: vOff, width: tW, height: tH,
                        clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)',
                        background: `radial-gradient(ellipse at 38% 28%,${topColor},${leftColor})`,
                        boxShadow: isSelected ? `0 0 22px ${cfg.glow}` : `0 0 8px ${cfg.glow}55`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'box-shadow 0.2s',
                      }}>
                        <span style={{ fontSize: sz === 2 ? 26 : 17, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.95))', paddingTop: tH * 0.18 }}>
                          {isRepairing ? '🔧' : cfg.icon}
                        </span>
                      </div>
                      {isSelected && (
                        <div style={{ position:'absolute', inset:-4, boxShadow:`0 0 20px ${cfg.glow}, 0 0 40px ${cfg.glow}44`, pointerEvents:'none', animation:'pulse-glow 1.5s ease-in-out infinite' }} />
                      )}
                    </>
                  );
                })()}

              </div>
            );
          })}

          {/* ── LV badges + fx_selected — always on top of all buildings ── */}
          {sortedBuildings.map(b => {
            const pos = getLayout(b.type, b.slot ?? 0, b.gridX, b.gridY);
            if (!pos) return null;
            const { x, y } = isoXY(pos.gx, pos.gy);
            const px = x - minX;
            const py = y - minY;
            const sz = pos.size || 1;
            const tW = TILE_W * sz;
            const isSelected2 = b.id === selected;
            const isUpg2 = !!b.upgradeEndsAt && new Date(b.upgradeEndsAt) > new Date();
            const isRep2 = !!b.repairEndsAt && new Date(b.repairEndsAt) > new Date();
            const cfg2 = B[b.type] ?? B['town_hall'];
            const imgW2 = sz === 2 ? 114 : 74;
            const imgTop2 = sz === 2 ? -69 : -48;
            const hasImg = !isRep2 && !isUpg2 && !!buildingImg(b.type, b.level);
            return (
              <React.Fragment key={`ov-${b.id}`}>
                {/* fx_selected */}
                {isSelected2 && hasImg && (
                  <img src="/assets/fx_selected.png" alt="" style={{
                    position: 'absolute',
                    width: imgW2 + 16, height: imgW2 + 16,
                    left: px - imgW2 / 2 - 8,
                    top: py + imgTop2 - 85,
                    pointerEvents: 'none', opacity: 0.85,
                    zIndex: 50000,
                  }} />
                )}
                {/* LV badge */}
                <div style={{
                  position: 'absolute',
                  left: px, top: py - 117,
                  transform: 'translateX(-50%)',
                  background: isSelected2 ? cfg2.top : isUpg2 ? 'rgba(52,152,219,0.97)' : isRep2 ? 'rgba(200,90,20,0.97)' : 'rgba(0,0,0,0.85)',
                  border: `1px solid ${isSelected2 ? cfg2.top : isUpg2 ? '#3498db' : isRep2 ? '#e07030' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: 10, padding: '2px 7px', fontSize: 9, fontWeight: 800,
                  color: isSelected2 ? '#000' : '#fff', whiteSpace: 'nowrap',
                  boxShadow: isSelected2 ? `0 0 8px ${cfg2.glow}` : 'none',
                  zIndex: 50001, pointerEvents: 'none',
                }}>
                  {isUpg2 ? <><span>⏳ </span><Countdown endsAt={b.upgradeEndsAt} /></> : isRep2 ? <><span>🔧 </span><Countdown endsAt={b.repairEndsAt} /></> : (
                    <span style={{ display:'flex', alignItems:'center', gap:3 }}>
                      {({ gold_mine:'gold', lumber_mill:'wood', stone_quarry:'stone', farm:'food', gem_forge:'gem' } as Record<string,string>)[b.type]
                        ? <img src={`/assets/icon_${{ gold_mine:'gold', lumber_mill:'wood', stone_quarry:'stone', farm:'food', gem_forge:'gem' }[b.type]}.png`} style={{ width:10, height:10, objectFit:'contain' }} />
                        : <span>{cfg2.icon}</span>}
                      {`Lv.${b.level}`}
                    </span>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>


        {/* Build new building button */}
        {availableToBuild.length > 0 && (
          <button
            onClick={() => { setSelected(null); setBuildModal(true); }}
            style={{
              position: 'absolute', bottom: 10, left: 10,
              background: 'linear-gradient(135deg,#27ae60,#1a8a40)',
              border: '1px solid rgba(39,174,96,0.5)',
              borderRadius: 12, padding: '8px 14px',
              color: '#fff', fontWeight: 800, fontSize: 13,
              boxShadow: '0 0 16px rgba(39,174,96,0.4)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {tr('build_new_btn')}
          </button>
        )}
      </div>

      {/* ── Selected building panel (slides up from bottom) ── */}
      {selected && selectedBuilding && (
        <div style={{
          position: 'absolute', bottom: 14, left: 10, right: 10,
          background: 'linear-gradient(135deg,rgba(8,18,6,0.98),rgba(14,28,10,0.98))',
          border: `1px solid ${B[selectedType]?.top || '#f4d03f'}55`,
          borderRadius: 18, padding: 14,
          boxShadow: `0 -4px 30px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)`,
          animation: 'slideUp 0.2s ease-out',
          zIndex: 400,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `linear-gradient(135deg,${B[selectedType]?.left},${B[selectedType]?.right})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 14px ${B[selectedType]?.glow}`,
                overflow: 'hidden', flexShrink: 0,
              }}>
                {buildingImg(selectedType, selectedBuilding?.level ?? 1)
                  ? <img src={buildingImg(selectedType, selectedBuilding?.level ?? 1)!} alt="" style={{ width: 52, height: 52, objectFit: 'contain' }} />
                  : <span style={{ fontSize: 22 }}>{B[selectedType]?.icon}</span>
                }
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: B[selectedType]?.top }}>{tr('b_' + selectedType) || B[selectedType]?.label}</div>
                <div style={{ fontSize: 11, color: '#a0845a' }}>{tr('blvl', { n: selectedBuilding.level })}</div>
              </div>
            </div>
            <button onClick={() => { setSelected(null); setMsg(''); }} style={{ background: 'none', border: 'none', color: '#444', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          </div>

          {/* Level bar */}
          <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(selectedBuilding.level / 30) * 100}%`, background: `linear-gradient(90deg,${B[selectedType]?.left},${B[selectedType]?.top})`, borderRadius: 3, transition: 'width 0.5s' }} />
          </div>

          {/* Building stats */}
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '8px 12px', marginBottom: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
            {buildingStats(selectedType, selectedBuilding.level, tr, Math.max(1, kingdom?.explorerCount ?? 1), !!(kingdom?.vipExpiresAt && new Date() < new Date(kingdom.vipExpiresAt))).map((line, i) => (
              <div key={i} style={{ fontSize: 11, color: '#c8a875', lineHeight: 1.6 }}>{line}</div>
            ))}
          </div>

          {selectedBuilding.upgradeEndsAt && new Date() < new Date(selectedBuilding.upgradeEndsAt) ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1, textAlign: 'center', color: '#3498db', fontSize: 13 }}>⏳ <Countdown endsAt={selectedBuilding.upgradeEndsAt} /></div>
              <button
                className="btn"
                style={{ background: 'linear-gradient(135deg,#9b59b6,#6c3483)', color: '#fff', padding: '10px 14px', fontSize: 12, borderRadius: 10 }}
                disabled={!!speedingUp}
                onClick={speedUp}
              >
                {speedingUp ? '...' : tr('speedup_btn', { n: Math.max(1, Math.ceil(Math.max(0, (new Date(selectedBuilding.upgradeEndsAt).getTime() - Date.now()) / 60000))) })}
              </button>
            </div>
          ) : (() => {
            if (selectedType === 'gem_forge') {
              const usdtCost = parseFloat(((selectedBuilding.level + 1) * 0.05).toFixed(2));
              const usdtBal = (kingdom as any)?.usdtBalance ?? 0;
              const canAfford = usdtBal >= usdtCost && selectedBuilding.level < 30;
              return (
                <>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    <div style={{ background: canAfford ? 'rgba(26,175,191,0.15)' : 'rgba(231,76,60,0.15)', border: `1px solid ${canAfford ? 'rgba(26,175,191,0.4)' : 'rgba(231,76,60,0.3)'}`, borderRadius: 8, padding: '5px 10px', fontSize: 12 }}>
                      <img src="/assets/icon_dollar.png" alt="$" style={{ width:13, height:13, objectFit:'contain', verticalAlign:'middle', marginRight:3 }} />
                      <strong style={{ color: canAfford ? '#1aafbf' : '#e74c3c' }}>${usdtCost} USDT</strong>
                      <span style={{ color: '#666', fontSize: 10 }}> / {tr('balance_label')}: ${usdtBal.toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    className="btn"
                    style={{ width: '100%', padding: '12px', fontSize: 14, opacity: canAfford ? 1 : 0.5, borderRadius: 12, background: 'linear-gradient(135deg,#0d7080,#1aafbf)', color: '#fff', border: 'none' }}
                    disabled={!!upgrading || !canAfford}
                    onClick={upgrade}
                  >
                    {upgrading ? '⏳...' : canAfford ? tr('gem_forge_upgrade_btn').replace('{level}', String(selectedBuilding.level + 1)).replace('{cost}', `$${usdtCost}`) : selectedBuilding.level >= 30 ? tr('gem_forge_max_level') : tr('gem_forge_insufficient')}
                  </button>
                </>
              );
            }
            const cost = upgradeCost(selectedType, selectedBuilding.level);
            const canAfford = (kingdom?.gold ?? 0) >= cost.gold && (kingdom?.wood ?? 0) >= cost.wood && (kingdom?.stone ?? 0) >= cost.stone;
            return (
              <>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                  {cost.gold > 0 && <CostBadge icon="💰" val={cost.gold} have={kingdom?.gold ?? 0} color="#f4d03f" />}
                  {cost.wood > 0 && <CostBadge icon="🪵" val={cost.wood} have={kingdom?.wood ?? 0} color="#a0682a" />}
                  {cost.stone > 0 && <CostBadge icon="🪨" val={cost.stone} have={kingdom?.stone ?? 0} color="#aaa" />}
                </div>
                <button
                  className="btn btn-gold"
                  style={{ width: '100%', padding: '12px', fontSize: 14, opacity: canAfford ? 1 : 0.5, borderRadius: 12 }}
                  disabled={!!upgrading || !canAfford}
                  onClick={upgrade}
                >
                  {upgrading ? '⏳...' : canAfford ? tr('upgrade_to_lvl', { n: selectedBuilding.level + 1 }) : tr('not_enough_resources')}
                </button>
              </>
            );
          })()}

          {['gold_mine','lumber_mill','stone_quarry','farm'].includes(selectedType) && (
            <div style={{ fontSize: 11, color: '#a0845a', marginTop: 8, textAlign: 'center', padding: '5px 8px', background: 'rgba(244,208,63,0.05)', borderRadius: 6 }}>
              {tr('storage_upgrade_hint')}
            </div>
          )}
          {msg && <div style={{ textAlign: 'center', fontSize: 12, marginTop: 8, color: msg.startsWith('⬆️') || msg.startsWith('⚡') ? '#27ae60' : '#e74c3c' }}>{msg}</div>}
        </div>
      )}

      {/* ── Drag ghost overlay ── */}
      {dragGhost && (
        <div style={{
          position: 'fixed',
          left: dragGhost.sx - 18,
          top: dragGhost.sy - 36,
          zIndex: 9999,
          pointerEvents: 'none',
          fontSize: 28,
          opacity: 0.65,
          filter: 'drop-shadow(0 0 8px rgba(244,208,63,0.8))',
          transition: 'none',
        }}>
          {B[dragGhost.type]?.icon ?? '🏗️'}
        </div>
      )}

      {/* ── Workers Panel ── */}
      {showWorkers && (
        <WorkersPanel onClose={() => { setShowWorkers(false); refresh(); }} />
      )}

      {/* ── Rename / Change Flag Modal ── */}
      {showRename && <RenameModal current={kingdom?.name ?? ''} onClose={() => setShowRename(false)} onSaved={() => { setShowRename(false); refresh(); }} />}

      {/* ── Build Modal ── */}
      {buildModal && (
        <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-end' }}
          onClick={e => { if (e.target === e.currentTarget) setBuildModal(false); }}>
          <div style={{
            width:'100%', maxHeight:'75vh', overflowY:'auto',
            background:'linear-gradient(180deg,#0a1a08,#060e06)',
            borderRadius:'20px 20px 0 0',
            border:'1px solid rgba(39,174,96,0.3)',
            padding:'20px 14px 140px',
            animation:'slideUp 0.25s ease-out',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontSize:18, fontWeight:800, color:'#27ae60' }}>{tr('build_modal_title')}</div>
              <button onClick={() => setBuildModal(false)} style={{ background:'none', border:'none', color:'#555', fontSize:22, cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ fontSize:12, color:'#a0845a', marginBottom:buildMsg ? 8 : 16 }}>
              {tr('build_modal_desc')}
            </div>
            {buildMsg && (
              <div style={{ padding:'10px 14px', borderRadius:10, marginBottom:14, background:'rgba(231,76,60,0.15)', border:'1px solid #e74c3c44', color:'#e74c3c', fontSize:13, textAlign:'center' }}>
                {buildMsg}
              </div>
            )}

            {availableToBuild.length === 0 ? (
              <div style={{ textAlign:'center', color:'#a0845a', padding:40 }}>{tr('all_buildings_built')}</div>
            ) : availableToBuild.map(type => {
              const cfg = B[type];
              const isGemForge = type === 'gem_forge';
              const baseCost = costFor(type);
              const vipLocked = type === 'arcane_tower' && !kingdom?.isVip;
              const usdtBal = (kingdom as any)?.usdtBalance ?? 0;
              const canAfford = isGemForge
                ? usdtBal >= 0.1
                : !vipLocked && (kingdom?.gold ?? 0) >= baseCost.gold && (kingdom?.wood ?? 0) >= baseCost.wood && (kingdom?.stone ?? 0) >= baseCost.stone;
              const dupCount = countOfType(type);
              const desc = (BUILD_DESC[type] ?? '') + (dupCount > 0 ? ` ${tr('copy_num', { n: dupCount + 1 })}` : '');

              return (
                <div key={type} style={{
                  background: canAfford ? 'linear-gradient(135deg,rgba(20,40,15,0.9),rgba(10,25,8,0.9))' : 'rgba(0,0,0,0.4)',
                  border:`1px solid ${canAfford ? cfg.top + '44' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius:14, padding:14, marginBottom:10,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                    <div style={{
                      width:46, height:46, borderRadius:12,
                      background:`linear-gradient(135deg,${cfg.left},${cfg.right})`,
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:24,
                      boxShadow:`0 0 12px ${cfg.glow}`,
                    }}>{cfg.icon}</div>
                    <div>
                      <div style={{ fontWeight:800, fontSize:15, color:cfg.top }}>{tr('b_' + type)}</div>
                      <div style={{ fontSize:11, color:'#a0845a', marginTop:2 }}>{desc}</div>
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
                    {isGemForge ? (
                      <div style={{ background: canAfford ? 'rgba(26,175,191,0.15)' : 'rgba(231,76,60,0.15)', border:`1px solid ${canAfford ? 'rgba(26,175,191,0.4)' : 'rgba(231,76,60,0.3)'}`, borderRadius:8, padding:'5px 10px', fontSize:12 }}>
                        <strong style={{ color: canAfford ? '#1aafbf' : '#e74c3c', display:'flex', alignItems:'center', gap:3 }}><img src="/assets/icon_dollar.png" alt="$" style={{ width:13, height:13, objectFit:'contain' }} /> 0.1 USDT</strong>
                        <span style={{ color:'#666', fontSize:10 }}> / יתרה: ${usdtBal.toFixed(2)}</span>
                      </div>
                    ) : (
                      <>
                        {baseCost.gold > 0 && <CostBadge icon="💰" val={baseCost.gold} have={kingdom?.gold ?? 0} color="#f4d03f" />}
                        {baseCost.wood > 0 && <CostBadge icon="🪵" val={baseCost.wood} have={kingdom?.wood ?? 0} color="#a0682a" />}
                        {baseCost.stone > 0 && <CostBadge icon="🪨" val={baseCost.stone} have={kingdom?.stone ?? 0} color="#aaa" />}
                      </>
                    )}
                  </div>

                  {vipLocked ? (
                    <div style={{ textAlign:'center', padding:'10px', background:'rgba(241,196,15,0.08)', borderRadius:8, border:'1px solid rgba(241,196,15,0.25)', fontSize:12, color:'#f1c40f' }}>
                      {tr('vip_required_shop')}
                    </div>
                  ) : (
                    <button
                      className="btn btn-gold"
                      style={{ width:'100%', padding:'11px', fontSize:14, opacity:canAfford ? 1 : 0.4, borderRadius:10 }}
                      disabled={!canAfford || building === type}
                      onClick={() => buildNew(type)}
                    >
                      {building === type ? '⏳...' : canAfford ? tr('build_btn', { name: tr('b_' + type) }) : tr('not_enough_resources')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const RES_ICON: Record<string, string> = {
  '💰': '/assets/icon_gold.png',
  '🪵': '/assets/icon_wood.png',
  '🪨': '/assets/icon_stone.png',
  '🌾': '/assets/icon_food.png',
  '💎': '/assets/icon_gem.png',
  '💵': '/assets/icon_dollar.png',
};

const KINGDOM_FLAGS = ['🏰','⚔️','🛡️','🦁','🐉','🌟','💎','🔥','❄️','🌙','⚡','🌊','🗡️','👑','🏯'];

function RenameModal({ current, onClose, onSaved }: { current: string; onClose: () => void; onSaved: () => void }) {
  const t = useT();
  const lang = localStorage.getItem('kw_lang') || 'en';
  // parse existing flag + name
  const firstChar = [...current][0] ?? '';
  const hasFlag = KINGDOM_FLAGS.includes(firstChar);
  const [flag, setFlag] = useState(hasFlag ? firstChar : '🏰');
  const [name, setName] = useState(hasFlag ? current.slice([...current][0].length).trimStart() : current);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    const trimmed = name.trim();
    if (trimmed.length < 3) { setError(lang === 'he' ? 'שם קצר מדי (מינימום 3)' : 'Name too short (min 3)'); return; }
    if (trimmed.length > 20) { setError(lang === 'he' ? 'שם ארוך מדי (מקסימום 20)' : 'Name too long (max 20)'); return; }
    setLoading(true);
    try {
      await api.post('/kingdom/rename', { name: `${flag} ${trimmed}` });
      onSaved();
    } catch { setLoading(false); setError(lang === 'he' ? 'שגיאה, נסה שוב' : 'Error, try again'); }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:700, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width:'100%', maxWidth:380, background:'linear-gradient(180deg,#1a0a00,#0d1200)', border:'1px solid rgba(244,208,63,0.35)', borderRadius:20, padding:24 }}>
        <div style={{ textAlign:'center', marginBottom:18 }}>
          <div style={{ fontSize:46 }}>{flag}</div>
          <div style={{ fontSize:16, fontWeight:800, color:'#f4d03f', marginTop:6 }}>
            {lang === 'he' ? '✏️ ערוך ממלכה' : '✏️ Edit Kingdom'}
          </div>
        </div>
        <input
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
          maxLength={20}
          style={{ width:'100%', padding:'12px 14px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:`1px solid ${error ? '#e74c3c' : 'rgba(244,208,63,0.3)'}`, color:'#f4d03f', fontSize:15, fontWeight:700, outline:'none', boxSizing:'border-box', textAlign:'center', marginBottom:6 }}
          onKeyDown={e => e.key === 'Enter' && save()}
        />
        {error && <div style={{ color:'#e74c3c', fontSize:11, textAlign:'center', marginBottom:6 }}>{error}</div>}
        <div style={{ fontSize:11, color:'#666', textAlign:'center', marginBottom:8 }}>
          {lang === 'he' ? 'בחר דגל:' : 'Choose flag:'}
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:7, justifyContent:'center', marginBottom:20 }}>
          {KINGDOM_FLAGS.map(f => (
            <button key={f} onClick={() => setFlag(f)} style={{ width:40, height:40, borderRadius:9, fontSize:20, background: flag===f ? 'rgba(244,208,63,0.2)' : 'rgba(255,255,255,0.05)', border:`2px solid ${flag===f ? '#f4d03f' : 'rgba(255,255,255,0.08)'}`, cursor:'pointer', transform: flag===f ? 'scale(1.12)' : 'scale(1)', transition:'all 0.12s' }}>{f}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'12px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#aaa', fontSize:14, cursor:'pointer' }}>
            {lang === 'he' ? 'ביטול' : 'Cancel'}
          </button>
          <button onClick={save} disabled={loading || name.trim().length < 3} style={{ flex:2, padding:'12px', borderRadius:10, background: name.trim().length >= 3 ? 'linear-gradient(135deg,#f39c12,#f4d03f)' : 'rgba(255,255,255,0.06)', border:'none', color: name.trim().length >= 3 ? '#000' : '#555', fontSize:14, fontWeight:800, cursor: name.trim().length >= 3 ? 'pointer' : 'not-allowed' }}>
            {loading ? '...' : (lang === 'he' ? '💾 שמור' : '💾 Save')}
          </button>
        </div>
      </div>
    </div>
  );
}

function CostBadge({ icon, val, have, color }: { icon: string; val: number; have: number; color: string }) {
  const ok = have >= val;
  const imgSrc = RES_ICON[icon];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      background: ok ? 'rgba(0,0,0,0.4)' : 'rgba(60,0,0,0.4)',
      borderRadius: 8, padding: '4px 10px',
      border: `1px solid ${ok ? color + '33' : '#e74c3c44'}`,
    }}>
      {imgSrc
        ? <img src={imgSrc} alt={icon} style={{ width: 14, height: 14, objectFit: 'contain' }} />
        : <span style={{ fontSize: 13 }}>{icon}</span>
      }
      <span style={{ fontSize: 12, fontWeight: 700, color: ok ? color : '#e74c3c' }}>{fmt(val)}</span>
    </div>
  );
}
