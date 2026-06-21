import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { KingdomProfile } from '../components/KingdomProfileSheet';

/* ── Grid & Perspective ───────────────────────────────────────────── */
const COLS = 10, ROWS = 10;
const HUD_TOP = 122;
const ZOOM = 1.0;

// Perspective: t=0 (top/far) → scale=NEAR_SCALE, t=1 (bottom/near) → scale=1
const NEAR_SCALE = 0.22;
const FAR_SCALE  = 1.0;

interface Layout {
  W: number; H: number;
  cellBase: number; mapH: number; oy: number;
}

function getLayout(W: number, H: number, oy = HUD_TOP): Layout {
  const lW = W / ZOOM, lH = H / ZOOM;
  const mapH    = lH - oy - 10;
  const cellBase = Math.floor(lW / COLS * 1.68);
  return { W: lW, H: lH, cellBase, mapH, oy };
}

function project(wx: number, wy: number, L: Layout): [number, number] {
  const t     = wy / ROWS;
  const scale = NEAR_SCALE + (FAR_SCALE - NEAR_SCALE) * t;
  const sx    = L.W / 2 + (wx - COLS / 2) * L.cellBase * scale;
  const sy    = L.oy  + t * L.mapH;
  return [sx, sy];
}

function unproject(sx: number, sy: number, L: Layout): [number, number] {
  const t     = Math.max(0, Math.min(1, (sy - L.oy) / L.mapH));
  const wy    = t * ROWS;
  const scale = NEAR_SCALE + (FAR_SCALE - NEAR_SCALE) * t;
  const wx    = (sx - L.W / 2) / (L.cellBase * scale) + COLS / 2;
  return [wx, wy];
}

function unitR(wy: number, L: Layout): number {
  const t = wy / ROWS;
  const scale = NEAR_SCALE + (FAR_SCALE - NEAR_SCALE) * t;
  return Math.max(10, L.cellBase * scale * 0.52);
}

function tdist(a: {wx:number;wy:number}, b: {wx:number;wy:number}) {
  return Math.hypot(a.wx - b.wx, a.wy - b.wy);
}

/* ── Types ────────────────────────────────────────────────────────── */
interface GUnit {
  id: number; type: string; count: number;
  wx: number; wy: number; hp: number; maxHp: number;
  twx: number; twy: number; ptx: number; pty: number;
  atkCd: number; isAttacker: boolean;
  clr: string; ltr: string; spd: number; rng: number; dmg: number; rate: number;
  hasPlayerTarget: boolean; dying: number; angle: number;
}
interface GBuilding {
  id: number; type: string; wx: number; wy: number;
  hp: number; maxHp: number; img: HTMLImageElement | null; imgRuined: HTMLImageElement | null;
  clr: string; bldgH: number;
}
interface GProj {
  id: number; sx: number; sy: number; tx: number; ty: number;
  progress: number; spd: number; dmg: number;
  targetId: number; isUnit: boolean;
  clr: string; type: 'arrow'|'fireball'|'boulder';
}
interface Aoe      { wx: number; wy: number; r: number; life: number; maxLife: number; }
interface Float    { wx: number; wy: number; val: number; life: number; clr: string; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; clr: string; sz: number; }
interface Tap      { sx: number; sy: number; life: number; }
interface GS {
  units: GUnit[]; buildings: GBuilding[];
  projs: GProj[]; aoes: Aoe[]; floats: Float[]; particles: Particle[]; taps: Tap[];
  projId: number; frame: number; over: boolean;
  startAtk: number; startDef: number; startBldg: number;
}

const HERO_TYPES_BATTLE = new Set(['knight','paladin','dragon_rider','ragnar','titan','giant','ogre','mage','dwarf_fighter']);

const UNIT_EMOJI: Record<string,string> = {
  spearman:'🏹', archer:'🎯', swordsman:'⚔️', cavalry:'🐴',
  catapult:'💣', elite_guard:'🛡️', knight:'🗡️', paladin:'⚔️',
  dragon_rider:'🐉', ragnar:'🪓', titan:'🗿', giant:'👹',
  ogre:'🧌', mage:'🔮', dwarf_fighter:'⛏️',
};

/* ── Unit stats ─────────────────────────────────────────────────── */
const BS: Record<string,{spd:number;rng:number;dmg:number;hp:number;clr:string;ltr:string;rate:number;proj?:'arrow'|'fireball'|'boulder'}> = {
  spearman:     {spd:.055,rng:2.2, dmg:.20, hp:300,  clr:'#3498db',ltr:'S', rate:50, proj:'arrow'},
  archer:       {spd:.035,rng:3.0, dmg:.30, hp:220,  clr:'#2ecc71',ltr:'A', rate:45, proj:'arrow'},
  swordsman:    {spd:.065,rng:1.1, dmg:.50, hp:550,  clr:'#e67e22',ltr:'W', rate:48},
  cavalry:      {spd:.130,rng:1.2, dmg:1.0, hp:750,  clr:'#9b59b6',ltr:'C', rate:42},
  catapult:     {spd:.022,rng:5.0, dmg:2.8, hp:450,  clr:'#c0392b',ltr:'K', rate:90, proj:'boulder'},
  elite_guard:  {spd:.075,rng:1.2, dmg:2.0, hp:1100, clr:'#f39c12',ltr:'E', rate:44},
  knight:       {spd:.080,rng:1.2, dmg:3.2, hp:1500, clr:'#e74c3c',ltr:'Kn',rate:40},
  paladin:      {spd:.070,rng:1.2, dmg:5.5, hp:2200, clr:'#d4ac0d',ltr:'P', rate:38},
  dragon_rider: {spd:.140,rng:2.5, dmg:12,  hp:3000, clr:'#e74c3c',ltr:'D', rate:35, proj:'fireball'},
  ragnar:       {spd:.110,rng:1.2, dmg:15,  hp:3800, clr:'#a569bd',ltr:'R', rate:35},
  titan:        {spd:.060,rng:1.4, dmg:24,  hp:7500, clr:'#566573',ltr:'T', rate:55},
  giant:        {spd:.050,rng:1.4, dmg:45,  hp:18000,clr:'#117a65',ltr:'G', rate:65},
  ogre:         {spd:.050,rng:1.4, dmg:18,  hp:5500, clr:'#a04000',ltr:'O', rate:60},
  mage:         {spd:.060,rng:4.0, dmg:20,  hp:2200, clr:'#8e44ad',ltr:'M', rate:48, proj:'fireball'},
  dwarf_fighter:{spd:.055,rng:1.2, dmg:14,  hp:3300, clr:'#5d6d7e',ltr:'Dw',rate:52},
};

