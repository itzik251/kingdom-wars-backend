import { useEffect, useState, useMemo, useRef } from 'react';
import { api } from '../api/client';
import { fmt } from '../utils/format';
import { useT } from '../i18n/useT';
import Countdown from './Countdown';
import { useGameStore } from '../store/gameStore';
import { ResIcon } from './ResIcon';
import KingdomMapView from './KingdomMapView';
import BattleScreen from '../screens/BattleScreen';

export interface KingdomProfile {
  id: string; name: string; username?: string; score: number;
  isShielded: boolean; shieldUntil?: string | null; usdtBalance?: number;
  resources: { gold: number; wood: number; stone: number };
  lootable: { gold: number; wood: number; stone: number; gems: number };
  defPower: number; myAttackPower: number; winChance: number;
  marchSeconds: number; wallLevel: number; armySize: number;
  buildings: { type: string; level: number }[];
}
export interface AttackSquad { heroType?: string; squad?: Record<string, number> }
interface Props {
  kingdomId: string; onClose: () => void;
  onAttack: (profile: KingdomProfile, squadOptions?: AttackSquad) => void;
  attacking?: boolean; marchCountdown?: number;
  sentSquad?: Record<string, number>;
}


const HERO_TYPES = new Set(['knight', 'paladin', 'dragon_rider', 'ragnar', 'titan', 'giant', 'ogre', 'mage', 'dwarf_fighter']);
const HERO_POWER: Record<string, number> = { giant: 2000, titan: 800, mage: 600, dragon_rider: 250, ragnar: 400, ogre: 350, paladin: 80, dwarf_fighter: 280, knight: 40 };
const UNIT_ATK:   Record<string, number> = {
  spearman: 1, archer: 2, swordsman: 4, cavalry: 9, catapult: 15, elite_guard: 25,
  knight: 40, paladin: 80, dragon_rider: 250, ragnar: 400, titan: 800, giant: 2000,
  ogre: 350, mage: 600, dwarf_fighter: 280,
};
const HERO_SALARY: Record<string, number> = { giant: 10, mage: 6, dragon_rider: 5, ogre: 4, ragnar: 2, dwarf_fighter: 3, paladin: 3, titan: 0, knight: 1 };
const UNIT_META: Record<string, { icon: string; nameKey: string; heroColor?: string }> = {
  knight:        { icon: '🗡️', nameKey: 'u_knight',        heroColor: '#85c1e9' },
  paladin:       { icon: '⚔️', nameKey: 'u_paladin',       heroColor: '#f4d03f' },
  dragon_rider:  { icon: '🐉', nameKey: 'u_dragon_rider',  heroColor: '#e74c3c' },
  ragnar:        { icon: '🪓', nameKey: 'u_ragnar',         heroColor: '#e67e22' },
  titan:         { icon: '🗿', nameKey: 'u_titan',          heroColor: '#9b59b6' },
  giant:         { icon: '👹', nameKey: 'u_giant',          heroColor: '#8e44ad' },
  ogre:          { icon: '🧌', nameKey: 'u_ogre',           heroColor: '#27ae60' },
  mage:          { icon: '🧙', nameKey: 'u_mage',           heroColor: '#a29bfe' },
  dwarf_fighter: { icon: '⛏️', nameKey: 'u_dwarf_fighter', heroColor: '#cd853f' },
  spearman:      { icon: '🏹', nameKey: 'u_spearman' },
  archer:        { icon: '🏹', nameKey: 'u_archer' },
  swordsman:     { icon: '🗡️', nameKey: 'u_swordsman' },
  cavalry:       { icon: '🐴', nameKey: 'u_cavalry' },
  catapult:      { icon: '🪨', nameKey: 'u_catapult' },
  elite_guard:   { icon: '🛡️', nameKey: 'u_elite_guard' },
};

