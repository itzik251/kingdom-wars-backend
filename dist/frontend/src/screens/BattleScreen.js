"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BattleScreen;
const react_1 = require("react");
const react_dom_1 = require("react-dom");
const COLS = 7, ROWS = 10;
const HUD_TOP = 52;
const ZOOM = 1.0;
const NEAR_SCALE = 0.28;
const FAR_SCALE = 1.0;
function getLayout(W, H) {
    const lW = W / ZOOM, lH = H / ZOOM;
    const mapH = lH - HUD_TOP - 10;
    const cellBase = Math.floor(lW / COLS * 1.68);
    return { W: lW, H: lH, cellBase, mapH, oy: HUD_TOP };
}
function project(wx, wy, L) {
    const t = wy / ROWS;
    const scale = NEAR_SCALE + (FAR_SCALE - NEAR_SCALE) * t;
    const sx = L.W / 2 + (wx - COLS / 2) * L.cellBase * scale;
    const sy = L.oy + t * L.mapH;
    return [sx, sy];
}
function unproject(sx, sy, L) {
    const t = Math.max(0, Math.min(1, (sy - L.oy) / L.mapH));
    const wy = t * ROWS;
    const scale = NEAR_SCALE + (FAR_SCALE - NEAR_SCALE) * t;
    const wx = (sx - L.W / 2) / (L.cellBase * scale) + COLS / 2;
    return [wx, wy];
}
function unitR(wy, L) {
    const t = wy / ROWS;
    const scale = NEAR_SCALE + (FAR_SCALE - NEAR_SCALE) * t;
    return Math.max(7, L.cellBase * scale * 0.38);
}
function tdist(a, b) {
    return Math.hypot(a.wx - b.wx, a.wy - b.wy);
}
const BS = {
    spearman: { spd: .055, rng: 1.0, dmg: .20, hp: 300, clr: '#3498db', ltr: 'S', rate: 50 },
    archer: { spd: .035, rng: 3.0, dmg: .30, hp: 220, clr: '#2ecc71', ltr: 'A', rate: 45, proj: 'arrow' },
    swordsman: { spd: .065, rng: 1.1, dmg: .50, hp: 550, clr: '#e67e22', ltr: 'W', rate: 48 },
    cavalry: { spd: .130, rng: 1.2, dmg: 1.0, hp: 750, clr: '#9b59b6', ltr: 'C', rate: 42 },
    catapult: { spd: .022, rng: 5.0, dmg: 2.8, hp: 450, clr: '#c0392b', ltr: 'K', rate: 90, proj: 'boulder' },
    elite_guard: { spd: .075, rng: 1.2, dmg: 2.0, hp: 1100, clr: '#f39c12', ltr: 'E', rate: 44 },
    knight: { spd: .080, rng: 1.2, dmg: 3.2, hp: 1500, clr: '#e74c3c', ltr: 'Kn', rate: 40 },
    paladin: { spd: .070, rng: 1.2, dmg: 5.5, hp: 2200, clr: '#d4ac0d', ltr: 'P', rate: 38 },
    dragon_rider: { spd: .140, rng: 2.5, dmg: 12, hp: 3000, clr: '#e74c3c', ltr: 'D', rate: 35, proj: 'fireball' },
    ragnar: { spd: .110, rng: 1.2, dmg: 15, hp: 3800, clr: '#a569bd', ltr: 'R', rate: 35 },
    titan: { spd: .060, rng: 1.4, dmg: 24, hp: 7500, clr: '#566573', ltr: 'T', rate: 55 },
    giant: { spd: .050, rng: 1.4, dmg: 45, hp: 18000, clr: '#117a65', ltr: 'G', rate: 65 },
    ogre: { spd: .050, rng: 1.4, dmg: 18, hp: 5500, clr: '#a04000', ltr: 'O', rate: 60 },
    mage: { spd: .060, rng: 4.0, dmg: 20, hp: 2200, clr: '#8e44ad', ltr: 'M', rate: 48, proj: 'fireball' },
    dwarf_fighter: { spd: .055, rng: 1.2, dmg: 14, hp: 3300, clr: '#5d6d7e', ltr: 'Dw', rate: 52 },
};
const BLDG_HP = {
    town_hall: 2500, barracks: 900, farm: 450, lumber_mill: 450,
    stone_quarry: 450, gold_mine: 450, wall: 3500, watch_tower: 1200,
    hospital: 600, gem_forge: 900, arcane_tower: 1500,
};
const BLDG_CLR = {
    town_hall: '#7d3c98', barracks: '#c0392b', farm: '#d4ac0d', lumber_mill: '#795548',
    stone_quarry: '#717d7e', gold_mine: '#f1c40f', wall: '#566573', watch_tower: '#2e86c1',
    hospital: '#e74c3c', gem_forge: '#9b59b6', arcane_tower: '#1abc9c',
};
const BLDG_HEIGHT = {
    town_hall: 1.4, watch_tower: 1.6, arcane_tower: 1.5, barracks: 1.0,
    wall: 1.2, gem_forge: 1.1, hospital: 0.9, farm: 0.7, lumber_mill: 0.8, stone_quarry: 0.8, gold_mine: 0.8,
};
const BLDG_SLOTS = [
    [3.5, 1.5], [2, 2], [5, 2], [1, 3], [6, 1.5], [2.5, 3.5], [4.5, 3], [1, 1], [5.5, 3.5], [3.5, 2.5], [0.5, 2.5], [6, 3],
];
function spawnParticles(gs, sx, sy, clr, n = 7) {
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, spd = 1.5 + Math.random() * 3.5;
        gs.particles.push({ x: sx, y: sy, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 1,
            life: 18 + Math.random() * 20, maxLife: 38, clr, sz: 2 + Math.random() * 3.5 });
    }
}
function BattleScreen(props) {
    const [dims, setDims] = (0, react_1.useState)({ W: window.innerWidth, H: window.innerHeight });
    (0, react_1.useEffect)(() => {
        const up = () => setDims({ W: window.innerWidth, H: window.innerHeight });
        window.addEventListener('resize', up);
        window.addEventListener('orientationchange', up);
        return () => { window.removeEventListener('resize', up); window.removeEventListener('orientationchange', up); };
    }, []);
    return <BattleCanvas key={`${dims.W}x${dims.H}`} {...props} W={dims.W} H={dims.H}/>;
}
function BattleCanvas({ profile, squad, winPct, marchSeconds, onClose, onFinish, W, H }) {
    const canvasRef = (0, react_1.useRef)(null);
    const gsRef = (0, react_1.useRef)(null);
    const rafRef = (0, react_1.useRef)(0);
    const magicRef = (0, react_1.useRef)(false);
    const spritesRef = (0, react_1.useRef)({});
    const L = (0, react_1.useRef)(getLayout(W, H)).current;
    const [timeLeft, setTimeLeft] = (0, react_1.useState)(marchSeconds);
    const [magicMode, setMagicMode_] = (0, react_1.useState)(false);
    const [magicCharges, setMagicCharges] = (0, react_1.useState)(Math.max(3, Math.min((squad['mage'] || 0) + 3, 10)));
    const [battleDone, setBattleDone] = (0, react_1.useState)(false);
    const [result, setResult] = (0, react_1.useState)(null);
    const [stats, setStats] = (0, react_1.useState)({ atkLost: 0, defLost: 0, bldgDest: 0, duration: 0 });
    const setMagicMode = (v) => { magicRef.current = v; setMagicMode_(v); };
    (0, react_1.useEffect)(() => {
        const tg = window.Telegram?.WebApp;
        try {
            tg?.expand();
        }
        catch { }
        try {
            tg?.requestFullscreen();
        }
        catch { }
        try {
            tg?.disableVerticalSwipes?.();
        }
        catch { }
        try {
            tg?.setHeaderColor?.('#000000');
        }
        catch { }
        try {
            tg?.setBackgroundColor?.('#000000');
        }
        catch { }
        try {
            tg?.setBottomBarColor?.('#000000');
        }
        catch { }
        try {
            screen.orientation?.lock?.('portrait');
        }
        catch { }
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        return () => {
            try {
                tg?.exitFullscreen();
            }
            catch { }
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, []);
    (0, react_1.useEffect)(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ['swordsman', 'archer', 'spearman', 'cavalry', 'elite_guard', 'knight'].forEach(t => {
            const img = new Image();
            img.src = `/assets/${t}.png`;
            spritesRef.current[t] = img;
        });
        const bldgList = (profile.buildings ?? []).slice(0, BLDG_SLOTS.length);
        const buildings = bldgList.map((b, i) => {
            const [wx, wy] = BLDG_SLOTS[i];
            const src = `/assets/building_${b.type === 'town_hall' ? 'town_hall_1' : b.type}.png`;
            let img = null;
            try {
                img = new Image();
                img.src = src;
            }
            catch { }
            const hp = (BLDG_HP[b.type] ?? 300) * (1 + b.level * .3);
            return { id: 2000 + i, type: b.type, wx: wx + .5, wy: wy + .5, hp, maxHp: hp, img,
                clr: BLDG_CLR[b.type] ?? '#888', bldgH: BLDG_HEIGHT[b.type] ?? 0.9 };
        });
        const DEF_T = [['spearman'], ['spearman', 'archer'], ['swordsman', 'archer', 'cavalry'],
            ['swordsman', 'elite_guard', 'archer'], ['knight', 'paladin', 'cavalry']];
        const tier = (profile.defPower ?? 0) < 200 ? 0 : (profile.defPower ?? 0) < 1000 ? 1 : (profile.defPower ?? 0) < 5000 ? 2 : (profile.defPower ?? 0) < 20000 ? 3 : 4;
        const defTypes = DEF_T[tier], defCount = Math.max(8, Math.round((profile.armySize ?? 40) / defTypes.length));
        const defenders = defTypes.map((t, i) => {
            const st = BS[t] ?? BS.spearman;
            const wx = 1 + (i % 3) * 2.0, wy = 1 + Math.floor(i / 3) * 1.4;
            return { id: 1000 + i, type: t, count: defCount, wx, wy, hp: st.hp, maxHp: st.hp,
                twx: wx, twy: wy, ptx: wx, pty: wy, atkCd: Math.floor(Math.random() * st.rate),
                isAttacker: false, hasPlayerTarget: false, dying: 0, angle: Math.PI,
                clr: '#c0392b', ltr: st.ltr, spd: st.spd, rng: st.rng, dmg: st.dmg, rate: st.rate };
        });
        const entries = Object.entries(squad).filter(([, c]) => c > 0);
        const aCols = Math.max(1, Math.ceil(Math.sqrt(entries.length)));
        const attackers = entries.map(([type, count], i) => {
            const st = BS[type] ?? BS.spearman;
            const wx = 1 + (i % aCols) * 1.8, wy = ROWS - 1.2 - Math.floor(i / aCols) * 1.4;
            return { id: i, type, count, wx, wy, hp: st.hp, maxHp: st.hp,
                twx: wx, twy: wy, ptx: wx, pty: wy, atkCd: Math.floor(Math.random() * st.rate),
                isAttacker: true, hasPlayerTarget: false, dying: 0, angle: 0,
                clr: st.clr, ltr: st.ltr, spd: st.spd, rng: st.rng, dmg: st.dmg, rate: st.rate };
        });
        const startAtk = attackers.length, startDef = defenders.length, startBldg = buildings.length;
        gsRef.current = { units: [...attackers, ...defenders], buildings, projs: [], aoes: [],
            floats: [], particles: [], taps: [], projId: 0, frame: 0, over: false, startAtk, startDef, startBldg };
        const TOTAL = marchSeconds * 60;
        function tick() {
            rafRef.current = requestAnimationFrame(tick);
            const gs = gsRef.current;
            gs.frame++;
            if (gs.frame % 60 === 0)
                setTimeLeft(Math.max(0, Math.ceil((TOTAL - gs.frame) / 60)));
            if (!gs.over) {
                const atk = gs.units.filter(u => u.isAttacker && u.hp > 0 && u.dying === 0);
                const def = gs.units.filter(u => !u.isAttacker && u.hp > 0 && u.dying === 0);
                const lBld = gs.buildings.filter(b => b.hp > 0);
                gs.units.forEach(u => {
                    if (u.hp <= 0 || u.dying > 0)
                        return;
                    const enemies = u.isAttacker ? def : atk;
                    let nE = null, nED = Infinity;
                    enemies.forEach(e => { const d = tdist(u, e); if (d < nED) {
                        nED = d;
                        nE = e;
                    } });
                    if (u.isAttacker) {
                        let nB = null, nBD = Infinity;
                        lBld.forEach(b => { const d = tdist(u, b); if (d < nBD) {
                            nBD = d;
                            nB = b;
                        } });
                        const AGGRO = u.rng * 2.8;
                        if (nE && nED <= u.rng) {
                            if (u.atkCd <= 0) {
                                fireOrHit(gs, u, nE);
                                u.atkCd = u.rate;
                            }
                            u.angle = Math.atan2(nE.wy - u.wy, nE.wx - u.wx);
                            if (!u.hasPlayerTarget) {
                                u.twx = u.wx;
                                u.twy = u.wy;
                            }
                        }
                        else if (nB && nBD <= u.rng + .5 && def.length === 0) {
                            if (u.atkCd <= 0) {
                                nB.hp = Math.max(0, nB.hp - u.dmg);
                                const [sx, sy] = project(nB.wx, nB.wy, L);
                                gs.floats.push({ wx: nB.wx, wy: nB.wy, val: Math.round(u.dmg), life: 40, clr: '#ffa502' });
                                spawnParticles(gs, sx, sy, '#ff6b00', 4);
                                u.atkCd = u.rate;
                            }
                            u.angle = Math.atan2(nB.wy - u.wy, nB.wx - u.wx);
                            if (!u.hasPlayerTarget) {
                                u.twx = u.wx;
                                u.twy = u.wy;
                            }
                        }
                        else if (u.hasPlayerTarget) {
                            u.twx = u.ptx;
                            u.twy = u.pty;
                            u.angle = Math.atan2(u.pty - u.wy, u.ptx - u.wx);
                        }
                        else if (nE && nED <= AGGRO) {
                            u.twx = nE.wx;
                            u.twy = nE.wy;
                            u.angle = Math.atan2(nE.wy - u.wy, nE.wx - u.wx);
                        }
                        else if (nE) {
                            u.twx = nE.wx;
                            u.twy = nE.wy;
                            u.angle = Math.atan2(nE.wy - u.wy, nE.wx - u.wx);
                        }
                        else if (nB) {
                            u.twx = nB.wx;
                            u.twy = nB.wy;
                            u.angle = Math.atan2(nB.wy - u.wy, nB.wx - u.wx);
                        }
                    }
                    else {
                        if (nE && nED <= u.rng) {
                            if (u.atkCd <= 0) {
                                fireOrHit(gs, u, nE);
                                u.atkCd = u.rate;
                            }
                            u.angle = Math.atan2(nE.wy - u.wy, nE.wx - u.wx);
                            u.twx = u.wx;
                            u.twy = u.wy;
                        }
                        else if (nE && (gs.frame > 90 || nED < 4)) {
                            u.twx = nE.wx;
                            u.twy = nE.wy;
                            u.angle = Math.atan2(nE.wy - u.wy, nE.wx - u.wx);
                        }
                    }
                    const dx = u.twx - u.wx, dy = u.twy - u.wy, dd = Math.hypot(dx, dy);
                    if (dd > .05) {
                        u.wx += dx / dd * u.spd;
                        u.wy += dy / dd * u.spd;
                    }
                    if (u.hasPlayerTarget && Math.hypot(u.ptx - u.wx, u.pty - u.wy) < .15)
                        u.hasPlayerTarget = false;
                    u.wx = Math.max(.05, Math.min(COLS - .05, u.wx));
                    u.wy = Math.max(.05, Math.min(ROWS - .05, u.wy));
                    if (u.atkCd > 0)
                        u.atkCd--;
                    if (u.hp <= 0 && u.dying === 0) {
                        u.dying = 22;
                        const [sx, sy] = project(u.wx, u.wy, L);
                        spawnParticles(gs, sx, sy, u.clr, 12);
                    }
                });
                gs.units.forEach(u => { if (u.dying > 0)
                    u.dying--; });
                gs.units = gs.units.filter(u => !(u.hp <= 0 && u.dying === 0 && gs.frame > 5));
                gs.projs = gs.projs.filter(p => {
                    p.progress += p.spd;
                    if (p.progress >= 1) {
                        if (p.isUnit) {
                            const t = gs.units.find(u => u.id === p.targetId && u.hp > 0 && u.dying === 0);
                            if (t) {
                                t.hp = Math.max(0, t.hp - p.dmg);
                                gs.floats.push({ wx: t.wx, wy: t.wy, val: Math.round(p.dmg), life: 40, clr: p.clr });
                                spawnParticles(gs, p.tx, p.ty, p.clr, 5);
                            }
                        }
                        else {
                            const t = gs.buildings.find(b => b.id === p.targetId && b.hp > 0);
                            if (t) {
                                t.hp = Math.max(0, t.hp - p.dmg);
                                gs.floats.push({ wx: t.wx, wy: t.wy, val: Math.round(p.dmg), life: 40, clr: '#ffa502' });
                                spawnParticles(gs, p.tx, p.ty, '#ff6600', 5);
                            }
                        }
                        return false;
                    }
                    return true;
                });
                gs.aoes = gs.aoes.filter(e => e.life > 0).map(e => ({ ...e, r: e.r + .2, life: e.life - 1 }));
                gs.floats = gs.floats.filter(f => f.life > 0).map(f => ({ ...f, wy: f.wy - .022, life: f.life - 1 }));
                gs.taps = gs.taps.filter(t => t.life > 0).map(t => ({ ...t, life: t.life - 1 }));
                gs.particles = gs.particles.filter(p => p.life > 0).map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + .14, life: p.life - 1 }));
                const atkA = gs.units.filter(u => u.isAttacker && u.hp > 0).length;
                const defA = gs.units.filter(u => !u.isAttacker && u.hp > 0).length;
                const bldgA = gs.buildings.filter(b => b.hp > 0).length;
                if (gs.frame >= TOTAL || (defA === 0 && bldgA === 0) || atkA === 0) {
                    gs.over = true;
                    const bd = gs.startBldg - bldgA, perf = gs.startBldg > 0 ? bd / gs.startBldg : (defA === 0 ? 1 : 0);
                    const won = (defA === 0 && bldgA === 0) || (atkA > 0 && Math.random() * 100 < winPct * .7 + perf * 100 * .3);
                    setResult(won ? 'victory' : 'defeat');
                    setStats({ atkLost: gs.startAtk - atkA, defLost: gs.startDef - defA, bldgDest: bd, duration: Math.floor(gs.frame / 60) });
                    setBattleDone(true);
                }
            }
            ctx.clearRect(0, 0, W, H);
            ctx.save();
            ctx.scale(ZOOM, ZOOM);
            const sky = ctx.createLinearGradient(0, 0, 0, L.H);
            sky.addColorStop(0, '#1a2a3a');
            sky.addColorStop(.3, '#0d1e14');
            sky.addColorStop(1, '#0a1a0a');
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, L.W, L.H);
            for (let row = 0; row <= ROWS; row++) {
                const [lx, ly] = project(0, row, L);
                const [rx, ry] = project(COLS, row, L);
                const t = row / ROWS;
                const alpha = 0.08 + 0.18 * t;
                ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
                ctx.lineWidth = .6;
                ctx.beginPath();
                ctx.moveTo(lx, ly);
                ctx.lineTo(rx, ry);
                ctx.stroke();
            }
            for (let col = 0; col <= COLS; col++) {
                const [tx2, ty2] = project(col, 0, L);
                const [bx2, by2] = project(col, ROWS, L);
                ctx.strokeStyle = 'rgba(255,255,255,.06)';
                ctx.lineWidth = .5;
                ctx.beginPath();
                ctx.moveTo(tx2, ty2);
                ctx.lineTo(bx2, by2);
                ctx.stroke();
            }
            for (let row = 0; row < ROWS; row++) {
                for (let col = 0; col < COLS; col++) {
                    const [x0, y0] = project(col, row, L);
                    const [x1, y1] = project(col + 1, row, L);
                    const [x2, y2] = project(col + 1, row + 1, L);
                    const [x3, y3] = project(col, row + 1, L);
                    const isDef = row < 5;
                    const isEven = (col + row) % 2 === 0;
                    const clr = isDef
                        ? (isEven ? 'rgba(80,20,20,.45)' : 'rgba(90,25,25,.35)')
                        : (isEven ? 'rgba(15,50,20,.5)' : 'rgba(20,60,25,.4)');
                    ctx.fillStyle = clr;
                    ctx.beginPath();
                    ctx.moveTo(x0, y0);
                    ctx.lineTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x3, y3);
                    ctx.closePath();
                    ctx.fill();
                }
            }
            const [dl0, dl1] = project(0, 5, L), [dr0, dr1] = project(COLS, 5, L);
            ctx.strokeStyle = 'rgba(255,80,80,.4)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([8, 5]);
            ctx.beginPath();
            ctx.moveTo(dl0, dl1);
            ctx.lineTo(dr0, dr1);
            ctx.stroke();
            ctx.setLineDash([]);
            const allItems = [
                ...gsRef.current.buildings.map(b => ({ wy: b.wy, k: 'bldg', b })),
                ...gsRef.current.units.filter(u => u.hp > 0 || u.dying > 0).map(u => ({ wy: u.wy, k: 'unit', u })),
                ...gsRef.current.aoes.map(e => ({ wy: e.wy, k: 'aoe', e })),
                ...gsRef.current.floats.map(f => ({ wy: f.wy, k: 'flt', f })),
            ];
            allItems.sort((a, b) => a.wy - b.wy);
            allItems.forEach(item => {
                if (item.k === 'bldg') {
                    const b = item.b;
                    const [sx, sy] = project(b.wx, b.wy, L);
                    const t = b.wy / ROWS, scale = NEAR_SCALE + (FAR_SCALE - NEAR_SCALE) * t;
                    const R = L.cellBase * scale * (b.type === 'town_hall' ? .44 : .33);
                    const wallH = R * b.bldgH * 2.2;
                    if (b.hp <= 0) {
                        ctx.globalAlpha = .5;
                        ctx.fillStyle = '#3d1a00';
                        ctx.beginPath();
                        ctx.ellipse(sx, sy, R * .9, R * .4, 0, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = '#ff4400';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.moveTo(sx - R * .6, sy - R * .3);
                        ctx.lineTo(sx + R * .6, sy + R * .3);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(sx + R * .6, sy - R * .3);
                        ctx.lineTo(sx - R * .6, sy + R * .3);
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                        return;
                    }
                    ctx.fillStyle = 'rgba(0,0,0,.35)';
                    ctx.beginPath();
                    ctx.ellipse(sx + R * .1, sy + R * .15, R * .85, R * .38, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = darken(b.clr, .5);
                    ctx.beginPath();
                    ctx.moveTo(sx - R, sy);
                    ctx.lineTo(sx - R, sy - wallH);
                    ctx.lineTo(sx, sy - wallH - R * .4);
                    ctx.lineTo(sx, sy - R * .4);
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillStyle = darken(b.clr, .65);
                    ctx.beginPath();
                    ctx.moveTo(sx + R, sy);
                    ctx.lineTo(sx + R, sy - wallH);
                    ctx.lineTo(sx, sy - wallH - R * .4);
                    ctx.lineTo(sx, sy - R * .4);
                    ctx.closePath();
                    ctx.fill();
                    if (b.img && b.img.complete && b.img.naturalWidth > 0) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(sx - R, sy - wallH);
                        ctx.lineTo(sx + R, sy - wallH);
                        ctx.lineTo(sx, sy - wallH - R * .4 + 1);
                        ctx.closePath();
                        ctx.fillStyle = b.clr;
                        ctx.fill();
                        ctx.clip();
                        ctx.drawImage(b.img, sx - R, sy - wallH - R * .5, R * 2, R * 2);
                        ctx.restore();
                    }
                    else {
                        const gRoof = ctx.createLinearGradient(sx - R, sy - wallH, sx + R, sy - wallH - R * .4);
                        gRoof.addColorStop(0, b.clr);
                        gRoof.addColorStop(1, lighten(b.clr, .3));
                        ctx.fillStyle = gRoof;
                        ctx.beginPath();
                        ctx.moveTo(sx - R, sy - wallH);
                        ctx.lineTo(sx + R, sy - wallH);
                        ctx.lineTo(sx + R * .5, sy - wallH - R * .8);
                        ctx.lineTo(sx - R * .5, sy - wallH - R * .8);
                        ctx.closePath();
                        ctx.fill();
                    }
                    ctx.strokeStyle = 'rgba(0,0,0,.5)';
                    ctx.lineWidth = .8;
                    ctx.beginPath();
                    ctx.moveTo(sx - R, sy);
                    ctx.lineTo(sx - R, sy - wallH);
                    ctx.lineTo(sx + R, sy - wallH);
                    ctx.lineTo(sx + R, sy);
                    ctx.stroke();
                    const bw = R * 2.4;
                    ctx.fillStyle = 'rgba(0,0,0,.7)';
                    ctx.fillRect(sx - bw / 2, sy - wallH - R * .9 - 9, bw, 5);
                    ctx.fillStyle = b.hp / b.maxHp > .5 ? '#2ecc71' : b.hp / b.maxHp > .25 ? '#f39c12' : '#e74c3c';
                    ctx.fillRect(sx - bw / 2, sy - wallH - R * .9 - 9, bw * Math.max(0, b.hp / b.maxHp), 5);
                }
                else if (item.k === 'unit') {
                    const u = item.u;
                    const [sx, sy] = project(u.wx, u.wy, L);
                    const R = unitR(u.wy, L);
                    const alpha = u.dying > 0 ? u.dying / 22 : 1;
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = 'rgba(0,0,0,.35)';
                    ctx.beginPath();
                    ctx.ellipse(sx + R * .1, sy + R * .22, R * .75, R * .28, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowColor = u.isAttacker ? 'rgba(80,160,255,.9)' : 'rgba(255,60,60,.9)';
                    ctx.shadowBlur = 14;
                    ctx.strokeStyle = u.isAttacker ? 'rgba(140,200,255,.9)' : 'rgba(255,110,110,.9)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(sx, sy - R * .2, R + 1, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                    const sprImg = spritesRef.current[u.type];
                    if (sprImg && sprImg.complete && sprImg.naturalWidth > 0) {
                        const iw = sprImg.naturalWidth, ih = sprImg.naturalHeight;
                        const isMoving = Math.hypot(u.twx - u.wx, u.twy - u.wy) > 0.08;
                        let srcX, srcY, srcW, srcH;
                        if (!isMoving) {
                            srcX = Math.round(iw * .18);
                            srcY = 0;
                            srcW = Math.round(iw * .64);
                            srcH = Math.round(ih * .42);
                        }
                        else {
                            const fi = Math.floor(gs.frame / 6) % 4;
                            srcX = Math.round(iw * .25 * fi);
                            srcY = Math.round(ih * .42);
                            srcW = Math.round(iw * .25);
                            srcH = Math.round(ih * .58);
                        }
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(sx, sy - R * .2, R, 0, Math.PI * 2);
                        ctx.clip();
                        const D = R * 2.4;
                        ctx.drawImage(sprImg, srcX, srcY, srcW, srcH, sx - D / 2, sy - R * 1.35, D, D);
                        ctx.restore();
                    }
                    else {
                        const gBody = ctx.createRadialGradient(sx - R * .3, sy - R * .3, R * .05, sx, sy - R * .2, R);
                        gBody.addColorStop(0, 'rgba(255,255,255,.4)');
                        gBody.addColorStop(1, u.clr);
                        ctx.fillStyle = gBody;
                        ctx.beginPath();
                        ctx.arc(sx, sy - R * .2, R, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = '#fff';
                        ctx.font = `bold ${Math.max(8, Math.round(R * .78))}px sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(u.ltr, sx, sy - R * .2);
                    }
                    const pw = Math.max(20, R * 1.5);
                    ctx.fillStyle = 'rgba(0,0,0,.82)';
                    ctx.beginPath();
                    ctx.roundRect(sx - pw / 2, sy + R * .8 + 1, pw, 13, 5);
                    ctx.fill();
                    ctx.fillStyle = '#eee';
                    ctx.font = `bold ${Math.max(7, Math.round(R * .55))}px sans-serif`;
                    ctx.fillText(`×${u.count}`, sx, sy + R * .8 + 8);
                    const bw = R * 2.2;
                    ctx.fillStyle = 'rgba(0,0,0,.65)';
                    ctx.fillRect(sx - bw / 2, sy - R * 1.3 - 8, bw, 5);
                    ctx.fillStyle = u.hp / u.maxHp > .55 ? '#2ecc71' : u.hp / u.maxHp > .28 ? '#f39c12' : '#e74c3c';
                    ctx.fillRect(sx - bw / 2, sy - R * 1.3 - 8, bw * Math.max(0, u.hp / u.maxHp), 5);
                    ctx.globalAlpha = 1;
                }
                else if (item.k === 'aoe') {
                    const e = item.e;
                    const [sx, sy] = project(e.wx, e.wy, L);
                    const t = e.wy / ROWS, scale = NEAR_SCALE + (FAR_SCALE - NEAR_SCALE) * t;
                    const r = e.r * L.cellBase * scale * 1.2;
                    const a = e.life / e.maxLife;
                    ctx.strokeStyle = `rgba(220,80,255,${a})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.ellipse(sx, sy, r, r * .35, 0, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = `rgba(160,0,220,${a * .18})`;
                    ctx.fill();
                }
                else if (item.k === 'flt') {
                    const f = item.f;
                    const [sx, sy] = project(f.wx, f.wy, L);
                    ctx.globalAlpha = f.life / 40;
                    ctx.fillStyle = f.clr;
                    ctx.font = 'bold 12px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`-${f.val}`, sx, sy - 36);
                    ctx.globalAlpha = 1;
                }
            });
            gsRef.current.projs.forEach(p => {
                const x = p.sx + (p.tx - p.sx) * p.progress;
                const y = p.sy + (p.ty - p.sy) * p.progress - Math.sin(p.progress * Math.PI) * 22;
                ctx.save();
                if (p.type === 'arrow') {
                    const angle = Math.atan2(p.ty - p.sy, p.tx - p.sx);
                    ctx.translate(x, y);
                    ctx.rotate(angle);
                    ctx.fillStyle = '#e8d5a3';
                    ctx.fillRect(-7, -1, 14, 2);
                    ctx.fillStyle = '#e74c3c';
                    ctx.beginPath();
                    ctx.moveTo(-7, 0);
                    ctx.lineTo(-12, -3);
                    ctx.lineTo(-12, 3);
                    ctx.closePath();
                    ctx.fill();
                }
                else if (p.type === 'fireball') {
                    const r = 4 + Math.sin(gsRef.current.frame * .4) * 1.5;
                    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
                    g.addColorStop(0, '#fff');
                    g.addColorStop(.4, '#ff8c00');
                    g.addColorStop(1, 'rgba(255,0,0,0)');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                else {
                    ctx.fillStyle = '#78909c';
                    ctx.beginPath();
                    ctx.arc(x, y, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            });
            gsRef.current.particles.forEach(p => {
                ctx.globalAlpha = p.life / p.maxLife;
                ctx.fillStyle = p.clr;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.sz * (p.life / p.maxLife), 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;
            gsRef.current.taps.forEach(t => {
                const a = t.life / 30;
                ctx.strokeStyle = `rgba(255,255,80,${a})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(t.sx, t.sy, 22 * (1 - a) + 5, 0, Math.PI * 2);
                ctx.stroke();
            });
            const vig = ctx.createRadialGradient(L.W / 2, L.H / 2, L.H * .18, L.W / 2, L.H / 2, L.H * .7);
            vig.addColorStop(0, 'rgba(0,0,0,0)');
            vig.addColorStop(1, 'rgba(0,0,0,.52)');
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, L.W, L.H);
            ctx.restore();
        }
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);
    function fireOrHit(gs, u, target) {
        const st = BS[u.type];
        const [sx, sy] = project(u.wx, u.wy, L);
        const [tx, ty] = project(target.wx, target.wy, L);
        if (st?.proj) {
            gs.projs.push({ id: gs.projId++, sx, sy, tx, ty, progress: 0, spd: .07, dmg: u.dmg,
                targetId: target.id, isUnit: true, clr: u.clr, type: st.proj });
        }
        else {
            target.hp = Math.max(0, target.hp - u.dmg);
            gs.floats.push({ wx: target.wx, wy: target.wy, val: Math.round(u.dmg), life: 40, clr: u.isAttacker ? '#ff6b6b' : '#ffd32a' });
            spawnParticles(gs, tx, ty, u.isAttacker ? '#ff4444' : '#ffaa00', 4);
        }
    }
    const handleTapRef = (0, react_1.useRef)(null);
    handleTapRef.current = (clientX, clientY) => {
        const gs = gsRef.current;
        if (!gs || gs.over)
            return;
        const rect = canvasRef.current.getBoundingClientRect();
        const sx = (clientX - rect.left) / ZOOM, sy = (clientY - rect.top) / ZOOM;
        const [twx, twy] = unproject(sx, sy, L);
        gs.taps.push({ sx, sy, life: 30 });
        if (magicRef.current) {
            const R = 2.0;
            gs.units.forEach(u => { if (!u.isAttacker && u.hp > 0 && u.dying === 0 && tdist({ wx: twx, wy: twy }, u) < R)
                u.hp = Math.max(1, Math.ceil(u.hp * .5)); });
            gs.buildings.forEach(b => { if (b.hp > 0 && tdist({ wx: twx, wy: twy }, b) < R)
                b.hp = Math.max(1, Math.ceil(b.hp * .5)); });
            gs.aoes.push({ wx: twx, wy: twy, r: .1, life: 24, maxLife: 24 });
            setMagicMode(false);
            setMagicCharges(c => c - 1);
        }
        else {
            const live = gs.units.filter(u => u.isAttacker && u.hp > 0 && u.dying === 0);
            live.sort((a, b) => tdist(a, { wx: twx, wy: twy }) - tdist(b, { wx: twx, wy: twy }));
            live.slice(0, Math.max(3, Math.ceil(live.length * .4))).forEach(u => {
                u.ptx = Math.max(.1, Math.min(COLS - .1, twx + (Math.random() - .5) * .7));
                u.pty = Math.max(.1, Math.min(ROWS - .1, twy + (Math.random() - .5) * .7));
                u.twx = u.ptx;
                u.twy = u.pty;
                u.hasPlayerTarget = true;
            });
        }
    };
    const lastTouchMs = (0, react_1.useRef)(0);
    (0, react_1.useEffect)(() => {
        const canvas = canvasRef.current;
        const fn = (e) => { e.preventDefault(); lastTouchMs.current = Date.now(); handleTapRef.current(e.touches[0].clientX, e.touches[0].clientY); };
        canvas.addEventListener('touchstart', fn, { passive: false });
        return () => canvas.removeEventListener('touchstart', fn);
    }, []);
    return (0, react_dom_1.createPortal)(<div style={{ position: 'fixed', inset: 0, zIndex: 99999, touchAction: 'none', overflow: 'hidden', background: '#000' }}>
      <canvas ref={canvasRef} width={W} height={H} style={{ position: 'absolute', inset: 0, display: 'block', touchAction: 'none' }} onPointerDown={e => { if (Date.now() - lastTouchMs.current < 300)
        return; e.preventDefault(); handleTapRef.current(e.clientX, e.clientY); }}/>

      
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: HUD_TOP, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)', borderBottom: '1px solid rgba(255,255,255,.07)', pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(0,50,100,.75)', borderRadius: 10, padding: '4px 10px', color: '#7dc', fontSize: 11, fontWeight: 700 }}>⚔️ הצבא שלך</div>
        <div style={{ background: 'rgba(5,15,35,.9)', border: `1.5px solid ${timeLeft <= 10 ? '#e74c3c' : 'rgba(100,160,255,.4)'}`, borderRadius: 20, padding: '4px 18px', color: timeLeft <= 10 ? '#e74c3c' : '#cde', fontSize: 19, fontWeight: 900, boxShadow: timeLeft <= 10 ? '0 0 16px rgba(231,76,60,.6)' : 'none' }}>
          ⏱ {timeLeft}s
        </div>
        <div style={{ background: 'rgba(100,0,0,.75)', borderRadius: 10, padding: '4px 10px', color: '#faa', fontSize: 11, fontWeight: 700 }}>🏰 {profile.name}</div>
      </div>

      
      {(<button onPointerDown={e => { e.stopPropagation(); if (magicCharges > 0)
            setMagicMode(!magicMode); }} style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                background: magicCharges === 0 ? 'rgba(30,30,30,.6)' : magicMode ? 'rgba(160,0,240,.9)' : 'rgba(50,0,120,.9)',
                border: `1.5px solid ${magicCharges === 0 ? 'rgba(255,255,255,.1)' : magicMode ? '#d040fb' : 'rgba(160,0,255,.45)'}`,
                borderRadius: 24, padding: '9px 22px', color: magicCharges === 0 ? 'rgba(255,255,255,.3)' : '#fff',
                fontSize: 14, fontWeight: 800, cursor: magicCharges > 0 ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: magicMode ? '0 0 24px rgba(200,0,255,.85)' : '0 2px 12px rgba(0,0,0,.5)' }}>
          <span>{magicMode ? '✨ בחר מטרה' : '✨ קסם AOE'}</span>
          <span style={{ background: 'rgba(255,255,255,.2)', borderRadius: 10, padding: '1px 9px', fontSize: 12, fontWeight: 900 }}>×{magicCharges}</span>
        </button>)}

      
      {battleDone && (<div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.85)', gap: 16, padding: 24 }}>
          <div style={{ fontSize: 50, fontWeight: 900, color: result === 'victory' ? '#f4d03f' : '#e74c3c', textShadow: `0 0 40px ${result === 'victory' ? 'rgba(244,208,63,.9)' : 'rgba(231,76,60,.9)'}` }}>
            {result === 'victory' ? '🏆 ניצחון!' : '💀 הובסת!'}
          </div>
          <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 16, padding: '16px 26px', display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 290, border: '1px solid rgba(255,255,255,.1)' }}>
            {[
                ['⚔️ יחידות שאבדו', `${stats.atkLost}`, '#faa'],
                ['💀 הגנה שנהרסה', `${stats.defLost}`, '#7dc'],
                ['🏚 בניינים שנהרסו', `${stats.bldgDest} / ${gsRef.current?.startBldg || 0}`, '#f39c12'],
                ['⏱ משך הקרב', `${stats.duration} שנ׳`, '#ccc'],
            ].map(([lbl, val, clr]) => (<div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{lbl}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: clr }}>{val}</span>
              </div>))}
          </div>
          <button onPointerDown={() => { onFinish(); onClose(); }} style={{ background: 'linear-gradient(135deg,#1a6b1a,#27ae60)', border: 'none', borderRadius: 14, padding: '14px 48px', color: '#fff', fontSize: 17, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 22px rgba(39,174,96,.5)' }}>
            ✅ סיים קרב
          </button>
          <div style={{ color: 'rgba(255,255,255,.3)', fontSize: 10 }}>תוצאה מחושבת בשרת</div>
        </div>)}
    </div>, document.body);
}
function darken(hex, f) {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
    return `rgb(${r},${g},${b})`;
}
function lighten(hex, f) {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.round(((n >> 16) & 255) * (1 + f)));
    const g = Math.min(255, Math.round(((n >> 8) & 255) * (1 + f)));
    const b = Math.min(255, Math.round((n & 255) * (1 + f)));
    return `rgb(${r},${g},${b})`;
}
//# sourceMappingURL=BattleScreen.js.map