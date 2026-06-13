"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = KingdomProfileSheet;
const react_1 = require("react");
const client_1 = require("../api/client");
const format_1 = require("../utils/format");
const useT_1 = require("../i18n/useT");
const Countdown_1 = require("./Countdown");
const gameStore_1 = require("../store/gameStore");
const HERO_TYPES = new Set(['knight', 'paladin', 'dragon_rider', 'ragnar', 'titan', 'giant']);
const HERO_POWER = { giant: 300, titan: 150, dragon_rider: 100, ragnar: 90, paladin: 80, knight: 40 };
const UNIT_ATK = {
    spearman: 1, archer: 2, swordsman: 3, cavalry: 5, catapult: 10, elite_guard: 8,
    knight: 40, paladin: 80, dragon_rider: 100, ragnar: 90, titan: 150, giant: 300,
};
const HERO_SALARY = { giant: 10, titan: 0, dragon_rider: 5, paladin: 3, ragnar: 2, knight: 1 };
const UNIT_META = {
    knight: { icon: '🗡️', nameKey: 'u_knight', heroColor: '#85c1e9' },
    paladin: { icon: '⚔️', nameKey: 'u_paladin', heroColor: '#f4d03f' },
    dragon_rider: { icon: '🐉', nameKey: 'u_dragon_rider', heroColor: '#e74c3c' },
    ragnar: { icon: '🪓', nameKey: 'u_ragnar', heroColor: '#e67e22' },
    titan: { icon: '🗿', nameKey: 'u_titan', heroColor: '#9b59b6' },
    giant: { icon: '👹', nameKey: 'u_giant', heroColor: '#8e44ad' },
    spearman: { icon: '🏹', nameKey: 'u_spearman' },
    archer: { icon: '🏹', nameKey: 'u_archer' },
    swordsman: { icon: '🗡️', nameKey: 'u_swordsman' },
    cavalry: { icon: '🐴', nameKey: 'u_cavalry' },
    catapult: { icon: '🪨', nameKey: 'u_catapult' },
    elite_guard: { icon: '🛡️', nameKey: 'u_elite_guard' },
};
function KingdomProfileSheet({ kingdomId, onClose, onAttack, attacking, marchCountdown = 0, sentSquad }) {
    const [profile, setProfile] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(false);
    const [squadCounts, setSquadCounts] = (0, react_1.useState)({});
    const t = (0, useT_1.useT)();
    const myScore = (0, gameStore_1.useGameStore)(s => s.kingdom?.score ?? 0);
    const isVip = (0, gameStore_1.useGameStore)(s => !!s.kingdom?.isVip);
    const myUnits = (0, gameStore_1.useGameStore)(s => s.units ?? []);
    const myGems = (0, gameStore_1.useGameStore)(s => s.kingdom?.gems ?? 0);
    const anyMarching = (0, gameStore_1.useGameStore)(s => Object.keys(s.marchingSquads).length > 0);
    const heroCanFight = (type) => {
        const salary = HERO_SALARY[type] ?? 0;
        return salary === 0 || myGems >= salary;
    };
    const sentTypes = (attacking && sentSquad) ? Object.keys(sentSquad).filter(k => (sentSquad[k] ?? 0) > 0) : [];
    const myHeroUnits = myUnits.filter(u => HERO_TYPES.has(u.type) && (u.count > 0 || sentTypes.includes(u.type)));
    const mySoldierUnits = myUnits.filter(u => !HERO_TYPES.has(u.type) && (u.count > 0 || sentTypes.includes(u.type)));
    const hasAnyHero = myUnits.some(u => HERO_TYPES.has(u.type) && u.count > 0 && heroCanFight(u.type));
    const totalHeroCount = myUnits.filter(u => HERO_TYPES.has(u.type)).reduce((s, u) => s + u.count, 0);
    const displayCounts = (attacking && sentSquad) ? sentSquad : squadCounts;
    const squadTotal = Object.values(displayCounts).reduce((s, v) => s + v, 0);
    const heroesInSquad = myHeroUnits.filter(u => (displayCounts[u.type] ?? 0) > 0);
    const soldiersInSquad = Object.entries(displayCounts).filter(([t, v]) => !HERO_TYPES.has(t) && v > 0).reduce((s, [, v]) => s + v, 0);
    const commanderType = heroesInSquad.length > 0
        ? heroesInSquad.reduce((best, u) => (HERO_POWER[u.type] ?? 0) > (HERO_POWER[best.type] ?? 0) ? u : best).type
        : undefined;
    const squadPower = (0, react_1.useMemo)(() => {
        if (squadTotal === 0)
            return myUnits.reduce((s, u) => s + (UNIT_ATK[u.type] ?? 0) * u.count, 0);
        return Object.entries(displayCounts).reduce((s, [type, cnt]) => s + (UNIT_ATK[type] ?? 0) * cnt, 0);
    }, [displayCounts, myUnits, squadTotal]);
    const effectiveCommander = commanderType
        ?? (myHeroUnits.length > 0 ? myHeroUnits.reduce((best, u) => (HERO_POWER[u.type] ?? 0) > (HERO_POWER[best.type] ?? 0) ? u : best).type : undefined);
    const heroRequired = false;
    const soldierOk = effectiveCommander === 'knight' ? soldiersInSquad >= 10 : true;
    (0, react_1.useEffect)(() => {
        if (myUnits.length > 0) {
            const defaults = {};
            myUnits.forEach(u => { defaults[u.type] = u.count; });
            setSquadCounts(defaults);
        }
    }, [myUnits.length]);
    (0, react_1.useEffect)(() => {
        let alive = true;
        setLoading(true);
        client_1.api.get(`/combat/profile/${kingdomId}`)
            .then((p) => { if (alive)
            setProfile(p); })
            .catch(() => { if (alive)
            setError(true); })
            .finally(() => { if (alive)
            setLoading(false); });
        return () => { alive = false; };
    }, [kingdomId]);
    if (loading)
        return (<div style={S.backdrop} onClick={onClose}>
      <div style={{ ...S.sheet, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120, color: '#a0845a', fontSize: 15 }}>
        🔍 {t('loading_intel')}
      </div>
    </div>);
    if (error || !profile)
        return (<div style={S.backdrop} onClick={onClose}>
      <div style={{ ...S.sheet, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120, color: '#e74c3c', fontSize: 15 }}>
        ❌ {t('failed_load_kingdom')}
      </div>
    </div>);
    const defScore = Number(profile.score) || 0;
    const toWeakToAttack = !import.meta.env.DEV && myScore >= 10 && defScore >= 10 && myScore > defScore * 10;
    const noFreeHero = !hasAnyHero;
    const canAttack = hasAnyHero && !profile.isShielded && !toWeakToAttack && soldierOk && !attacking;
    const winPct = profile.defPower > 0
        ? Math.round(Math.min(95, Math.max(5, (squadPower / (squadPower + profile.defPower)) * 100)))
        : squadPower > 0 ? 90 : 10;
    const wcColor = winPct >= 60 ? '#27ae60' : winPct >= 40 ? '#f39c12' : '#e74c3c';
    const wcBar = winPct >= 60
        ? 'linear-gradient(90deg,#1a5c2a,#27ae60)'
        : winPct >= 40 ? 'linear-gradient(90deg,#7a4800,#f39c12)'
            : 'linear-gradient(90deg,#6a1010,#e74c3c)';
    const handleAttack = () => {
        if (!canAttack)
            return;
        const squad = squadTotal > 0 ? { ...squadCounts } : undefined;
        if (squad && effectiveCommander) {
            const heroUnit = myHeroUnits.find(u => u.type === effectiveCommander);
            if (heroUnit && (squad[effectiveCommander] ?? 0) === 0)
                squad[effectiveCommander] = heroUnit.count;
        }
        onAttack(profile, { heroType: effectiveCommander, squad });
    };
    const allUnitRows = [
        ...myHeroUnits.map(u => ({ ...u, isHero: true })),
        ...mySoldierUnits.map(u => ({ ...u, isHero: false })),
    ];
    return (<div style={S.backdrop} onClick={onClose}>
      <div style={S.sheet} onClick={e => e.stopPropagation()}>

        
        <div style={{ padding: '14px 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ flex: 1, paddingRight: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>🏰 {profile.name}</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>@{profile.username || '?'} · 🏆{(0, format_1.fmt)(profile.score)} · 🗡️{(0, format_1.fmt)(profile.armySize)}</div>
          </div>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        
        {profile.isShielded && (<div style={{ margin: '8px 14px 0', background: 'rgba(52,152,219,0.12)', border: '1px solid rgba(52,152,219,0.35)', borderRadius: 10, padding: '8px 14px', color: '#5dade2', fontSize: 13, textAlign: 'center', fontWeight: 700 }}>
            🛡️ {t('kingdom_protected')} — <Countdown_1.default endsAt={profile.shieldUntil}/>
          </div>)}

        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '10px 14px 0' }}>
          
          <div style={S.card}>
            <div style={{ fontSize: 28, fontWeight: 800, color: wcColor, textAlign: 'center', lineHeight: 1 }}>{winPct}%</div>
            <div style={{ fontSize: 10, color: '#555', textAlign: 'center', marginTop: 4 }}>{t('win_chance_label')}</div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, margin: '8px 0', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${winPct}%`, background: wcBar, borderRadius: 3, transition: 'width 0.35s' }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#666' }}>
              <span style={{ color: '#aaa', fontWeight: 600 }}>⚔️ {(0, format_1.fmt)(squadPower)}</span>
              <span style={{ color: '#aaa', fontWeight: 600 }}>🛡️ {(0, format_1.fmt)(profile.defPower)}</span>
            </div>
            <div style={{ fontSize: 9, color: '#3d3d3d', textAlign: 'center', marginTop: 4 }}>{t('win_chance_squad_hint')}</div>
          </div>

          
          <div style={S.card}>
            <div style={{ fontSize: 10, color: '#a0845a', fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>{t('loot_card_title')}</div>
            {[
            { icon: '💰', label: t('gold'), val: profile.lootable.gold, color: '#f4d03f' },
            { icon: '🪵', label: t('wood'), val: profile.lootable.wood, color: '#c0832a' },
            { icon: '🪨', label: t('stone'), val: profile.lootable.stone, color: '#bdc3c7' },
            { icon: '💎', label: t('gems_attack'), val: profile.lootable.gems ?? 0, color: '#a29bfe' },
        ].map(({ icon, label, val, color }) => (<div key={icon} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, marginBottom: 3 }}>
                <span style={{ color: '#666' }}>{icon} {label}</span>
                <span style={{ fontWeight: 700, color }}>{(0, format_1.fmt)(val)}</span>
              </div>))}
            {isVip && (<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, marginBottom: 3 }}>
                <span style={{ color: '#666' }}>💵 USDT</span>
                <span style={{ fontWeight: 700, color: '#2ecc71' }}>${((profile.usdtBalance ?? 0) * 0.20).toFixed(2)}</span>
              </div>)}
            <div style={{ fontSize: 9, color: '#3d3d3d', marginTop: 4, textAlign: 'center' }}>{t('loot_full_transfer')}</div>
          </div>
        </div>

        
        {toWeakToAttack && (<div style={{ margin: '8px 14px 0', background: 'rgba(230,126,34,0.1)', border: '1px solid rgba(230,126,34,0.3)', borderRadius: 10, padding: '10px', textAlign: 'center', color: '#e67e22', fontSize: 13, fontWeight: 700 }}>
            ⛔ {t('too_weak_to_attack')}
            <div style={{ fontSize: 10, color: '#a0845a', marginTop: 3, fontWeight: 400 }}>{t('too_weak_attack_note')}</div>
          </div>)}

        
        {!profile.isShielded && !toWeakToAttack && !hasAnyHero && !anyMarching && (<div style={{ margin: '8px 14px 0', background: 'rgba(133,193,233,0.08)', border: '1px solid rgba(133,193,233,0.25)', borderRadius: 10, padding: '10px 14px', color: '#85c1e9', fontSize: 12, textAlign: 'center' }}>
            <div style={{ fontWeight: 700, marginBottom: 3 }}>🗡️ {t('no_hero_title')}</div>
            <div style={{ fontSize: 10, color: '#555', lineHeight: 1.5 }}>
              {t('no_hero_desc1')}<br />
              <strong style={{ color: '#85c1e9' }}>{t('no_hero_desc2')}</strong>
            </div>
          </div>)}

        
        {!profile.isShielded && !toWeakToAttack && allUnitRows.length > 0 && (<div style={{ margin: '10px 14px 0', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#ccc' }}>{t('squad_label')}</div>
              {commanderType && (<div style={{ fontSize: 10, color: '#f4d03f', background: 'rgba(244,208,63,0.1)', borderRadius: 20, padding: '2px 8px', border: '1px solid rgba(244,208,63,0.2)' }}>
                  {t('commander_label', { name: t(UNIT_META[commanderType]?.nameKey) })}
                </div>)}
            </div>
            <div style={{ fontSize: 9, color: '#3d3d3d', marginBottom: 8 }}>{t('slider_hint')}</div>

            
            {myHeroUnits.length > 0 && (<div style={{ fontSize: 9, color: '#f4d03f', fontWeight: 600, marginBottom: 5, opacity: 0.8 }}>
                {t('heroes_badge')} — {heroRequired ? <span style={{ color: '#e74c3c' }}>{t('heroes_must_send_one')}</span> : t('heroes_send_one')}
              </div>)}

            {allUnitRows.map((u, i) => {
                const meta = UNIT_META[u.type] ?? { icon: '🪖', nameKey: u.type };
                const val = displayCounts[u.type] ?? 0;
                const totalCount = (attacking && sentSquad) ? val + u.count : u.count;
                const isHeroRow = u.isHero;
                const isCommander = u.type === commanderType;
                const fillColor = isHeroRow ? (meta.heroColor ?? '#f4d03f') : '#e74c3c';
                const noGems = isHeroRow && !heroCanFight(u.type);
                const showSoldierSep = !isHeroRow && i > 0 && allUnitRows[i - 1]?.isHero;
                return (<div key={u.type}>
                  {showSoldierSep && (<div style={{ margin: '6px 0 4px' }}>
                      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }}/>
                      <div style={{ fontSize: 9, color: '#3d3d3d', marginTop: 4 }}>{t('soldiers_optional')}</div>
                    </div>)}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 26, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0, position: 'relative' }}>
                      {meta.icon}
                      {isCommander && <span style={{ position: 'absolute', top: -5, right: -5, fontSize: 8 }}>👑</span>}
                    </span>
                    <div style={{ fontSize: 11, width: 72, flexShrink: 0, color: noGems ? '#666' : isHeroRow ? (meta.heroColor ?? '#f4d03f') : '#999', fontWeight: isHeroRow ? 700 : 400, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {t(meta.nameKey)}{noGems && <span style={{ fontSize: 9, color: '#e74c3c', marginRight: 3 }}> 💎✕</span>}
                    </div>
                    <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'visible', position: 'relative' }}>
                      <input type="range" min={0} max={noGems ? 0 : totalCount} value={noGems ? 0 : val} onChange={e => !noGems && setSquadCounts(prev => ({ ...prev, [u.type]: +e.target.value }))} disabled={attacking || noGems} style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: attacking ? 'not-allowed' : 'pointer', height: 20, top: -8, margin: 0 }}/>
                      <div style={{ height: '100%', width: `${totalCount > 0 ? (val / totalCount) * 100 : 0}%`, background: fillColor, borderRadius: 2, transition: 'width 0.1s' }}/>
                    </div>
                    <div style={{ fontSize: 10, width: 36, textAlign: 'left', flexShrink: 0, color: val > 0 ? fillColor : '#444', fontWeight: val > 0 ? 700 : 400 }}>
                      {val}/{totalCount}
                    </div>
                  </div>
                </div>);
            })}

            {heroRequired && (<div style={{ fontSize: 10, color: '#e74c3c', textAlign: 'center', marginTop: 6, background: 'rgba(231,76,60,0.08)', borderRadius: 6, padding: 4 }}>
                {t('hero_required_warn')}
              </div>)}
            {!soldierOk && (<div style={{ fontSize: 10, color: '#e74c3c', textAlign: 'center', marginTop: 4, background: 'rgba(231,76,60,0.08)', borderRadius: 6, padding: 4 }}>
                {t('squad_min_warn', { n: soldiersInSquad })}
              </div>)}
          </div>)}

        
        <div style={{ padding: '12px 14px 0' }}>
          <button disabled={!canAttack} onClick={handleAttack} style={{
            width: '100%', padding: '14px',
            background: canAttack
                ? 'linear-gradient(135deg,#7b0000,#c0392b,#e74c3c)'
                : heroRequired ? 'rgba(231,76,60,0.1)' : 'rgba(255,255,255,0.04)',
            border: canAttack
                ? 'none'
                : heroRequired ? '1px solid rgba(231,76,60,0.3)' : '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12,
            color: canAttack ? '#fff' : heroRequired ? '#e74c3c' : '#444',
            fontSize: 15, fontWeight: 800,
            cursor: canAttack ? 'pointer' : 'not-allowed',
            boxShadow: canAttack ? '0 4px 20px rgba(192,57,43,0.4)' : 'none',
            letterSpacing: 0.3,
            transition: 'all 0.2s',
        }}>
            {attacking && marchCountdown > 0 ? `⚔️ ${t('marching')} ${marchCountdown}s...`
            : attacking ? t('attacking_label')
                : noFreeHero ? t('all_heroes_out')
                    : !soldierOk ? t('squad_min_warn', { n: soldiersInSquad })
                        : profile.isShielded ? `🛡️ ${t('protected_btn')}`
                            : toWeakToAttack ? `⛔ ${t('too_weak_to_attack')}`
                                : t('attack_btn_time', { n: profile.marchSeconds })}
          </button>
        </div>

      </div>
    </div>);
}
const S = {
    backdrop: {
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'flex-end',
    },
    sheet: {
        width: '100%',
        background: '#0c0714',
        borderRadius: '20px 20px 0 0',
        border: '1px solid rgba(255,255,255,0.08)',
        borderBottom: 'none',
        paddingBottom: 24,
        animation: 'slideUp 0.25s cubic-bezier(0.34,1.4,0.64,1)',
        maxHeight: '90vh',
        overflowY: 'auto',
        direction: 'rtl',
    },
    card: {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: '10px 12px',
    },
    closeBtn: {
        width: 28, height: 28, borderRadius: 8,
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
        color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, cursor: 'pointer', flexShrink: 0,
    },
};
//# sourceMappingURL=KingdomProfileSheet.js.map