const BLDG_HP: Record<string,number> = {
  town_hall:2500,barracks:900,farm:450,lumber_mill:450,
  stone_quarry:450,gold_mine:450,wall:3500,watch_tower:1200,
  hospital:600,gem_forge:900,arcane_tower:1500,
};
const BLDG_CLR: Record<string,string> = {
  town_hall:'#7d3c98',barracks:'#c0392b',farm:'#d4ac0d',lumber_mill:'#795548',
  stone_quarry:'#717d7e',gold_mine:'#f1c40f',wall:'#566573',watch_tower:'#2e86c1',
  hospital:'#e74c3c',gem_forge:'#9b59b6',arcane_tower:'#1abc9c',
};
const BLDG_HEIGHT: Record<string,number> = {
  town_hall:1.4,watch_tower:1.6,arcane_tower:1.5,barracks:1.0,
  wall:1.2,gem_forge:1.1,hospital:0.9,farm:0.7,lumber_mill:0.8,stone_quarry:0.8,gold_mine:0.8,
};
// Buildings in center/defender territory (wy 3.5-6)
const BLDG_SLOTS: [number,number][] = [
  [4.5,3.5],[2.5,3.5],[6.5,3.5],
  [1.0,4.5],[8.0,4.5],[3.5,4.5],[6.0,4.5],
  [2.0,5.5],[7.0,5.5],[4.5,5.5],
  [0.5,4.0],[8.8,4.0],
];

function spawnParticles(gs: GS, sx: number, sy: number, clr: string, n=7) {
  for (let i=0;i<n;i++) {
    const a=Math.random()*Math.PI*2, spd=1.5+Math.random()*3.5;
    gs.particles.push({x:sx,y:sy,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-1,
      life:18+Math.random()*20,maxLife:38,clr,sz:2+Math.random()*3.5});
  }
}

/* ── Props ──────────────────────────────────────────────────────── */
interface Props {
  profile: KingdomProfile;
  squad: Record<string,number>;
  heroType?: string;
  winPct: number;
  marchSeconds: number;
  magicInit?: number;
  onClose: () => void;
  onFinish: (magicUsed: number) => void;
}
interface CanvasProps extends Props { W: number; H: number; safeTop: number; }

function getSafeTop(): number {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--sat').trim();
    const n = parseInt(v);
    return isNaN(n) ? 0 : n;
  } catch { return 0; }
}

export default function BattleScreen(props: Props) {
  const [dims, setDims] = useState({ W: window.innerWidth, H: window.innerHeight });
  const [safeTop, setSafeTop] = useState(0);
  useEffect(() => {
    // Inject CSS var so JS can read safe-area-inset-top
    const style = document.createElement('style');
    style.textContent = ':root { --sat: env(safe-area-inset-top, 0px); }';
    document.head.appendChild(style);
    // Small delay so the value resolves
    const t = setTimeout(() => setSafeTop(getSafeTop()), 100);
    const up = () => setDims({ W: window.innerWidth, H: window.innerHeight });
    window.addEventListener('resize', up);
    window.addEventListener('orientationchange', up);
    return () => {
      clearTimeout(t);
      document.head.removeChild(style);
      window.removeEventListener('resize', up);
      window.removeEventListener('orientationchange', up);
    };
  }, []);
  return <BattleCanvas key={`${dims.W}x${dims.H}`} {...props} W={dims.W} H={dims.H} safeTop={safeTop} />;
}