export default function KingdomProfileSheet({ kingdomId, onClose, onAttack, attacking, marchCountdown = 0, sentSquad }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile]         = useState<KingdomProfile | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(false);
  const [squadCounts, setSquadCounts] = useState<Record<string, number>>({});
  const [showKingdom, setShowKingdom] = useState(false);
  const [showBattleChoice, setShowBattleChoice] = useState(false);
  const [showBattleScreen, setShowBattleScreen] = useState(false);
  const [pendingSquad, setPendingSquad] = useState<AttackSquad | null>(null);
  const t       = useT();
  const myScore   = useGameStore(s => s.kingdom?.score ?? 0);
  const isVip     = useGameStore(s => !!(s.kingdom as any)?.isVip);
  const myMagic   = useGameStore(s => (s.kingdom as any)?.magic ?? 0);
  const myUnits        = useGameStore(s => s.units ?? []);
  const myGems         = useGameStore(s => s.kingdom?.gems ?? 0);
  const anyMarching    = useGameStore(s => Object.keys(s.marchingSquads).length > 0);
  const refresh        = useGameStore(s => s.refresh);

  // Heroes without gems salary can't fight
  const heroCanFight = (type: string) => {
    const salary = HERO_SALARY[type] ?? 0;
    return salary === 0 || myGems >= salary;
  };

  // When marching, also show units that were sent (count=0 in store but >0 in sentSquad)
  const sentTypes      = (attacking && sentSquad) ? Object.keys(sentSquad).filter(k => (sentSquad[k] ?? 0) > 0) : [];
  const myHeroUnits    = myUnits.filter(u => HERO_TYPES.has(u.type) && (u.count > 0 || sentTypes.includes(u.type)));
  const mySoldierUnits = myUnits.filter(u => !HERO_TYPES.has(u.type) && (u.count > 0 || sentTypes.includes(u.type)));
  const hasAnyHero     = myUnits.some(u => HERO_TYPES.has(u.type) && u.count > 0 && heroCanFight(u.type));
  const totalHeroCount = myUnits.filter(u => HERO_TYPES.has(u.type)).reduce((s, u) => s + u.count, 0);

  // When marching, display what was actually sent; otherwise use slider counts
  const displayCounts   = (attacking && sentSquad) ? sentSquad : squadCounts;
  const squadTotal      = Object.values(displayCounts).reduce((s, v) => s + v, 0);
  const heroesInSquad   = myHeroUnits.filter(u => (displayCounts[u.type] ?? 0) > 0);
  const soldiersInSquad = Object.entries(displayCounts).filter(([t, v]) => !HERO_TYPES.has(t) && v > 0).reduce((s, [, v]) => s + v, 0);

  const commanderType = heroesInSquad.length > 0
    ? heroesInSquad.reduce((best, u) => (HERO_POWER[u.type] ?? 0) > (HERO_POWER[best.type] ?? 0) ? u : best).type
    : undefined;

  const squadPower = useMemo(() => {
    if (squadTotal === 0) return myUnits.reduce((s, u) => s + (UNIT_ATK[u.type] ?? 0) * u.count, 0);
    return Object.entries(displayCounts).reduce((s, [type, cnt]) => s + (UNIT_ATK[type] ?? 0) * cnt, 0);
  }, [displayCounts, myUnits, squadTotal]);

  // Auto-resolve hero: if no hero in squad but we have one, pick strongest
  const effectiveCommander = commanderType
    ?? (myHeroUnits.length > 0 ? myHeroUnits.reduce((best, u) => (HERO_POWER[u.type] ?? 0) > (HERO_POWER[best.type] ?? 0) ? u : best).type : undefined);
  const heroRequired = false; // hero is always auto-selected
  // Knight hero requires at least 10 soldiers; all other heroes can attack solo
  const soldierOk    = effectiveCommander === 'knight' ? soldiersInSquad >= 10 : true;

  useEffect(() => {
    if (myUnits.length > 0) {
      const defaults: Record<string, number> = {};
      myUnits.forEach(u => { defaults[u.type] = u.count; });
      setSquadCounts(defaults);
    }
  }, [myUnits.length]);

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.get(`/combat/profile/${kingdomId}`)
      .then((p: KingdomProfile) => { if (alive) setProfile(p); })
      .catch(() => { if (alive) setError(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [kingdomId]);

  useEffect(() => {
    if (sheetRef.current) sheetRef.current.scrollTop = 0;
  }, []);

  if (loading) return (
    <div style={S.backdrop} onClick={onClose}>
      <div style={{ ...S.sheet, display:'flex', alignItems:'center', justifyContent:'center', minHeight:120, color:'#a0845a', fontSize:15 }}>
        🔍 {t('loading_intel')}
      </div>
    </div>
  );
  if (error || !profile) return (
    <div style={S.backdrop} onClick={onClose}>
      <div style={{ ...S.sheet, display:'flex', alignItems:'center', justifyContent:'center', minHeight:120, color:'#e74c3c', fontSize:15 }}>
        ❌ {t('failed_load_kingdom')}
      </div>
    </div>
  );

  const defScore       = Number(profile.score) || 0;
  const toWeakToAttack = false;
  const noFreeHero = !hasAnyHero;
  const canAttack  = hasAnyHero && !profile.isShielded && soldierOk && !attacking;

  const winPct  = profile.defPower > 0
    ? Math.round(Math.min(95, Math.max(5, (squadPower / (squadPower + profile.defPower)) * 100)))
    : squadPower > 0 ? 90 : 10;
  const wcColor = winPct >= 60 ? '#27ae60' : winPct >= 40 ? '#f39c12' : '#e74c3c';
  const wcBar   = winPct >= 60
    ? 'linear-gradient(90deg,#1a5c2a,#27ae60)'
    : winPct >= 40 ? 'linear-gradient(90deg,#7a4800,#f39c12)'
    : 'linear-gradient(90deg,#6a1010,#e74c3c)';

  const handleAttack = () => {
    if (!canAttack) return;
    const sq = squadTotal > 0 ? { ...squadCounts } : undefined;
    if (sq && effectiveCommander) {
      const heroUnit = myHeroUnits.find(u => u.type === effectiveCommander);
      if (heroUnit && (sq[effectiveCommander] ?? 0) === 0) sq[effectiveCommander] = heroUnit.count;
    }
    // Fallback: if no specific squad chosen, use all units
    const effectiveSquad = sq ?? Object.fromEntries(myUnits.filter(u=>u.count>0).map(u=>[u.type,u.count]));
    setPendingSquad({ heroType: effectiveCommander, squad: effectiveSquad });
    setShowBattleChoice(true);
  };

  const allUnitRows = [
    ...myHeroUnits.map(u => ({ ...u, isHero: true })),
    ...mySoldierUnits.map(u => ({ ...u, isHero: false })),
  ];

  /* ── Battle screen — march starts only when user clicks "סיים" ── */
  if (showBattleScreen && profile && pendingSquad?.squad) {
    return (
      <BattleScreen
        profile={profile}
        squad={pendingSquad.squad}
        heroType={pendingSquad.heroType}
        winPct={winPct}
        marchSeconds={profile.marchSeconds || 30}
        magicInit={myMagic}
        onClose={() => { setShowBattleScreen(false); onClose(); }}
        onFinish={(magicUsed) => {
          if (magicUsed > 0) {
            api.post('/kingdom/use-magic', { amount: magicUsed }).then(() => refresh()).catch(() => {});
          }
          // marchSeconds=0 → immediate attack, no countdown delay
          onAttack({ ...profile, marchSeconds: 0 }, pendingSquad!);
        }}
      />
    );
  }

  return (
    <div style={S.backdrop} onClick={onClose}>
      <div ref={sheetRef} style={S.sheet} onClick={e => e.stopPropagation()}>

      {/* ── Battle mode choice ── */}
      {showBattleChoice && profile && pendingSquad && (
        <div style={{
          position:'fixed', inset:0, zIndex:200,
          background:'rgba(0,0,0,0.88)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }} onClick={() => setShowBattleChoice(false)}>
          <div style={{
            background:'#0c0714', border:'1px solid rgba(255,255,255,0.12)',
            borderRadius:20, padding:'28px 24px', maxWidth:300, width:'90%',
            textAlign:'center',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:28, marginBottom:8 }}>⚔️</div>
            <div style={{ fontSize:17, fontWeight:800, color:'#fff', marginBottom:6 }}>
              בחר אופן קרב
            </div>
            <div style={{ fontSize:12, color:'#666', marginBottom:20 }}>
              תוקף את {profile.name}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <button
                onClick={() => {
                  setShowBattleChoice(false);
                  setShowBattleScreen(true);
                  // march starts only when user clicks "סיים" inside battle screen
                }}
                style={{
                  background:'linear-gradient(135deg,#7b0000,#c0392b,#e74c3c)',
                  border:'none', borderRadius:12, padding:'14px',
                  color:'#fff', fontSize:15, fontWeight:800, cursor:'pointer',
                  boxShadow:'0 4px 18px rgba(192,57,43,0.45)',
                }}
              >
                ⚔️ כנס להילחם
              </button>
              <button
                onClick={() => {
                  setShowBattleChoice(false);
                  onAttack(profile, pendingSquad);
                }}
                style={{
                  background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)',
                  borderRadius:12, padding:'12px',
                  color:'#aaa', fontSize:14, fontWeight:600, cursor:'pointer',
                }}
              >
                ➡️ המשך אוטומטי
              </button>
            </div>
          </div>
        </div>
      )}

        {/* ── Header ── */}
        <div style={{ padding:'14px 16px 12px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ flex:1, paddingRight:10 }}>
            <div style={{ fontSize:16, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', gap:8 }}>
              🏰 {profile.name}
              <button
                onClick={() => setShowKingdom(true)}
                style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, padding:'2px 7px', cursor:'pointer', fontSize:15, color:'#a0c4ff', lineHeight:1 }}
              >👁️</button>
            </div>
            <div style={{ fontSize:11, color:'#666', marginTop:2 }}>@{profile.username||'?'} · 🏆{fmt(profile.score)} · 🗡️{fmt(profile.armySize)}</div>
          </div>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        {/* ── Kingdom map view ── */}
        {showKingdom && (
          <KingdomMapView
            buildings={profile.buildings}
            name={profile.name}
            onClose={() => setShowKingdom(false)}
          />
        )}

        {/* ── Shield banner ── */}
        {profile.isShielded && (
          <div style={{ margin:'8px 14px 0', background:'rgba(52,152,219,0.12)', border:'1px solid rgba(52,152,219,0.35)', borderRadius:10, padding:'8px 14px', color:'#5dade2', fontSize:13, textAlign:'center', fontWeight:700 }}>
            🛡️ {t('kingdom_protected')} — <Countdown endsAt={profile.shieldUntil} />
          </div>
        )}

        {/* ── Win% + Loot ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, padding:'10px 14px 0' }}>
          {/* Win% card */}
          <div style={S.card}>
            <div style={{ fontSize:28, fontWeight:800, color:wcColor, textAlign:'center', lineHeight:1 }}>{winPct}%</div>
            <div style={{ fontSize:10, color:'#555', textAlign:'center', marginTop:4 }}>{t('win_chance_label')}</div>
            <div style={{ height:6, background:'rgba(255,255,255,0.08)', borderRadius:3, margin:'8px 0', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${winPct}%`, background:wcBar, borderRadius:3, transition:'width 0.35s' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#666' }}>
              <span style={{ color:'#aaa', fontWeight:600 }}>⚔️ {fmt(squadPower)}</span>
              <span style={{ color:'#aaa', fontWeight:600 }}>🛡️ {fmt(profile.defPower)}</span>
            </div>
            <div style={{ fontSize:9, color:'#3d3d3d', textAlign:'center', marginTop:4 }}>{t('win_chance_squad_hint')}</div>
          </div>

          {/* Loot card */}
          <div style={S.card}>
            <div style={{ fontSize:10, color:'#a0845a', fontWeight:700, marginBottom:6, textAlign:'center' }}>{t('loot_card_title')}</div>
            {[
              { type:'gold',  label:t('gold'),         val:profile.lootable.gold,         color:'#f4d03f' },
              { type:'wood',  label:t('wood'),         val:profile.lootable.wood,         color:'#c0832a' },
              { type:'stone', label:t('stone'),        val:profile.lootable.stone,        color:'#bdc3c7' },
              { type:'gem',   label:t('gems_attack'),  val:profile.lootable.gems ?? 0,    color:'#a29bfe' },
            ].map(({ type, label, val, color }) => (
              <div key={type} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:11, marginBottom:3 }}>
                <span style={{ color:'#666', display:'flex', alignItems:'center', gap:4 }}><ResIcon type={type} /> {label}</span>
                <span style={{ fontWeight:700, color }}>{fmt(val)}</span>
              </div>
            ))}
            {isVip && (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:11, marginBottom:3 }}>
                <span style={{ color:'#666', display:'flex', alignItems:'center', gap:4 }}><ResIcon type="dollar" /> USDT</span>
                <span style={{ fontWeight:700, color:'#2ecc71' }}>${((profile.usdtBalance??0)*0.02).toFixed(2)}</span>
              </div>
            )}
            <div style={{ fontSize:9, color:'#3d3d3d', marginTop:4, textAlign:'center' }}>{t('loot_full_transfer')}</div>
          </div>
        </div>

        {/* ── Too weak ── */}
        {toWeakToAttack && (
          <div style={{ margin:'8px 14px 0', background:'rgba(230,126,34,0.1)', border:'1px solid rgba(230,126,34,0.3)', borderRadius:10, padding:'10px', textAlign:'center', color:'#e67e22', fontSize:13, fontWeight:700 }}>
            ⛔ {t('too_weak_to_attack')}
            <div style={{ fontSize:10, color:'#a0845a', marginTop:3, fontWeight:400 }}>{t('too_weak_attack_note')}</div>
          </div>
        )}

        {/* ── No hero warning — only when player truly has no heroes at all ── */}
        {!profile.isShielded && !toWeakToAttack && !hasAnyHero && !anyMarching && (
          <div style={{ margin:'8px 14px 0', background:'rgba(133,193,233,0.08)', border:'1px solid rgba(133,193,233,0.25)', borderRadius:10, padding:'10px 14px', color:'#85c1e9', fontSize:12, textAlign:'center' }}>
            <div style={{ fontWeight:700, marginBottom:3 }}>🗡️ {t('no_hero_title')}</div>
            <div style={{ fontSize:10, color:'#555', lineHeight:1.5 }}>
              {t('no_hero_desc1')}<br/>
              <strong style={{ color:'#85c1e9' }}>{t('no_hero_desc2')}</strong>
            </div>
          </div>
        )}

        {/* ── Squad ── */}
        {!profile.isShielded && !toWeakToAttack && allUnitRows.length > 0 && (
          <div style={{ margin:'10px 14px 0', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'10px 12px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#ccc' }}>{t('squad_label')}</div>
              {commanderType && (
                <div style={{ fontSize:10, color:'#f4d03f', background:'rgba(244,208,63,0.1)', borderRadius:20, padding:'2px 8px', border:'1px solid rgba(244,208,63,0.2)' }}>
                  {t('commander_label', { name: t(UNIT_META[commanderType]?.nameKey as any) })}
                </div>
              )}
            </div>
            <div style={{ fontSize:9, color:'#3d3d3d', marginBottom:8 }}>{t('slider_hint')}</div>

            {/* Hero rows */}
            {myHeroUnits.length > 0 && (
              <div style={{ fontSize:9, color:'#f4d03f', fontWeight:600, marginBottom:5, opacity:0.8 }}>
                {t('heroes_badge')} — {heroRequired ? <span style={{ color:'#e74c3c' }}>{t('heroes_must_send_one')}</span> : t('heroes_send_one')}
              </div>
            )}

            {allUnitRows.map((u, i) => {
              const meta       = UNIT_META[u.type] ?? { icon:'🪖', nameKey:u.type };
              const val        = displayCounts[u.type] ?? 0;
              // When marching, store already deducted the squad — restore original total for display
              const totalCount = (attacking && sentSquad) ? val + u.count : u.count;
              const isHeroRow  = u.isHero;
              const isCommander = u.type === commanderType;
              const fillColor  = isHeroRow ? (meta.heroColor ?? '#f4d03f') : '#e74c3c';
              const noGems     = isHeroRow && !heroCanFight(u.type);
              const showSoldierSep = !isHeroRow && i > 0 && allUnitRows[i-1]?.isHero;

              return (
                <div key={u.type}>
                  {showSoldierSep && (
                    <div style={{ margin:'6px 0 4px' }}>
                      <div style={{ height:1, background:'rgba(255,255,255,0.05)' }} />
                      <div style={{ fontSize:9, color:'#3d3d3d', marginTop:4 }}>{t('soldiers_optional')}</div>
                    </div>
                  )}
                  <div style={{ display:'flex', alignItems:'center', gap:8, height:26, marginBottom:2 }}>
                    <span style={{ fontSize:14, width:18, textAlign:'center', flexShrink:0, position:'relative' }}>
                      {meta.icon}
                      {isCommander && <span style={{ position:'absolute', top:-5, right:-5, fontSize:8 }}>👑</span>}
                    </span>
                    <div style={{ fontSize:11, width:72, flexShrink:0, color: noGems ? '#666' : isHeroRow ? (meta.heroColor ?? '#f4d03f') : '#999', fontWeight: isHeroRow ? 700 : 400, overflow:'hidden', whiteSpace:'nowrap' }}>
                      {t(meta.nameKey as any)}{noGems && <span style={{ fontSize:9, color:'#e74c3c', marginRight:3 }}> 💎✕</span>}
                    </div>
                    <div style={{ flex:1, height:4, background:'rgba(255,255,255,0.1)', borderRadius:2, overflow:'visible', position:'relative' }}>
                      <input
                        type="range" min={0} max={noGems ? 0 : totalCount} value={noGems ? 0 : val}
                        onChange={e => !noGems && setSquadCounts(prev => ({ ...prev, [u.type]: +e.target.value }))}
                        disabled={attacking || noGems}
                        style={{ position:'absolute', inset:0, width:'100%', opacity:0, cursor: attacking ? 'not-allowed' : 'pointer', height:20, top:-8, margin:0 }}
                      />
                      <div style={{ height:'100%', width:`${totalCount > 0 ? (val/totalCount)*100 : 0}%`, background:fillColor, borderRadius:2, transition:'width 0.1s' }} />
                    </div>
                    <div style={{ fontSize:10, width:36, textAlign:'left', flexShrink:0, color: val > 0 ? fillColor : '#444', fontWeight: val > 0 ? 700 : 400 }}>
                      {val}/{totalCount}
                    </div>
                  </div>
                </div>
              );
            })}

            {heroRequired && (
              <div style={{ fontSize:10, color:'#e74c3c', textAlign:'center', marginTop:6, background:'rgba(231,76,60,0.08)', borderRadius:6, padding:4 }}>
                {t('hero_required_warn')}
              </div>
            )}
            {!soldierOk && (
              <div style={{ fontSize:10, color:'#e74c3c', textAlign:'center', marginTop:4, background:'rgba(231,76,60,0.08)', borderRadius:6, padding:4 }}>
                {t('squad_min_warn', { n: soldiersInSquad })}
              </div>
            )}
          </div>
        )}

        {/* ── Attack button ── */}
        <div style={{ padding:'12px 14px 0' }}>
          <button
            disabled={!canAttack}
            onClick={handleAttack}
            style={{
              width:'100%', padding:'14px',
              background: canAttack
                ? 'linear-gradient(135deg,#7b0000,#c0392b,#e74c3c)'
                : heroRequired ? 'rgba(231,76,60,0.1)' : 'rgba(255,255,255,0.04)',
              border: canAttack
                ? 'none'
                : heroRequired ? '1px solid rgba(231,76,60,0.3)' : '1px solid rgba(255,255,255,0.07)',
              borderRadius:12,
              color: canAttack ? '#fff' : heroRequired ? '#e74c3c' : '#444',
              fontSize:15, fontWeight:800,
              cursor: canAttack ? 'pointer' : 'not-allowed',
              boxShadow: canAttack ? '0 4px 20px rgba(192,57,43,0.4)' : 'none',
              letterSpacing:0.3,
              transition:'all 0.2s',
            }}
          >
            {attacking && marchCountdown > 0 ? `⚔️ ${t('marching')} ${marchCountdown}s...`
              : attacking            ? t('attacking_label')
              : noFreeHero           ? t('all_heroes_out')
              : !soldierOk           ? t('squad_min_warn', { n: soldiersInSquad })
              : profile.isShielded   ? `🛡️ ${t('protected_btn')}`
              : toWeakToAttack       ? `⛔ ${t('too_weak_to_attack')}`
              : t('attack_btn_time', { n: profile.marchSeconds })}
          </button>
        </div>

      </div>
    </div>
  );
}

const S = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 50,
    background: 'rgba(0,0,0,0.88)',
  } as React.CSSProperties,
  sheet: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    background: '#0c0714',
    borderRadius: 0,
    border: 'none',
    paddingBottom: 24,
    animation: 'slideUp 0.25s cubic-bezier(0.34,1.4,0.64,1)',
    overflowY: 'auto',
    direction: 'rtl',
  } as React.CSSProperties,
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: '10px 12px',
  } as React.CSSProperties,
  closeBtn: {
    width: 28, height: 28, borderRadius: 8,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, cursor: 'pointer', flexShrink: 0,
  } as React.CSSProperties,
};
