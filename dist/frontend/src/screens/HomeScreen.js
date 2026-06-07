"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HomeScreen;
const react_1 = require("react");
const gameStore_1 = require("../store/gameStore");
const format_1 = require("../utils/format");
const useT_1 = require("../i18n/useT");
const Countdown_1 = require("../components/Countdown");
const client_1 = require("../api/client");
const costs_1 = require("../utils/costs");
const WorkersPanel_1 = require("../components/WorkersPanel");
const B = {
    town_hall: { icon: '🏛️', top: '#c8a040', left: '#7a5c18', right: '#4a3808', glow: 'rgba(200,160,64,0.8)', label: 'בית העיר' },
    gold_mine: { icon: '⛏️', top: '#d4a820', left: '#8a6010', right: '#5a3808', glow: 'rgba(212,168,32,0.7)', label: 'מכרה זהב' },
    lumber_mill: { icon: '🪵', top: '#5a8c30', left: '#2c5018', right: '#183008', glow: 'rgba(90,140,48,0.7)', label: 'טחנת עץ' },
    stone_quarry: { icon: '🪨', top: '#808890', left: '#505860', right: '#303840', glow: 'rgba(128,136,144,0.6)', label: 'מחצבה' },
    farm: { icon: '🌾', top: '#78c030', left: '#407818', right: '#285008', glow: 'rgba(120,192,48,0.7)', label: 'חווה' },
    barracks: { icon: '⚔️', top: '#c03030', left: '#781818', right: '#480808', glow: 'rgba(192,48,48,0.7)', label: 'בסיס צבאי' },
    academy: { icon: '📚', top: '#9050c8', left: '#502878', right: '#300858', glow: 'rgba(144,80,200,0.7)', label: 'אקדמיה' },
    wall: { icon: '🧱', top: '#909090', left: '#585858', right: '#383838', glow: 'rgba(144,144,144,0.6)', label: 'חומה' },
    watch_tower: { icon: '🗼', top: '#3090d8', left: '#185888', right: '#083058', glow: 'rgba(48,144,216,0.7)', label: 'מגדל שמירה' },
    hospital: { icon: '🏥', top: '#e74c3c', left: '#922b21', right: '#641e16', glow: 'rgba(231,76,60,0.7)', label: 'בית חולים' },
    arcane_tower: { icon: '🔮', top: '#9b59b6', left: '#5b2c6f', right: '#3a1a45', glow: 'rgba(155,89,182,0.7)', label: 'מגדל ארקני' },
};
const GRID = 16;
const TILE_W = 64, TILE_H = 32;
const LAYOUT = {
    town_hall: { gx: 7, gy: 7, size: 2 },
    barracks: { gx: 5, gy: 4 },
    academy: { gx: 4, gy: 6 },
    wall: { gx: 8, gy: 3 },
    watch_tower: { gx: 11, gy: 4 },
    hospital: { gx: 11, gy: 6 },
    gold_mine: { gx: 4, gy: 10 },
    stone_quarry: { gx: 4, gy: 8 },
    lumber_mill: { gx: 11, gy: 10 },
    farm: { gx: 11, gy: 8 },
    arcane_tower: { gx: 5, gy: 12 },
};
const EXTRA_POSITIONS = {
    gold_mine: [{ gx: 5, gy: 11 }, { gx: 4, gy: 12 }],
    stone_quarry: [{ gx: 3, gy: 9 }, { gx: 3, gy: 10 }],
    lumber_mill: [{ gx: 12, gy: 10 }, { gx: 12, gy: 11 }],
    farm: [{ gx: 12, gy: 8 }, { gx: 12, gy: 9 }],
};
function buildingStats(type, level, t) {
    const fmt2 = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.floor(n));
    const prod = (base) => fmt2(base * Math.pow(1.12, level - 1));
    const prodNext = (base) => fmt2(base * Math.pow(1.12, level));
    const storage = (base) => fmt2(base * (1 + (level - 1) * 0.3));
    const BARRACKS_UNLOCKS = {
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
            t('stat_max_lv', { n: level < 3 ? 3 : level < 5 ? 5 : level < 8 ? 8 : level < 12 ? 12 : level < 16 ? 16 : 20 }),
            t('stat_radius', { n: 5 + Math.floor(level / 2) }),
        ];
        case 'gold_mine': return [
            t('stat_prod_now', { n: prod(100), res: t('gold') }),
            t('stat_prod_next', { n: level + 1, next: prodNext(100), res: t('gold') }),
        ];
        case 'lumber_mill': return [
            t('stat_prod_now', { n: prod(80), res: t('wood') }),
            t('stat_prod_next', { n: level + 1, next: prodNext(80), res: t('wood') }),
        ];
        case 'stone_quarry': return [
            t('stat_prod_now', { n: prod(60), res: t('stone') }),
            t('stat_prod_next', { n: level + 1, next: prodNext(60), res: t('stone') }),
        ];
        case 'farm': return [
            t('stat_prod_now', { n: prod(50), res: t('food') }),
            t('stat_prod_next', { n: level + 1, next: prodNext(50), res: t('food') }),
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
        case 'academy': return [
            t('stat_prod_boost', { n: level * 2 }),
            t('stat_prod_boost_next', { n: level + 1, next: (level + 1) * 2 }),
            t('stat_research'),
        ];
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
            t('stat_arcane_atk', { n: level * 10 }),
            t('stat_arcane_next', { n: level + 1, next: (level + 1) * 10 }),
            t('stat_arcane_vip'),
        ];
        default: return [t('stat_upgrade_default')];
    }
}
function getLayout(type, slot) {
    if (slot > 0 && EXTRA_POSITIONS[type]) {
        return EXTRA_POSITIONS[type][slot - 1] ?? LAYOUT[type];
    }
    return LAYOUT[type];
}
function tileStatus(gx, gy, buildingCount, thLevel) {
    const center = 8;
    const dist = Math.max(Math.abs(gx - center), Math.abs(gy - center));
    const settled = 2 + Math.floor(buildingCount / 2);
    const wild = settled + 2 + Math.floor(thLevel / 2);
    if (dist <= settled)
        return 'settled';
    if (dist === settled + 1)
        return 'wall';
    if (dist <= wild)
        return 'wilderness';
    return 'locked';
}
function tileType(gx, gy) {
    const cx = 8;
    if ((gx >= 6 && gx <= 9) && (gy === 5 || gy === 10))
        return 'path';
    if ((gy >= 5 && gy <= 10) && (gx === 5 || gx === 10))
        return 'path';
    if (gx >= 5 && gx <= 10 && gy >= 5 && gy <= 10)
        return 'dirt';
    if (gx <= 1 || gy <= 1 || gx >= 14 || gy >= 14)
        return 'water';
    if (gx === 2 || gy === 2 || gx === 13 || gy === 13)
        return 'forest';
    if ((gx + gy) % 5 === 0)
        return 'rock';
    if ((gx * 3 + gy * 2) % 7 === 0)
        return 'grass2';
    return 'grass1';
}
const TERRAIN = {
    grass1: { top: '#4aaa28', left: '#2d6818', right: '#1a400c' },
    grass2: { top: '#3d9820', left: '#266014', right: '#163a0a' },
    path: { top: '#c8a060', left: '#8a6030', right: '#503818' },
    dirt: { top: '#9a7848', left: '#6a5030', right: '#3a2c18' },
    rock: { top: '#7a7a80', left: '#4a4a58', right: '#2a2a38' },
    forest: { top: '#2a6a10', left: '#164008', right: '#0a2004' },
    water: { top: '#2a5890', left: '#183858', right: '#0c2038' },
};
function isoXY(gx, gy) {
    return {
        x: (gx - gy) * (TILE_W / 2),
        y: (gx + gy) * (TILE_H / 2),
    };
}
function HomeScreen() {
    const { kingdom, buildings, productionRates, refresh } = (0, gameStore_1.useGameStore)();
    const tr = (0, useT_1.useT)();
    const [selected, setSelected] = (0, react_1.useState)(null);
    const [upgrading, setUpgrading] = (0, react_1.useState)(null);
    const [speedingUp, setSpeedingUp] = (0, react_1.useState)(null);
    const [msg, setMsg] = (0, react_1.useState)('');
    const [buildModal, setBuildModal] = (0, react_1.useState)(false);
    const [building, setBuilding] = (0, react_1.useState)(null);
    const [buildMsg, setBuildMsg] = (0, react_1.useState)('');
    const containerRef = (0, react_1.useRef)(null);
    const [pan, setPan] = (0, react_1.useState)({ x: 0, y: 0 });
    const dragRef = (0, react_1.useRef)(null);
    const isDragging = (0, react_1.useRef)(false);
    const selectedBuilding = buildings.find(b => b.id === selected);
    const selectedType = selectedBuilding?.type ?? '';
    const thBuilding = buildings.find(b => b.type === 'town_hall');
    const thLevel = thBuilding?.level ?? 1;
    const wallBuilding = buildings.find(b => b.type === 'wall');
    const wallLevel = wallBuilding?.level ?? 0;
    const totalPower = buildings.reduce((sum, b) => sum + b.level, 0);
    const playerLevel = Math.floor(Math.sqrt((kingdom?.score || 0) / 10)) + 1;
    const [showWorkers, setShowWorkers] = (0, react_1.useState)(false);
    const WORKER_ROUTES = [
        [[8, 8], [4, 10], [8, 8], [4, 8], [8, 8]],
        [[8, 8], [11, 10], [8, 8], [11, 8], [8, 8]],
        [[8, 9], [7, 8], [8, 8], [9, 8], [8, 9]],
    ];
    const GUARD_ROUTE = [[5, 3], [8, 3], [11, 4], [12, 7], [11, 10], [8, 12], [5, 12], [3, 9], [3, 6], [5, 3]];
    const SOLDIER_ROUTES = [
        [[5, 4], [4, 6], [8, 8], [5, 4]],
        [[11, 4], [11, 6], [8, 8], [11, 4]],
        [[5, 4], [8, 8], [11, 4], [11, 6], [4, 6], [5, 4]],
    ];
    const numWorkers = Math.min(Math.max(kingdom?.workers ?? 0, 1), 3);
    const storeUnits = (0, gameStore_1.useGameStore)(s => s.units);
    const totalUnits = storeUnits?.reduce((a, u) => a + (u.count || 0), 0) ?? 0;
    const numSoldiers = Math.min(Math.floor(totalUnits / 80) + 1, 3);
    const [chars, setChars] = (0, react_1.useState)(() => {
        const list = [];
        for (let i = 0; i < 3; i++) {
            const r = WORKER_ROUTES[i];
            list.push({ id: `w${i}`, emoji: '👷', gx: r[0][0], gy: r[0][1], wpIdx: 0, route: r, speed: 2.8 + i * 0.5, flip: false });
        }
        list.push({ id: 'g0', emoji: '💂', gx: GUARD_ROUTE[0][0], gy: GUARD_ROUTE[0][1], wpIdx: 0, route: GUARD_ROUTE, speed: 3.5, flip: false });
        for (let i = 0; i < 3; i++) {
            const r = SOLDIER_ROUTES[i];
            list.push({ id: `s${i}`, emoji: '🪖', gx: r[0][0], gy: r[0][1], wpIdx: 0, route: r, speed: 2.4 + i * 0.4, flip: false });
        }
        return list;
    });
    (0, react_1.useEffect)(() => {
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
        if (c.id.startsWith('w'))
            return parseInt(c.id[1]) < numWorkers;
        if (c.id === 'g0')
            return true;
        return parseInt(c.id[1]) < numSoldiers;
    });
    const allCorners = [isoXY(0, 0), isoXY(GRID, 0), isoXY(0, GRID), isoXY(GRID, GRID)];
    const minX = Math.min(...allCorners.map(c => c.x)) - TILE_W;
    const maxX = Math.max(...allCorners.map(c => c.x)) + TILE_W;
    const minY = Math.min(...allCorners.map(c => c.y)) - TILE_H;
    const maxY = Math.max(...allCorners.map(c => c.y)) + TILE_H + 120;
    const sceneW = maxX - minX;
    const sceneH = maxY - minY;
    (0, react_1.useEffect)(() => {
        const containerW = containerRef.current?.clientWidth ?? window.innerWidth;
        const containerH = containerRef.current?.clientHeight ?? 400;
        const th = LAYOUT.town_hall;
        const thPos = isoXY(th.gx + 1, th.gy + 1);
        setPan({
            x: containerW / 2 - (thPos.x - minX),
            y: containerH / 2 - (thPos.y - minY) - 40,
        });
    }, []);
    const onPointerDown = (0, react_1.useCallback)((e) => {
        if (e.target.closest('[data-building]'))
            return;
        isDragging.current = false;
        dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
        e.currentTarget.setPointerCapture(e.pointerId);
    }, [pan]);
    const onPointerMove = (0, react_1.useCallback)((e) => {
        if (!dragRef.current)
            return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5)
            isDragging.current = true;
        if (isDragging.current) {
            setPan({ x: dragRef.current.panX + dx, y: dragRef.current.panY + dy });
        }
    }, []);
    const onPointerUp = (0, react_1.useCallback)(() => {
        dragRef.current = null;
        setTimeout(() => { isDragging.current = false; }, 10);
    }, []);
    const buildingCount = buildings.length;
    const tiles = (0, react_1.useMemo)(() => {
        const t = [];
        for (let gy = 0; gy < GRID; gy++)
            for (let gx = 0; gx < GRID; gx++)
                t.push({ gx, gy, type: tileType(gx, gy), status: tileStatus(gx, gy, buildingCount, thLevel) });
        return t.sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));
    }, [thLevel, buildingCount]);
    const wallPerimH = wallLevel > 0 ? Math.min(8 + wallLevel * 4, 40) : 0;
    const sortedBuildings = (0, react_1.useMemo)(() => [...buildings].filter(b => getLayout(b.type, b.slot ?? 0))
        .sort((a, b) => {
        const la = getLayout(a.type, a.slot ?? 0), lb = getLayout(b.type, b.slot ?? 0);
        return (la.gx + la.gy + (la.size || 1)) - (lb.gx + lb.gy + (lb.size || 1));
    }), [buildings]);
    async function upgrade() {
        if (!selected || !selectedBuilding)
            return;
        setUpgrading(selected);
        setMsg('');
        try {
            await client_1.api.post('/buildings/upgrade', { type: selectedBuilding.type, buildingId: selected });
            await refresh();
            setMsg(tr('upgrade_started_msg'));
            setSelected(null);
        }
        catch (e) {
            setMsg('❌ ' + (e.response?.data?.message || tr('error')));
        }
        finally {
            setUpgrading(null);
        }
    }
    const BUILDABLE = ['academy', 'wall', 'watch_tower', 'hospital', 'arcane_tower'];
    const RESOURCE_BUILDABLE = ['gold_mine', 'lumber_mill', 'stone_quarry', 'farm'];
    const countOfType = (t) => buildings.filter(b => b.type === t).length;
    const existingTypes = buildings.map(b => b.type);
    const BUILD_COSTS = {
        academy: { gold: 500, wood: 300, stone: 200 },
        wall: { gold: 200, wood: 0, stone: 400 },
        watch_tower: { gold: 150, wood: 200, stone: 100 },
        hospital: { gold: 300, wood: 200, stone: 100 },
        arcane_tower: { gold: 800, wood: 400, stone: 400 },
        gold_mine: { gold: 200, wood: 100, stone: 0 },
        lumber_mill: { gold: 150, wood: 0, stone: 100 },
        stone_quarry: { gold: 150, wood: 100, stone: 0 },
        farm: { gold: 100, wood: 150, stone: 0 },
    };
    const BUILD_DESC = {
        academy: tr('bd_academy'), wall: tr('bd_wall'),
        watch_tower: tr('bd_watch_tower'), hospital: tr('bd_hospital'),
        arcane_tower: tr('bd_arcane_tower'), gold_mine: tr('bd_gold_mine'),
        lumber_mill: tr('bd_lumber_mill'), stone_quarry: tr('bd_stone_quarry'), farm: tr('bd_farm'),
    };
    const availableToBuild = [
        ...BUILDABLE.filter(t => !existingTypes.includes(t)),
        ...RESOURCE_BUILDABLE.filter(t => countOfType(t) < 3),
    ];
    function costFor(type) {
        const base = BUILD_COSTS[type] ?? { gold: 200, wood: 100, stone: 100 };
        const mult = RESOURCE_BUILDABLE.includes(type)
            ? Math.pow(2, countOfType(type)) : 1;
        return { gold: Math.floor(base.gold * mult), wood: Math.floor(base.wood * mult), stone: Math.floor(base.stone * mult) };
    }
    async function buildNew(type) {
        setBuilding(type);
        setBuildMsg('');
        try {
            await client_1.api.post('/buildings/build', { type });
            await refresh();
            setBuildModal(false);
            setMsg(tr('building_built', { name: tr('b_' + type) }));
        }
        catch (e) {
            setBuildMsg('❌ ' + (e.response?.data?.message || tr('error')));
        }
        finally {
            setBuilding(null);
        }
    }
    async function speedUp() {
        if (!selected || !selectedBuilding?.upgradeEndsAt)
            return;
        setSpeedingUp(selected);
        try {
            await client_1.api.post('/buildings/speedup', { type: selectedBuilding.type, buildingId: selected });
            await refresh();
            setMsg(tr('speedup_done_msg'));
            setSelected(null);
        }
        catch (e) {
            setMsg('❌ ' + (e.response?.data?.message || tr('error')));
        }
        finally {
            setSpeedingUp(null);
        }
    }
    const wallH = 14;
    return (<div style={{ background: '#060e06', height: '100%', minHeight: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      
      <div style={{ padding: '8px 14px', background: 'rgba(0,0,0,0.75)', borderBottom: '1px solid rgba(244,208,63,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f4d03f' }}>⚔️ {kingdom?.name}</div>
          <div style={{ fontSize: 10, color: '#a0845a', marginTop: 1 }}>
            <span style={{ color: '#9b59b6', fontWeight: 700 }}>Lv.{playerLevel}</span> · ⚡{totalPower} · 🏆{(0, format_1.fmt)(kingdom?.score || 0)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
          
          {[{ k: 'gold', e: '💰', c: '#f4d03f' }, { k: 'wood', e: '🪵', c: '#a0682a' }, { k: 'stone', e: '🪨', c: '#aaa' }, { k: 'food', e: '🌾', c: '#7dbb3f' }].map(({ k, e, c }) => (<div key={k} style={{ fontSize: 9, color: c, background: 'rgba(0,0,0,0.5)', borderRadius: 5, padding: '2px 5px', border: '1px solid rgba(255,255,255,0.06)' }}>
              {e}{productionRates[k] >= 0 ? '+' : ''}{(0, format_1.fmt)(productionRates[k] || 0)}
            </div>))}
          {kingdom?.shieldActive && (<div style={{ background: 'rgba(52,152,219,0.3)', border: '1px solid #3498db', borderRadius: 6, padding: '2px 7px', fontSize: 10, color: '#3498db', fontWeight: 700 }}>
              🛡️<Countdown_1.default endsAt={kingdom.shieldUntil}/>
            </div>)}
          <button onClick={() => setShowWorkers(true)} style={{ background: 'rgba(39,174,96,0.2)', border: '1px solid rgba(39,174,96,0.4)', borderRadius: 6, padding: '2px 7px', fontSize: 10, color: '#27ae60', fontWeight: 700, cursor: 'pointer' }}>
            👷 {kingdom?.workers ?? 0}/{kingdom?.maxWorkers ?? 5}
          </button>
        </div>
      </div>

      
      <div style={{ textAlign: 'center', fontSize: 10, color: '#3a5a30', padding: '3px 0', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
        {tr('map_hint')}
      </div>

      
      <div ref={containerRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} style={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
            cursor: isDragging.current ? 'grabbing' : 'grab',
            background: 'radial-gradient(ellipse at 50% 40%, #0f2a0a 0%, #060e06 70%)',
            touchAction: 'none',
            userSelect: 'none',
        }}>
        
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.65) 100%)', pointerEvents: 'none', zIndex: 300 }}/>

        
        <div style={{
            position: 'absolute',
            left: pan.x,
            top: pan.y,
            width: sceneW,
            height: sceneH,
            willChange: 'transform',
        }}>

          
          {tiles.map(({ gx, gy, type, status }) => {
            const { x, y } = isoXY(gx, gy);
            const px = x - minX;
            const py = y - minY;
            const t = TERRAIN[type];
            const locked = status === 'locked';
            const wild = status === 'wilderness';
            const isWallPerim = status === 'wall';
            const faceH = isWallPerim && wallPerimH > 0 ? wallPerimH : wallH;
            const wallTop = '#909090', wallLeft = '#585858', wallRight = '#383838';
            return (<div key={`${gx},${gy}`} style={{ position: 'absolute', left: px - TILE_W / 2, top: py - (isWallPerim ? faceH : 0), width: TILE_W, height: TILE_H + faceH, zIndex: gx + gy }}>
                
                <div style={{
                    position: 'absolute', left: 0, top: TILE_H / 2,
                    width: TILE_W / 2, height: faceH,
                    background: locked ? '#0a1a08' : isWallPerim ? wallLeft : t.left,
                    transform: 'skewY(26.6deg)', transformOrigin: 'top left',
                }}/>
                
                <div style={{
                    position: 'absolute', right: 0, top: TILE_H / 2,
                    width: TILE_W / 2, height: faceH,
                    background: locked ? '#060e04' : isWallPerim ? wallRight : t.right,
                    transform: 'skewY(-26.6deg)', transformOrigin: 'top right',
                }}/>
                
                <div style={{
                    position: 'absolute', left: 0, top: 0, width: TILE_W, height: TILE_H,
                    clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)',
                    background: locked
                        ? 'linear-gradient(135deg,#0e200a,#0a160a)'
                        : isWallPerim
                            ? `linear-gradient(135deg,${wallTop},${wallLeft})`
                            : wild
                                ? `linear-gradient(135deg,${t.top}88,${t.left})`
                                : `linear-gradient(135deg,${t.top},${t.left})`,
                    opacity: locked ? 0.5 : 1,
                }}>
                  
                  {type === 'forest' && !locked && !isWallPerim && (<div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, opacity: 0.7 }}>🌲</div>)}
                  {type === 'water' && !locked && (<div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg,rgba(255,255,255,0.04) 0px,rgba(255,255,255,0.04) 1px,transparent 1px,transparent 6px)' }}/>)}
                  {type === 'path' && (<div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg,rgba(0,0,0,0.05) 0px,rgba(0,0,0,0.05) 1px,transparent 1px,transparent 4px)' }}/>)}
                  {isWallPerim && wallPerimH > 0 && (<div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg,rgba(0,0,0,0.15) 0px,rgba(0,0,0,0.15) 1px,transparent 1px,transparent 8px)', opacity: 0.6 }}/>)}
                  {locked && (<div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>🔒</div>)}
                  {wild && !locked && type === 'grass1' && (<div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, opacity: 0.5 }}>🌿</div>)}
                </div>
              </div>);
        })}

          
          {visibleChars.map(c => {
            const { x, y } = isoXY(c.gx, c.gy);
            const px = x - minX;
            const py = y - minY;
            return (<div key={c.id} style={{
                    position: 'absolute',
                    left: px - 10,
                    top: py - 22,
                    width: 20,
                    zIndex: 190 + c.gx + c.gy,
                    transition: `left ${c.speed}s ease-in-out, top ${c.speed}s ease-in-out`,
                    pointerEvents: 'none',
                    transform: c.flip ? 'scaleX(-1)' : 'scaleX(1)',
                }}>
                
                <div style={{ position: 'relative', textAlign: 'center', animation: 'charBob 0.85s ease-in-out infinite', fontSize: 15, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.95))' }}>
                  {c.emoji}
                  <div style={{
                    position: 'absolute',
                    bottom: -2, left: '50%', transform: 'translateX(-50%)',
                    width: 9, height: 3,
                    background: 'rgba(0,0,0,0.4)',
                    borderRadius: '50%',
                    filter: 'blur(1.5px)',
                }}/>
                </div>
              </div>);
        })}

          
          {sortedBuildings.map(b => {
            const pos = getLayout(b.type, b.slot ?? 0);
            const cfg = B[b.type];
            const isSelected = selected === b.id;
            const isUpg = !!(b.upgradeEndsAt && new Date() < new Date(b.upgradeEndsAt));
            const sz = pos.size ?? 1;
            const { x, y } = isoXY(pos.gx, pos.gy);
            const px = x - minX;
            const py = y - minY;
            const tW = TILE_W * sz;
            const tH = TILE_H * sz;
            const BODY = sz === 2 ? 28 : 20;
            const topColor = isUpg ? '#3a7ab0' : cfg.top;
            const leftColor = isUpg ? '#1a3a60' : cfg.left;
            const rightColor = isUpg ? '#0a1e38' : cfg.right;
            return (<div key={b.id} data-building="true" onClick={() => { if (!isDragging.current)
                setSelected(isSelected ? null : b.id); }} style={{
                    position: 'absolute',
                    left: px - tW / 2,
                    top: py - BODY,
                    width: tW,
                    height: tH + BODY,
                    zIndex: 200 + pos.gx + pos.gy + sz * 10,
                    cursor: 'pointer',
                }}>
                
                <div style={{
                    position: 'absolute', left: 0, top: tH / 2,
                    width: tW / 2, height: BODY,
                    background: `linear-gradient(180deg,${leftColor},${rightColor})`,
                    transform: 'skewY(26.6deg)', transformOrigin: 'top left',
                }}/>
                
                <div style={{
                    position: 'absolute', right: 0, top: tH / 2,
                    width: tW / 2, height: BODY,
                    background: `linear-gradient(180deg,${rightColor},rgba(0,0,0,0.85))`,
                    transform: 'skewY(-26.6deg)', transformOrigin: 'top right',
                }}/>
                
                <div style={{
                    position: 'absolute', left: 0, top: 0, width: tW, height: tH,
                    clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)',
                    background: `radial-gradient(ellipse at 38% 28%,${topColor},${leftColor})`,
                    boxShadow: isSelected ? `0 0 22px ${cfg.glow}` : `0 0 8px ${cfg.glow}55`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'box-shadow 0.2s',
                }}>
                  <span style={{
                    fontSize: sz === 2 ? 26 : 17,
                    filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.95))',
                    animation: isUpg ? 'hammer 0.8s ease-in-out infinite' : undefined,
                    paddingTop: tH * 0.18,
                }}>
                    {isUpg ? '🔨' : cfg.icon}
                  </span>
                </div>

                
                {isSelected && (<div style={{ position: 'absolute', inset: -4, boxShadow: `0 0 20px ${cfg.glow}, 0 0 40px ${cfg.glow}44`, pointerEvents: 'none', animation: 'pulse-glow 1.5s ease-in-out infinite' }}/>)}

                
                <div style={{
                    position: 'absolute', left: '50%', top: -18, transform: 'translateX(-50%)',
                    background: isSelected ? cfg.top : isUpg ? 'rgba(52,152,219,0.97)' : 'rgba(0,0,0,0.85)',
                    border: `1px solid ${isSelected ? cfg.top : isUpg ? '#3498db' : 'rgba(255,255,255,0.12)'}`,
                    borderRadius: 10, padding: '2px 7px', fontSize: 9, fontWeight: 800,
                    color: isSelected ? '#000' : '#fff', whiteSpace: 'nowrap',
                    boxShadow: isSelected ? `0 0 8px ${cfg.glow}` : 'none',
                }}>
                  {isUpg ? <><span>⏳ </span><Countdown_1.default endsAt={b.upgradeEndsAt}/></> : `${cfg.icon} Lv.${b.level}`}
                </div>
              </div>);
        })}
        </div>


        
        {availableToBuild.length > 0 && (<button onClick={() => { setSelected(null); setBuildModal(true); }} style={{
                position: 'absolute', bottom: 10, left: 10,
                background: 'linear-gradient(135deg,#27ae60,#1a8a40)',
                border: '1px solid rgba(39,174,96,0.5)',
                borderRadius: 12, padding: '8px 14px',
                color: '#fff', fontWeight: 800, fontSize: 13,
                boxShadow: '0 0 16px rgba(39,174,96,0.4)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}>
            {tr('build_new_btn')}
          </button>)}
      </div>

      
      {selected && selectedBuilding && (<div style={{
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
                width: 42, height: 42, borderRadius: 12,
                background: `linear-gradient(135deg,${B[selectedType]?.left},${B[selectedType]?.right})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                boxShadow: `0 0 14px ${B[selectedType]?.glow}`,
            }}>
                {B[selectedType]?.icon}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: B[selectedType]?.top }}>{tr('b_' + selectedType) || B[selectedType]?.label}</div>
                <div style={{ fontSize: 11, color: '#a0845a' }}>{tr('blvl', { n: selectedBuilding.level })}</div>
              </div>
            </div>
            <button onClick={() => { setSelected(null); setMsg(''); }} style={{ background: 'none', border: 'none', color: '#444', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          </div>

          
          <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(selectedBuilding.level / 30) * 100}%`, background: `linear-gradient(90deg,${B[selectedType]?.left},${B[selectedType]?.top})`, borderRadius: 3, transition: 'width 0.5s' }}/>
          </div>

          
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '8px 12px', marginBottom: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
            {buildingStats(selectedType, selectedBuilding.level, tr).map((line, i) => (<div key={i} style={{ fontSize: 11, color: '#c8a875', lineHeight: 1.6 }}>{line}</div>))}
          </div>

          {selectedBuilding.upgradeEndsAt && new Date() < new Date(selectedBuilding.upgradeEndsAt) ? (<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1, textAlign: 'center', color: '#3498db', fontSize: 13 }}>⏳ <Countdown_1.default endsAt={selectedBuilding.upgradeEndsAt}/></div>
              <button className="btn" style={{ background: 'linear-gradient(135deg,#9b59b6,#6c3483)', color: '#fff', padding: '10px 14px', fontSize: 12, borderRadius: 10 }} disabled={!!speedingUp} onClick={speedUp}>
                {speedingUp ? '...' : tr('speedup_btn', { n: Math.max(1, Math.ceil(Math.max(0, (new Date(selectedBuilding.upgradeEndsAt).getTime() - Date.now()) / 60000))) })}
              </button>
            </div>) : (() => {
                const cost = (0, costs_1.upgradeCost)(selectedType, selectedBuilding.level);
                const canAfford = (kingdom?.gold ?? 0) >= cost.gold && (kingdom?.wood ?? 0) >= cost.wood && (kingdom?.stone ?? 0) >= cost.stone;
                return (<>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                  {cost.gold > 0 && <CostBadge icon="💰" val={cost.gold} have={kingdom?.gold ?? 0} color="#f4d03f"/>}
                  {cost.wood > 0 && <CostBadge icon="🪵" val={cost.wood} have={kingdom?.wood ?? 0} color="#a0682a"/>}
                  {cost.stone > 0 && <CostBadge icon="🪨" val={cost.stone} have={kingdom?.stone ?? 0} color="#aaa"/>}
                </div>
                <button className="btn btn-gold" style={{ width: '100%', padding: '12px', fontSize: 14, opacity: canAfford ? 1 : 0.5, borderRadius: 12 }} disabled={!!upgrading || !canAfford} onClick={upgrade}>
                  {upgrading ? '⏳...' : canAfford ? tr('upgrade_to_lvl', { n: selectedBuilding.level + 1 }) : tr('not_enough_resources')}
                </button>
              </>);
            })()}

          {msg && <div style={{ textAlign: 'center', fontSize: 12, marginTop: 8, color: msg.startsWith('⬆️') || msg.startsWith('⚡') ? '#27ae60' : '#e74c3c' }}>{msg}</div>}
        </div>)}

      
      {showWorkers && (<WorkersPanel_1.default onClose={() => { setShowWorkers(false); refresh(); }}/>)}

      
      {buildModal && (<div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end' }} onClick={e => { if (e.target === e.currentTarget)
            setBuildModal(false); }}>
          <div style={{
                width: '100%', maxHeight: '75vh', overflowY: 'auto',
                background: 'linear-gradient(180deg,#0a1a08,#060e06)',
                borderRadius: '20px 20px 0 0',
                border: '1px solid rgba(39,174,96,0.3)',
                padding: '20px 14px 140px',
                animation: 'slideUp 0.25s ease-out',
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#27ae60' }}>{tr('build_modal_title')}</div>
              <button onClick={() => setBuildModal(false)} style={{ background: 'none', border: 'none', color: '#555', fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: '#a0845a', marginBottom: buildMsg ? 8 : 16 }}>
              {tr('build_modal_desc')}
            </div>
            {buildMsg && (<div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 14, background: 'rgba(231,76,60,0.15)', border: '1px solid #e74c3c44', color: '#e74c3c', fontSize: 13, textAlign: 'center' }}>
                {buildMsg}
              </div>)}

            {availableToBuild.length === 0 ? (<div style={{ textAlign: 'center', color: '#a0845a', padding: 40 }}>{tr('all_buildings_built')}</div>) : availableToBuild.map(type => {
                const cfg = B[type];
                const baseCost = costFor(type);
                const vipLocked = type === 'arcane_tower' && !kingdom?.isVip;
                const canAfford = !vipLocked && (kingdom?.gold ?? 0) >= baseCost.gold && (kingdom?.wood ?? 0) >= baseCost.wood && (kingdom?.stone ?? 0) >= baseCost.stone;
                const dupCount = countOfType(type);
                const desc = (BUILD_DESC[type] ?? '') + (dupCount > 0 ? ` ${tr('copy_num', { n: dupCount + 1 })}` : '');
                return (<div key={type} style={{
                        background: canAfford ? 'linear-gradient(135deg,rgba(20,40,15,0.9),rgba(10,25,8,0.9))' : 'rgba(0,0,0,0.4)',
                        border: `1px solid ${canAfford ? cfg.top + '44' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: 14, padding: 14, marginBottom: 10,
                    }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{
                        width: 46, height: 46, borderRadius: 12,
                        background: `linear-gradient(135deg,${cfg.left},${cfg.right})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                        boxShadow: `0 0 12px ${cfg.glow}`,
                    }}>{cfg.icon}</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: cfg.top }}>{tr('b_' + type)}</div>
                      <div style={{ fontSize: 11, color: '#a0845a', marginTop: 2 }}>{desc}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    {baseCost.gold > 0 && <CostBadge icon="💰" val={baseCost.gold} have={kingdom?.gold ?? 0} color="#f4d03f"/>}
                    {baseCost.wood > 0 && <CostBadge icon="🪵" val={baseCost.wood} have={kingdom?.wood ?? 0} color="#a0682a"/>}
                    {baseCost.stone > 0 && <CostBadge icon="🪨" val={baseCost.stone} have={kingdom?.stone ?? 0} color="#aaa"/>}
                  </div>

                  {vipLocked ? (<div style={{ textAlign: 'center', padding: '10px', background: 'rgba(241,196,15,0.08)', borderRadius: 8, border: '1px solid rgba(241,196,15,0.25)', fontSize: 12, color: '#f1c40f' }}>
                      {tr('vip_required_shop')}
                    </div>) : (<button className="btn btn-gold" style={{ width: '100%', padding: '11px', fontSize: 14, opacity: canAfford ? 1 : 0.4, borderRadius: 10 }} disabled={!canAfford || building === type} onClick={() => buildNew(type)}>
                      {building === type ? '⏳...' : canAfford ? tr('build_btn', { name: tr('b_' + type) }) : tr('not_enough_resources')}
                    </button>)}
                </div>);
            })}
          </div>
        </div>)}
    </div>);
}
function CostBadge({ icon, val, have, color }) {
    const ok = have >= val;
    return (<div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: ok ? 'rgba(0,0,0,0.4)' : 'rgba(60,0,0,0.4)',
            borderRadius: 8, padding: '4px 10px',
            border: `1px solid ${ok ? color + '33' : '#e74c3c44'}`,
        }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: ok ? color : '#e74c3c' }}>{(0, format_1.fmt)(val)}</span>
    </div>);
}
//# sourceMappingURL=HomeScreen.js.map