function BattleCanvas({ profile, squad, winPct, marchSeconds, magicInit, onClose, onFinish, W, H, safeTop }: CanvasProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const gsRef      = useRef<GS>(null!);
  const rafRef     = useRef(0);
  const magicRef   = useRef(false);
  const bgImgRef   = useRef<HTMLImageElement|null>(null);
  const hudTop = HUD_TOP + safeTop;
  const L = useRef(getLayout(W, H, hudTop)).current;

  const [timeLeft,     setTimeLeft]     = useState(marchSeconds);
  const [magicMode,    setMagicMode_]   = useState(false);
  const [magicCharges, setMagicCharges] = useState(magicInit ?? 0);
  const magicUsedRef = useRef(0);
  const [battleDone,   setBattleDone]   = useState(false);
  const [result,       setResult]       = useState<'victory'|'defeat'|null>(null);
  const [stats,        setStats]        = useState({atkLost:0,defLost:0,bldgDest:0,duration:0});
  const setMagicMode = (v:boolean) => { magicRef.current=v; setMagicMode_(v); };

  useEffect(() => {
    const tg=(window as any).Telegram?.WebApp;
    try{tg?.expand();}catch{}
    try{tg?.requestFullscreen();}catch{}
    try{tg?.disableVerticalSwipes?.();}catch{}
    try{tg?.setHeaderColor?.('#000000');}catch{}
    try{tg?.setBackgroundColor?.('#000000');}catch{}
    try{tg?.setBottomBarColor?.('#000000');}catch{}
    try{(screen as any).orientation?.lock?.('portrait');}catch{}
    // Force body/html to cover full screen
    document.body.style.overflow='hidden';
    document.documentElement.style.overflow='hidden';
    return () => {
      try{tg?.exitFullscreen();}catch{}
      document.body.style.overflow='';
      document.documentElement.style.overflow='';
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;

    /* ── Init ─────────────────────────────────── */
    // No sprite sheets — units are drawn purely on canvas

    const bldgList = (profile.buildings ?? []).slice(0, BLDG_SLOTS.length);
    const buildings: GBuilding[] = bldgList.map((b, i) => {
      const [wx,wy] = BLDG_SLOTS[i];
      const bldgFile = b.type==='town_hall'?'town_hall_1':b.type==='arcane_tower'?'arcane':b.type;
      const src = `/assets/building_${bldgFile}.png`;
      let img: HTMLImageElement | null = null;
      try { img = new Image(); img.src = src; } catch {}
      let imgRuined: HTMLImageElement | null = null;
      try { imgRuined = new Image(); imgRuined.src = '/assets/building_ruined.png'; } catch {}
      const hp = (BLDG_HP[b.type] ?? 300) * (1 + b.level * .3);
      return { id:2000+i, type:b.type, wx:wx+.5, wy:wy+.5, hp, maxHp:hp, img, imgRuined,
        clr: BLDG_CLR[b.type] ?? '#888', bldgH: BLDG_HEIGHT[b.type] ?? 0.9 };
    });

    const DEF_T=[['spearman'],['spearman','archer'],['swordsman','archer','cavalry'],
                 ['swordsman','elite_guard','archer'],['knight','paladin','cavalry']];
    const tier=(profile.defPower??0)<200?0:(profile.defPower??0)<1000?1:(profile.defPower??0)<5000?2:(profile.defPower??0)<20000?3:4;
    const defTypes=DEF_T[tier], defCount=Math.max(8,Math.round((profile.armySize??40)/defTypes.length));
    const defenders: GUnit[] = defTypes.map((t,i) => {
      const st=BS[t]??BS.spearman;
      const wx=1+(i%3)*2.5, wy=3.5+Math.floor(i/3)*1.0;
      return {id:1000+i,type:t,count:defCount,wx,wy,hp:st.hp,maxHp:st.hp,
        twx:wx,twy:wy,ptx:wx,pty:wy,atkCd:Math.floor(Math.random()*st.rate),
        isAttacker:false,hasPlayerTarget:false,dying:0,angle:Math.PI,
        clr:'#c0392b',ltr:st.ltr,spd:st.spd,rng:st.rng,dmg:st.dmg,rate:st.rate};
    });

    const entries=Object.entries(squad).filter(([,c])=>c>0);
    const aCols=Math.max(1,Math.ceil(Math.sqrt(entries.length)));
    const attackers: GUnit[] = entries.map(([type,count],i) => {
      const st=BS[type]??BS.spearman;
      const wx=1+(i%aCols)*1.8, wy=ROWS-0.5-Math.floor(i/aCols)*0.4;
      return {id:i,type,count,wx,wy,hp:st.hp,maxHp:st.hp,
        twx:wx,twy:wy,ptx:wx,pty:wy,atkCd:Math.floor(Math.random()*st.rate),
        isAttacker:true,hasPlayerTarget:false,dying:0,angle:0,
        clr:st.clr,ltr:st.ltr,spd:st.spd,rng:st.rng,dmg:st.dmg,rate:st.rate};
    });

    const startAtk=attackers.length,startDef=defenders.length,startBldg=buildings.length;
    gsRef.current={units:[...attackers,...defenders],buildings,projs:[],aoes:[],
      floats:[],particles:[],taps:[],projId:0,frame:0,over:false,startAtk,startDef,startBldg};

    const TOTAL=marchSeconds*60;

    // Load background image
    const bg = new Image();
    bg.src = '/assets/war.jpg';
    bg.onload = () => { bgImgRef.current = bg; };
    // Seeded ground details
    const GDETAILS = Array.from({length:38},(_,i)=>({
      wx:(((i*137)%97)/97)*COLS,
      wy:(((i*91+13)%83)/83)*ROWS,
      type:i%3, // 0=rock 1=grass 2=dirt
    }));

    /* ── Tick ─────────────────────────────────── */
    function tick() {
      rafRef.current=requestAnimationFrame(tick);
      const gs=gsRef.current;
      gs.frame++;
      if(gs.frame%60===0) setTimeLeft(Math.max(0,Math.ceil((TOTAL-gs.frame)/60)));

      if(!gs.over) {
        const atk=gs.units.filter(u=>u.isAttacker&&u.hp>0&&u.dying===0);
        const def=gs.units.filter(u=>!u.isAttacker&&u.hp>0&&u.dying===0);
        const lBld=gs.buildings.filter(b=>b.hp>0);

        gs.units.forEach(u=>{
          if(u.hp<=0||u.dying>0) return;
          const enemies=u.isAttacker?def:atk;
          let nE:GUnit|null=null,nED=Infinity;
          enemies.forEach(e=>{const d=tdist(u,e);if(d<nED){nED=d;nE=e;}});

          if(u.isAttacker){
            let nB:GBuilding|null=null,nBD=Infinity;
            lBld.forEach(b=>{const d=tdist(u,b);if(d<nBD){nBD=d;nB=b;}});
            const AGGRO=u.rng*2.8;

            if(nE&&nED<=u.rng){
              if(u.atkCd<=0){fireOrHit(gs,u,nE);u.atkCd=u.rate;}
              u.angle=Math.atan2(nE.wy-u.wy,nE.wx-u.wx);
              if(!u.hasPlayerTarget){u.twx=u.wx;u.twy=u.wy;}
            } else if(nB&&nBD<=u.rng+.5&&def.length===0){
              if(u.atkCd<=0){
                nB.hp=Math.max(0,nB.hp-u.dmg);
                const[sx,sy]=project(nB.wx,nB.wy,L);
                gs.floats.push({wx:nB.wx,wy:nB.wy,val:Math.round(u.dmg),life:40,clr:'#ffa502'});
                spawnParticles(gs,sx,sy,'#ff6b00',4);
                u.atkCd=u.rate;
              }
              u.angle=Math.atan2(nB.wy-u.wy,nB.wx-u.wx);
              if(!u.hasPlayerTarget){u.twx=u.wx;u.twy=u.wy;}
            } else if(u.hasPlayerTarget){
              u.twx=u.ptx;u.twy=u.pty;
              u.angle=Math.atan2(u.pty-u.wy,u.ptx-u.wx);
            } else if(nE&&nED<=AGGRO){
              u.twx=nE.wx;u.twy=nE.wy;
              u.angle=Math.atan2(nE.wy-u.wy,nE.wx-u.wx);
            } else if(nE){
              u.twx=nE.wx;u.twy=nE.wy;
              u.angle=Math.atan2(nE.wy-u.wy,nE.wx-u.wx);
            } else if(nB){
              u.twx=nB.wx;u.twy=nB.wy;
              u.angle=Math.atan2(nB.wy-u.wy,nB.wx-u.wx);
            }
          } else {
            if(nE&&nED<=u.rng){
              if(u.atkCd<=0){fireOrHit(gs,u,nE);u.atkCd=u.rate;}
              u.angle=Math.atan2(nE.wy-u.wy,nE.wx-u.wx);
              u.twx=u.wx;u.twy=u.wy;
            } else if(nE&&(gs.frame>90||nED<4)){
              u.twx=nE.wx;u.twy=nE.wy;
              u.angle=Math.atan2(nE.wy-u.wy,nE.wx-u.wx);
            }
          }

          const dx=u.twx-u.wx,dy=u.twy-u.wy,dd=Math.hypot(dx,dy);
          if(dd>.05){u.wx+=dx/dd*u.spd;u.wy+=dy/dd*u.spd;}
          if(u.hasPlayerTarget&&Math.hypot(u.ptx-u.wx,u.pty-u.wy)<.15) u.hasPlayerTarget=false;
          u.wx=Math.max(.05,Math.min(COLS-.05,u.wx));
          u.wy=Math.max(.05,Math.min(ROWS-.05,u.wy));
          if(u.atkCd>0) u.atkCd--;

          if(u.hp<=0&&u.dying===0){
            u.dying=22;
            const[sx,sy]=project(u.wx,u.wy,L);
            spawnParticles(gs,sx,sy,u.clr,16);
            spawnParticles(gs,sx,sy,'#ffcc44',6);
          }
        });

        gs.units.forEach(u=>{if(u.dying>0)u.dying--;});
        gs.units=gs.units.filter(u=>!(u.hp<=0&&u.dying===0&&gs.frame>5));

        gs.projs=gs.projs.filter(p=>{
          p.progress+=p.spd;
          if(p.progress>=1){
            if(p.isUnit){
              const t=gs.units.find(u=>u.id===p.targetId&&u.hp>0&&u.dying===0);
              if(t){t.hp=Math.max(0,t.hp-p.dmg);gs.floats.push({wx:t.wx,wy:t.wy,val:Math.round(p.dmg),life:40,clr:p.clr});spawnParticles(gs,p.tx,p.ty,p.clr,5);}
            } else {
              const t=gs.buildings.find(b=>b.id===p.targetId&&b.hp>0);
              if(t){t.hp=Math.max(0,t.hp-p.dmg);gs.floats.push({wx:t.wx,wy:t.wy,val:Math.round(p.dmg),life:40,clr:'#ffa502'});spawnParticles(gs,p.tx,p.ty,'#ff6600',5);}
            }
            return false;
          }
          return true;
        });

        gs.aoes     =gs.aoes.filter(e=>e.life>0).map(e=>({...e,r:e.r+.2,life:e.life-1}));
        gs.floats   =gs.floats.filter(f=>f.life>0).map(f=>({...f,wy:f.wy-.022,life:f.life-1}));
        gs.taps     =gs.taps.filter(t=>t.life>0).map(t=>({...t,life:t.life-1}));
        gs.particles=gs.particles.filter(p=>p.life>0).map(p=>({...p,x:p.x+p.vx,y:p.y+p.vy,vy:p.vy+.14,life:p.life-1}));

        const atkA=gs.units.filter(u=>u.isAttacker&&u.hp>0).length;
        const defA=gs.units.filter(u=>!u.isAttacker&&u.hp>0).length;
        const bldgA=gs.buildings.filter(b=>b.hp>0).length;
        if(gs.frame>=TOTAL||(defA===0&&bldgA===0)||atkA===0){
          gs.over=true;
          const bd=gs.startBldg-bldgA,perf=gs.startBldg>0?bd/gs.startBldg:(defA===0?1:0);
          const won=(defA===0&&bldgA===0)||(atkA>0&&Math.random()*100<winPct*.7+perf*100*.3);
          setResult(won?'victory':'defeat');
          setStats({atkLost:gs.startAtk-atkA,defLost:gs.startDef-defA,bldgDest:bd,duration:Math.floor(gs.frame/60)});
          setBattleDone(true);
        }
      }

      /* ── RENDER ───────────────────────────────── */
      ctx.clearRect(0,0,W,H);
      ctx.shadowBlur=0; ctx.shadowColor='transparent';
      ctx.save();
      ctx.scale(ZOOM,ZOOM);

      // Background image (or fallback gradient)
      if(bgImgRef.current){
        ctx.drawImage(bgImgRef.current,0,0,L.W,L.H);
        // Dark overlay so units stand out
        ctx.fillStyle='rgba(0,0,0,0.28)'; ctx.fillRect(0,0,L.W,L.H);
      } else {
        const sky=ctx.createLinearGradient(0,0,0,L.oy+L.mapH*.35);
        sky.addColorStop(0,'#0d1520'); sky.addColorStop(.6,'#1a2d1a'); sky.addColorStop(1,'#243020');
        ctx.fillStyle=sky; ctx.fillRect(0,0,L.W,L.H);
      }

      // Zone divider — faint blood line at row 5
      const[dl0,dl1]=project(0,5,L), [dr0,dr1]=project(COLS,5,L);
      ctx.strokeStyle='rgba(200,50,50,.25)'; ctx.lineWidth=1.2; ctx.setLineDash([12,8]);
      ctx.beginPath(); ctx.moveTo(dl0,dl1); ctx.lineTo(dr0,dr1); ctx.stroke();
      ctx.setLineDash([]);

      // Ground details — rocks, grass tufts, dirt patches
      GDETAILS.forEach(d=>{
        const[gx,gy]=project(d.wx,d.wy,L);
        const t=d.wy/ROWS, sc=NEAR_SCALE+(FAR_SCALE-NEAR_SCALE)*t;
        const sz=L.cellBase*sc*0.09;
        if(d.type===0){ // rock
          ctx.fillStyle='rgba(75,65,55,.55)';
          ctx.beginPath(); ctx.ellipse(gx,gy,sz*1.5,sz*.85,0.4,0,Math.PI*2); ctx.fill();
          ctx.fillStyle='rgba(120,110,95,.3)';
          ctx.beginPath(); ctx.ellipse(gx-sz*.3,gy-sz*.3,sz*.6,sz*.4,0.4,0,Math.PI*2); ctx.fill();
        } else if(d.type===1){ // grass
          ctx.strokeStyle='rgba(35,75,25,.5)'; ctx.lineWidth=1.1;
          ctx.beginPath(); ctx.moveTo(gx,gy); ctx.lineTo(gx-sz,gy-sz*2.2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(gx,gy); ctx.lineTo(gx+sz*.6,gy-sz*2.5); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(gx,gy); ctx.lineTo(gx+sz*1.2,gy-sz*1.8); ctx.stroke();
        } else { // dirt patch
          ctx.fillStyle='rgba(55,35,15,.28)';
          ctx.beginPath(); ctx.ellipse(gx,gy,sz*2.5,sz,0,0,Math.PI*2); ctx.fill();
        }
      });

      // Depth sort — by wy (closer = higher wy = drawn last)
      const allItems=[
        ...gsRef.current.buildings.map(b=>({wy:b.wy,k:'bldg' as const,b})),
        ...gsRef.current.units.filter(u=>u.hp>0||u.dying>0).map(u=>({wy:u.wy,k:'unit' as const,u})),
        ...gsRef.current.aoes.map(e=>({wy:e.wy,k:'aoe' as const,e})),
        ...gsRef.current.floats.map(f=>({wy:f.wy,k:'flt' as const,f})),
      ];
      allItems.sort((a,b)=>a.wy-b.wy);

      allItems.forEach(item=>{
        if(item.k==='bldg'){
          const b=item.b;
          const[sx,sy]=project(b.wx,b.wy,L);
          const t=b.wy/ROWS, scale=NEAR_SCALE+(FAR_SCALE-NEAR_SCALE)*t;
          const R=L.cellBase*scale*(b.type==='town_hall'?.44:.33);
          const wallH=R*b.bldgH*2.2;

          if(b.hp<=0){
            const imgW=R*8.4, imgH=(wallH+R*0.8)*3;
            if(b.imgRuined&&b.imgRuined.complete&&b.imgRuined.naturalWidth>0){
              ctx.globalAlpha=0.85;
              ctx.drawImage(b.imgRuined,sx-imgW/2,sy-imgH,imgW,imgH);
              ctx.globalAlpha=1;
            } else {
              ctx.globalAlpha=.5; ctx.fillStyle='#3d1a00';
              ctx.beginPath(); ctx.ellipse(sx,sy,R*.9,R*.4,0,0,Math.PI*2); ctx.fill();
              ctx.strokeStyle='#ff4400'; ctx.lineWidth=1.5;
              ctx.beginPath(); ctx.moveTo(sx-R*.6,sy-R*.3); ctx.lineTo(sx+R*.6,sy+R*.3); ctx.stroke();
              ctx.beginPath(); ctx.moveTo(sx+R*.6,sy-R*.3); ctx.lineTo(sx-R*.6,sy+R*.3); ctx.stroke();
              ctx.globalAlpha=1;
            }
            return;
          }

          const imgW=R*8.4, imgH=(wallH+R*0.8)*3;
          const imgX=sx-imgW/2, imgY=sy-imgH;

          if(b.img&&b.img.complete&&b.img.naturalWidth>0){
            ctx.drawImage(b.img,imgX,imgY,imgW,imgH);
          } else {
            // Fallback: 3D box
            ctx.fillStyle=darken(b.clr,.5);
            ctx.beginPath(); ctx.moveTo(sx-R,sy); ctx.lineTo(sx-R,sy-wallH); ctx.lineTo(sx,sy-wallH-R*.4); ctx.lineTo(sx,sy-R*.4); ctx.closePath(); ctx.fill();
            ctx.fillStyle=darken(b.clr,.65);
            ctx.beginPath(); ctx.moveTo(sx+R,sy); ctx.lineTo(sx+R,sy-wallH); ctx.lineTo(sx,sy-wallH-R*.4); ctx.lineTo(sx,sy-R*.4); ctx.closePath(); ctx.fill();
            const gRoof=ctx.createLinearGradient(sx-R,sy-wallH,sx+R,sy-wallH-R*.4);
            gRoof.addColorStop(0,b.clr); gRoof.addColorStop(1,lighten(b.clr,.3));
            ctx.fillStyle=gRoof;
            ctx.beginPath(); ctx.moveTo(sx-R,sy-wallH); ctx.lineTo(sx+R,sy-wallH); ctx.lineTo(sx+R*.5,sy-wallH-R*.8); ctx.lineTo(sx-R*.5,sy-wallH-R*.8); ctx.closePath(); ctx.fill();
          }

          // HP bar
          const bw=R*2.4;
          ctx.fillStyle='rgba(0,0,0,.7)'; ctx.fillRect(sx-bw/2,imgY-8,bw,5);
          ctx.fillStyle=b.hp/b.maxHp>.5?'#2ecc71':b.hp/b.maxHp>.25?'#f39c12':'#e74c3c';
          ctx.fillRect(sx-bw/2,imgY-8,bw*Math.max(0,b.hp/b.maxHp),5);

        } else if(item.k==='unit'){
          const u=item.u;
          const[sx,sy]=project(u.wx,u.wy,L);
          const baseR=unitR(u.wy,L);
          const isHero=HERO_TYPES_BATTLE.has(u.type);
          const R=isHero ? baseR*1.55 : baseR;
          const alpha=u.dying>0?u.dying/22:1;
          ctx.globalAlpha=alpha;

          const isMoving=Math.hypot(u.twx-u.wx,u.twy-u.wy)>0.08;
          const bob=(u.dying===0&&isMoving)?Math.sin(gs.frame*.18+u.id*2.1)*R*.12:0;
          const deathP=u.dying>0?1-u.dying/22:0;
          const deathSpin=deathP*Math.PI*.55*(u.isAttacker?1:-1);
          const deathScale=1-deathP*.55;

          // Ground shadow
          ctx.fillStyle='rgba(0,0,0,.35)';
          ctx.beginPath(); ctx.ellipse(sx+R*.1,sy+R*.22,R*.75*deathScale,R*.28*deathScale,0,0,Math.PI*2); ctx.fill();

          // Hero glow
          if(isHero&&u.dying===0){
            ctx.fillStyle=u.clr+'22';
            ctx.beginPath(); ctx.ellipse(sx,sy-R*.3-bob,R*1.55,R*1.55,0,0,Math.PI*2); ctx.fill();
          }

          const cy=sy-R*.35-bob;
          ctx.save();
          if(u.dying>0){ ctx.translate(sx,cy); ctx.rotate(deathSpin); ctx.scale(deathScale,deathScale); ctx.translate(-sx,-cy); }

          const gShell=ctx.createRadialGradient(sx-R*.25,cy-R*.25,R*.1,sx,cy,R);
          gShell.addColorStop(0,lighten(u.clr,.45)); gShell.addColorStop(.6,u.clr); gShell.addColorStop(1,darken(u.clr,.5));
          ctx.fillStyle=gShell; ctx.beginPath(); ctx.arc(sx,cy,R,0,Math.PI*2); ctx.fill();

          const gShine=ctx.createRadialGradient(sx-R*.3,cy-R*.3,0,sx-R*.2,cy-R*.2,R*.7);
          gShine.addColorStop(0,'rgba(255,255,255,.45)'); gShine.addColorStop(1,'rgba(255,255,255,0)');
          ctx.fillStyle=gShine; ctx.beginPath(); ctx.arc(sx,cy,R,0,Math.PI*2); ctx.fill();

          ctx.font=`${Math.max(10,Math.round(R*(isHero?1.05:.85)))}px sans-serif`;
          ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(UNIT_EMOJI[u.type]??'⚔️',sx,cy+R*.06);
          ctx.restore();

          // Count pill
          const pw=Math.max(22,R*1.6);
          const pillY=sy+R*.72;
          ctx.fillStyle='rgba(0,0,0,.85)';
          ctx.beginPath(); ctx.roundRect(sx-pw/2,pillY,pw,14,6); ctx.fill();
          ctx.fillStyle=u.isAttacker?'#88ccff':'#ff9999';
          ctx.font=`bold ${Math.max(8,Math.round(R*.52))}px sans-serif`;
          ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(`×${u.count}`,sx,pillY+7);

          // HP bar
          const bw=R*2.2;
          ctx.fillStyle='rgba(0,0,0,.65)'; ctx.fillRect(sx-bw/2,sy-R*1.3-8,bw,5);
          ctx.fillStyle=u.hp/u.maxHp>.55?'#2ecc71':u.hp/u.maxHp>.28?'#f39c12':'#e74c3c';
          ctx.fillRect(sx-bw/2,sy-R*1.3-8,bw*Math.max(0,u.hp/u.maxHp),5);

          ctx.globalAlpha=1;

        } else if(item.k==='aoe'){
          const e=item.e;
          const[sx,sy]=project(e.wx,e.wy,L);
          const t=e.wy/ROWS, scale=NEAR_SCALE+(FAR_SCALE-NEAR_SCALE)*t;
          const r=e.r*L.cellBase*scale*1.2;
          const a=e.life/e.maxLife;
          ctx.strokeStyle=`rgba(220,80,255,${a})`; ctx.lineWidth=3;
          ctx.beginPath(); ctx.ellipse(sx,sy,r,r*.35,0,0,Math.PI*2); ctx.stroke();
          ctx.fillStyle=`rgba(160,0,220,${a*.18})`; ctx.fill();

        } else if(item.k==='flt'){
          const f=item.f;
          const[sx,sy]=project(f.wx,f.wy,L);
          ctx.globalAlpha=f.life/40; ctx.fillStyle=f.clr;
          ctx.font='bold 12px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(`-${f.val}`,sx,sy-36); ctx.globalAlpha=1;
        }
      });

      // Projectiles
      gsRef.current.projs.forEach(p=>{
        const x=p.sx+(p.tx-p.sx)*p.progress;
        const y=p.sy+(p.ty-p.sy)*p.progress-Math.sin(p.progress*Math.PI)*22;
        ctx.save();
        if(p.type==='arrow'){
          const angle=Math.atan2(p.ty-p.sy,p.tx-p.sx);
          ctx.translate(x,y); ctx.rotate(angle);
          ctx.fillStyle='#e8d5a3'; ctx.fillRect(-7,-1,14,2);
          ctx.fillStyle='#e74c3c'; ctx.beginPath(); ctx.moveTo(-7,0); ctx.lineTo(-12,-3); ctx.lineTo(-12,3); ctx.closePath(); ctx.fill();
        } else if(p.type==='fireball'){
          const r=5;
          const g=ctx.createRadialGradient(x,y,0,x,y,r*2.5);
          g.addColorStop(0,'#fff'); g.addColorStop(.4,'#ff8c00'); g.addColorStop(1,'rgba(255,0,0,0)');
          ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r*2.5,0,Math.PI*2); ctx.fill();
        } else {
          ctx.fillStyle='#78909c'; ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fill();
        }
        ctx.restore();
      });

      // Particles
      gsRef.current.particles.forEach(p=>{
        ctx.globalAlpha=p.life/p.maxLife; ctx.fillStyle=p.clr;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.sz*(p.life/p.maxLife),0,Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha=1;

      // Tap rings
      gsRef.current.taps.forEach(t=>{
        const a=t.life/30;
        ctx.strokeStyle=`rgba(255,255,80,${a})`; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(t.sx,t.sy,22*(1-a)+5,0,Math.PI*2); ctx.stroke();
      });

      // Vignette
      const vig=ctx.createRadialGradient(L.W/2,L.H/2,L.H*.18,L.W/2,L.H/2,L.H*.7);
      vig.addColorStop(0,'rgba(0,0,0,0)'); vig.addColorStop(1,'rgba(0,0,0,.52)');
      ctx.fillStyle=vig; ctx.fillRect(0,0,L.W,L.H);
      ctx.restore();
    }

    rafRef.current=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(rafRef.current);
  }, []);

  function fireOrHit(gs:GS, u:GUnit, target:GUnit) {
    const st=BS[u.type];
    const[sx,sy]=project(u.wx,u.wy,L);
    const[tx,ty]=project(target.wx,target.wy,L);
    if(st?.proj){
      gs.projs.push({id:gs.projId++,sx,sy,tx,ty,progress:0,spd:.07,dmg:u.dmg,
        targetId:target.id,isUnit:true,clr:u.clr,type:st.proj});
    } else {
      target.hp=Math.max(0,target.hp-u.dmg);
      gs.floats.push({wx:target.wx,wy:target.wy,val:Math.round(u.dmg),life:40,clr:u.isAttacker?'#ff6b6b':'#ffd32a'});
      spawnParticles(gs,tx,ty,u.isAttacker?'#ff4444':'#ffaa00',5);
      // Shockwave ring
      gs.aoes.push({wx:target.wx,wy:target.wy,r:0.05,life:12,maxLife:12});
    }
  }

  /* ── Input ────────────────────────────────────── */
  const handleTapRef=useRef<(x:number,y:number)=>void>(null!);
  handleTapRef.current=(clientX:number,clientY:number)=>{
    const gs=gsRef.current; if(!gs||gs.over) return;
    const rect=canvasRef.current!.getBoundingClientRect();
    const sx=(clientX-rect.left)/ZOOM, sy=(clientY-rect.top)/ZOOM;
    const[twx,twy]=unproject(sx,sy,L);
    gs.taps.push({sx,sy,life:30});

    if(magicRef.current){
      const R=2.0;
      gs.units.forEach(u=>{if(!u.isAttacker&&u.hp>0&&u.dying===0&&tdist({wx:twx,wy:twy},u)<R) u.hp=Math.max(1,Math.ceil(u.hp*.5));});
      gs.buildings.forEach(b=>{if(b.hp>0&&tdist({wx:twx,wy:twy},b)<R) b.hp=Math.max(1,Math.ceil(b.hp*.5));});
      gs.aoes.push({wx:twx,wy:twy,r:.1,life:24,maxLife:24});
      setMagicMode(false); setMagicCharges(c=>c-1); magicUsedRef.current++;
    } else {
      const live=gs.units.filter(u=>u.isAttacker&&u.hp>0&&u.dying===0);
      live.sort((a,b)=>tdist(a,{wx:twx,wy:twy})-tdist(b,{wx:twx,wy:twy}));
      live.slice(0,Math.max(3,Math.ceil(live.length*.4))).forEach(u=>{
        u.ptx=Math.max(.1,Math.min(COLS-.1,twx+(Math.random()-.5)*.7));
        u.pty=Math.max(.1,Math.min(ROWS-.1,twy+(Math.random()-.5)*.7));
        u.twx=u.ptx; u.twy=u.pty; u.hasPlayerTarget=true;
      });
    }
  };

  const lastTouchMs=useRef(0);
  useEffect(()=>{
    const canvas=canvasRef.current!;
    const fn=(e:TouchEvent)=>{e.preventDefault();lastTouchMs.current=Date.now();handleTapRef.current(e.touches[0].clientX,e.touches[0].clientY);};
    canvas.addEventListener('touchstart',fn,{passive:false});
    return()=>canvas.removeEventListener('touchstart',fn);
  },[]);

  return createPortal(
    <div style={{position:'fixed',inset:0,zIndex:99999,touchAction:'none',overflow:'hidden',background:'#000'}}>
      <canvas ref={canvasRef} width={W} height={H}
        style={{position:'absolute',inset:0,display:'block',touchAction:'none'}}
        onPointerDown={e=>{if(Date.now()-lastTouchMs.current<300)return;e.preventDefault();handleTapRef.current(e.clientX,e.clientY);}}
      />

      {/* Top HUD */}
      <div style={{position:'absolute',top:0,left:0,right:0,height:hudTop,display:'flex',alignItems:'flex-end',justifyContent:'space-between',padding:`0 14px ${8}px`,paddingTop:safeTop,background:'rgba(0,0,0,.6)',backdropFilter:'blur(6px)',borderBottom:'1px solid rgba(255,255,255,.07)',pointerEvents:'none'}}>
        <div style={{background:'rgba(0,50,100,.75)',borderRadius:10,padding:'4px 10px',color:'#7dc',fontSize:11,fontWeight:700}}>⚔️ הצבא שלך</div>
        <div style={{background:'rgba(5,15,35,.9)',border:`1.5px solid ${timeLeft<=10?'#e74c3c':'rgba(100,160,255,.4)'}`,borderRadius:20,padding:'4px 18px',color:timeLeft<=10?'#e74c3c':'#cde',fontSize:19,fontWeight:900,boxShadow:timeLeft<=10?'0 0 16px rgba(231,76,60,.6)':'none'}}>
          ⏱ {timeLeft}s
        </div>
        <div style={{background:'rgba(100,0,0,.75)',borderRadius:10,padding:'4px 10px',color:'#faa',fontSize:11,fontWeight:700}}>🏰 {profile.name}</div>
      </div>

      {/* Magic button — always visible */}
      {(
        <button onPointerDown={e=>{e.stopPropagation();if(magicCharges>0)setMagicMode(!magicMode);}}
          style={{position:'absolute',bottom:16,left:'50%',transform:'translateX(-50%)',
            background:magicCharges===0?'rgba(30,30,30,.6)':magicMode?'rgba(160,0,240,.9)':'rgba(50,0,120,.9)',
            border:`1.5px solid ${magicCharges===0?'rgba(255,255,255,.1)':magicMode?'#d040fb':'rgba(160,0,255,.45)'}`,
            borderRadius:24,padding:'9px 22px',color:magicCharges===0?'rgba(255,255,255,.3)':'#fff',
            fontSize:14,fontWeight:800,cursor:magicCharges>0?'pointer':'default',
            display:'flex',alignItems:'center',gap:8,
            boxShadow:magicMode?'0 0 24px rgba(200,0,255,.85)':'0 2px 12px rgba(0,0,0,.5)'}}>
          <span>{magicMode?'✨ בחר מטרה':'✨ קסם AOE'}</span>
          <span style={{background:'rgba(255,255,255,.2)',borderRadius:10,padding:'1px 9px',fontSize:12,fontWeight:900}}>×{magicCharges}</span>
        </button>
      )}

      {/* Battle result */}
      {battleDone&&(
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.85)',gap:16,padding:24}}>
          <div style={{fontSize:50,fontWeight:900,color:result==='victory'?'#f4d03f':'#e74c3c',textShadow:`0 0 40px ${result==='victory'?'rgba(244,208,63,.9)':'rgba(231,76,60,.9)'}`}}>
            {result==='victory'?'🏆 ניצחון!':'💀 הובסת!'}
          </div>
          <div style={{background:'rgba(255,255,255,.06)',borderRadius:16,padding:'16px 26px',display:'flex',flexDirection:'column',gap:10,width:'100%',maxWidth:290,border:'1px solid rgba(255,255,255,.1)'}}>
            {([
              ['⚔️ יחידות שאבדו',`${stats.atkLost}`,'#faa'],
              ['💀 הגנה שנהרסה', `${stats.defLost}`,'#7dc'],
              ['🏚 בניינים שנהרסו',`${stats.bldgDest} / ${gsRef.current?.startBldg||0}`,'#f39c12'],
              ['⏱ משך הקרב',    `${stats.duration} שנ׳`,'#ccc'],
            ] as [string,string,string][]).map(([lbl,val,clr])=>(
              <div key={lbl} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:12,color:'rgba(255,255,255,.6)'}}>{lbl}</span>
                <span style={{fontSize:14,fontWeight:800,color:clr}}>{val}</span>
              </div>
            ))}
          </div>
          <button onPointerDown={()=>{onFinish(magicUsedRef.current);onClose();}}
            style={{background:'linear-gradient(135deg,#1a6b1a,#27ae60)',border:'none',borderRadius:14,padding:'14px 48px',color:'#fff',fontSize:17,fontWeight:900,cursor:'pointer',boxShadow:'0 4px 22px rgba(39,174,96,.5)'}}>
            ✅ סיים קרב
          </button>
          <div style={{color:'rgba(255,255,255,.3)',fontSize:10}}>תוצאה מחושבת בשרת</div>
        </div>
      )}
    </div>,
    document.body
  );
}

// Color helpers
function darken(hex: string, f: number): string {
  const n=parseInt(hex.replace('#',''),16);
  const r=Math.round(((n>>16)&255)*f), g=Math.round(((n>>8)&255)*f), b=Math.round((n&255)*f);
  return `rgb(${r},${g},${b})`;
}
function lighten(hex: string, f: number): string {
  const n=parseInt(hex.replace('#',''),16);
  const r=Math.min(255,Math.round(((n>>16)&255)*(1+f)));
  const g=Math.min(255,Math.round(((n>>8)&255)*(1+f)));
  const b=Math.min(255,Math.round((n&255)*(1+f)));
  return `rgb(${r},${g},${b})`;
}
