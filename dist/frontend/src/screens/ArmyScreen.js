"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ArmyScreen;
const react_1 = require("react");
const gameStore_1 = require("../store/gameStore");
const format_1 = require("../utils/format");
const Countdown_1 = require("../components/Countdown");
const client_1 = require("../api/client");
const useT_1 = require("../i18n/useT");
const REGULAR_UNITS = ['spearman', 'archer', 'swordsman', 'cavalry', 'catapult', 'elite_guard'];
const GOLD_HEROES = ['knight'];
const VIP_UNITS = ['paladin', 'dragon_rider'];
const SPECIAL_UNITS = ['titan', 'giant'];
const UNIT_CONFIG = {
    spearman: { icon: '🗡️', gold: 10, power: 1, def: 1, color: '#aaa', upkeep: 1 },
    archer: { icon: '🏹', gold: 20, power: 2, def: 1, color: '#7dbb3f', upkeep: 1 },
    swordsman: { icon: '⚔️', gold: 40, power: 4, def: 3, color: '#3498db', upkeep: 2 },
    cavalry: { icon: '🐴', gold: 80, power: 9, def: 5, color: '#9b59b6', upkeep: 3 },
    catapult: { icon: '💣', gold: 200, power: 15, def: 2, color: '#e67e22', upkeep: 5 },
    elite_guard: { icon: '🛡️', gold: 500, power: 25, def: 20, color: '#f4d03f', upkeep: 8 },
    knight: { icon: '🗡️', gold: 800, power: 40, def: 30, color: '#85c1e9', upkeep: 2, isHero: true, dailySalaryGems: 1 },
    paladin: { icon: '⚔️', gold: 0, gems: 100, power: 80, def: 60, color: '#f1c40f', vip: true, upkeep: 5, isHero: true, dailySalaryGems: 3, canSoloAttack: true },
    dragon_rider: { icon: '🐉', gold: 0, gems: 300, power: 250, def: 150, color: '#e74c3c', vip: true, upkeep: 15, isHero: true, dailySalaryGems: 5, canSoloAttack: true },
    ragnar: { icon: '🦸', gold: 0, gems: 200, power: 400, def: 300, color: '#e67e22', referralHero: true, upkeep: 20, isHero: true, dailySalaryGems: 2, canSoloAttack: true, gemsPerHour: 2 },
    titan: { icon: '🗿', gold: 0, usdtCost: 0.1, power: 800, def: 600, color: '#c0392b', usdtUnit: true, upkeep: 10, isHero: true, dailySalaryGems: 4, canSoloAttack: true },
    giant: { icon: '👹', gold: 0, usdtCost: 0.5, power: 2000, def: 1200, color: '#8e44ad', usdtUnit: true, upkeep: 50, isHero: true, dailySalaryGems: 10, canSoloAttack: true },
};
const RAGNAR_REQUIRED = 10;
function ArmyScreen() {
    const { units, kingdom, buildings, productionRates, refresh } = (0, gameStore_1.useGameStore)();
    const [amounts, setAmounts] = (0, react_1.useState)({});
    const [loading, setLoading] = (0, react_1.useState)(null);
    const [msg, setMsg] = (0, react_1.useState)('');
    const isVip = !!kingdom?.isVip;
    const [referral, setReferral] = (0, react_1.useState)(null);
    const [claiming, setClaiming] = (0, react_1.useState)(false);
    const t = (0, useT_1.useT)();
    (0, react_1.useEffect)(() => {
        client_1.api.get('/referral').then(setReferral).catch(() => { });
    }, []);
    const referredCount = referral?.referredCount ?? 0;
    const ragnarUnlocked = referredCount >= RAGNAR_REQUIRED;
    const ragnarMilestone = referral?.milestones?.find((m) => m.count === RAGNAR_REQUIRED);
    const ragnarClaimed = ragnarMilestone?.alreadyClaimed ?? false;
    async function claimRagnar() {
        setClaiming(true);
        try {
            await client_1.api.post(`/referral/claim/${RAGNAR_REQUIRED}`);
            setMsg(t('ragnar_added'));
            const updated = await client_1.api.get('/referral');
            setReferral(updated);
        }
        catch (e) {
            setMsg('❌ ' + (e.response?.data?.message || t('error')));
        }
        finally {
            setClaiming(false);
        }
    }
    const totalPower = units.reduce((s, u) => s + u.count * (UNIT_CONFIG[u.type]?.power || 0), 0);
    const totalFoodUpkeep = units.reduce((s, u) => s + u.count * (UNIT_CONFIG[u.type]?.upkeep || 0), 0);
    const foodProduction = productionRates.food || 0;
    const foodBalance = foodProduction - totalFoodUpkeep;
    const ragnarUnit = units.find(u => u.type === 'ragnar');
    const ragnarInArmy = ragnarUnit && ragnarUnit.count > 0;
    async function train(type) {
        const cfg = UNIT_CONFIG[type];
        const amount = amounts[type] || 1;
        setLoading(type);
        setMsg('');
        try {
            if (cfg?.usdtUnit) {
                const endpoint = type === 'giant' ? '/kingdom/buy-giant' : '/kingdom/buy-titan';
                for (let i = 0; i < amount; i++) {
                    await client_1.api.post(endpoint);
                }
                await refresh();
                window.dispatchEvent(new Event('usdt-balance-refresh'));
                setMsg(`⚔️ ${amount} ${t('u_' + type)} ${t('added_to_queue')}`);
            }
            else {
                await client_1.api.post('/units/train', { type, amount });
                await refresh();
                setMsg(t('recruiting', { n: amount, unit: t('u_' + type) }));
            }
        }
        catch (e) {
            const raw = e.response?.data?.message || '';
            const lvlMatch = raw.match(/Requires Barracks level (\d+)/);
            if (lvlMatch) {
                setMsg('❌ ' + t('barracks_level_req', { n: lvlMatch[1] }));
            }
            else if (raw === 'VIP_REQUIRED') {
                setMsg('❌ ' + t('vip_required_army'));
            }
            else if (raw === 'RAGNAR_NOT_UNLOCKED') {
                setMsg('❌ ' + t('ragnar_required', { n: RAGNAR_REQUIRED }));
            }
            else if (raw.includes('Not enough gems') || raw.includes('enough gems')) {
                setMsg('❌ ' + t('not_enough_gems'));
            }
            else if (raw.includes('Not enough gold') || raw.includes('enough gold')) {
                setMsg('❌ ' + t('not_enough_gold'));
            }
            else if (raw.includes('No Barracks') || raw.includes('no barracks')) {
                setMsg('❌ ' + t('need_barracks'));
            }
            else if (raw.includes('USDT') || raw.includes('usdt')) {
                setMsg('❌ ' + t('missing_usdt_balance'));
            }
            else {
                setMsg('❌ ' + (raw || t('error')));
            }
        }
        finally {
            setLoading(null);
        }
    }
    function UnitCard({ u }) {
        const cfg = UNIT_CONFIG[u.type];
        const isTraining = !!(u.trainingEndsAt && new Date() < new Date(u.trainingEndsAt));
        const isVipUnit = !!cfg?.vip;
        const isRagnar = !!cfg?.referralHero;
        const isUsdtUnit = !!cfg?.usdtUnit;
        const vipLocked = isVipUnit && !isVip;
        const qty = amounts[u.type] || 1;
        const usdtBal = kingdom?.usdtBalance ?? 0;
        const usdtCostTotal = isUsdtUnit ? parseFloat((qty * (cfg?.usdtCost || 0.1)).toFixed(4)) : 0;
        const cost = isUsdtUnit ? 0 : qty * ((isVipUnit || isRagnar) ? (cfg?.gems || 0) : (cfg?.gold || 0));
        const have = (isVipUnit || isRagnar) ? (kingdom?.gems || 0) : (kingdom?.gold || 0);
        const canAfford = isUsdtUnit ? usdtBal >= usdtCostTotal : (have >= cost && !vipLocked);
        return (<div style={{
                background: isRagnar
                    ? 'linear-gradient(135deg,rgba(180,80,10,0.25),rgba(120,50,5,0.2))'
                    : isVipUnit
                        ? 'linear-gradient(135deg,rgba(30,10,0,0.9),rgba(50,20,0,0.8))'
                        : 'linear-gradient(135deg,var(--bg-card),var(--bg-card2))',
                border: `1px solid ${vipLocked ? 'rgba(241,196,15,0.2)' : cfg?.color || '#f4d03f'}33`,
                borderRadius: 12, padding: 14,
                boxShadow: isTraining ? '0 0 10px rgba(52,152,219,0.2)' : isVipUnit ? '0 0 10px rgba(241,196,15,0.1)' : 'none',
            }} className={isTraining ? 'upgrading-building' : ''}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
                width: 44, height: 44, borderRadius: 11,
                background: `${cfg?.color || '#f4d03f'}18`,
                border: `1px solid ${cfg?.color || '#f4d03f'}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, boxShadow: isVipUnit ? `0 0 10px ${cfg?.color}44` : 'none',
            }}>
              {vipLocked ? '🔒' : cfg?.icon || '👤'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: vipLocked ? '#888' : cfg?.color || '#f4d03f' }}>
                {t('u_' + u.type)}
                {isVipUnit && <span style={{ fontSize: 10, marginLeft: 6, color: '#f1c40f', background: 'rgba(241,196,15,0.15)', borderRadius: 5, padding: '1px 5px' }}>👑 VIP</span>}
              </div>
              <div style={{ color: '#a0845a', fontSize: 11, display: 'flex', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                <span>⚔️ {cfg?.power}</span>
                <span>🛡️ {cfg?.def}</span>
                {(cfg?.upkeep ?? 0) > 0 && <span style={{ color: '#7dbb3f' }}>🌾 {t('upkeep_per_hr', { n: cfg.upkeep })}</span>}
                {isUsdtUnit ? <span style={{ color: '#27ae60', display: 'flex', alignItems: 'center', gap: 2 }}><img src="/assets/icon_dollar.png" style={{ width: 11, height: 11 }}/>${cfg?.usdtCost}{t('per_unit')}</span>
                : isVipUnit ? <span style={{ color: '#f1c40f', display: 'flex', alignItems: 'center', gap: 2 }}><img src="/assets/icon_gem.png" style={{ width: 11, height: 11 }}/>{cfg?.gems}{t('per_unit')}</span>
                    : <span>💰 {cfg?.gold}{t('per_unit')}</span>}
              </div>
              {cfg?.isHero && cfg.dailySalaryGems && (<div style={{ fontSize: 10, color: '#a78bfa', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <img src="/assets/icon_gem.png" style={{ width: 10, height: 10 }}/>
                  <span>{t('hero_salary', { n: cfg.dailySalaryGems })}</span>
                  {cfg.gemsPerHour && <><span style={{ color: '#c084fc' }}>·</span><img src="/assets/icon_gem.png" style={{ width: 10, height: 10 }}/><span style={{ color: '#c084fc' }}>{t('gems_per_hr', { n: cfg.gemsPerHour })}</span></>}
                  {cfg.canSoloAttack && <span style={{ color: '#f87171', marginLeft: 4 }}>· {t('titan_solo')}</span>}
                </div>)}
              {(u.woundedCount || 0) > 0 && (<div style={{ fontSize: 10, color: '#e74c3c', marginTop: 2 }}>{t('wounded', { n: (0, format_1.fmt)(u.woundedCount || 0) })}</div>)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: `${cfg?.color || '#f4d03f'}22`, border: `1px solid ${cfg?.color || '#f4d03f'}44`, borderRadius: 8, padding: '4px 12px', fontSize: 15, fontWeight: 800, color: cfg?.color || '#f4d03f' }}>
              {(0, format_1.fmt)(u.count)}
            </div>
            <div style={{ fontSize: 9, color: '#a0845a', marginTop: 2 }}>⚡ {(0, format_1.fmt)(u.count * (cfg?.power || 0))}</div>
          </div>
        </div>

        {isTraining && (<div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(52,152,219,0.1)', border: '1px solid rgba(52,152,219,0.3)', color: '#3498db', fontSize: 12, marginBottom: 6 }}>
            {t('training_progress', { n: (0, format_1.fmt)(u.trainingCount) })} <Countdown_1.default endsAt={u.trainingEndsAt}/>
          </div>)}

        {vipLocked ? (<div style={{ textAlign: 'center', padding: '10px', background: 'rgba(241,196,15,0.08)', borderRadius: 8, border: '1px solid rgba(241,196,15,0.2)', fontSize: 12, color: '#f1c40f' }}>
            {t('vip_required_army')}
          </div>) : (<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {[1, 10, 50].map(step => (<button key={`-${step}`} onClick={() => setAmounts(p => ({ ...p, [u.type]: Math.max(1, (p[u.type] || 1) - step) }))} style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(231,76,60,0.2)', border: '1px solid rgba(231,76,60,0.4)', color: '#e74c3c', fontSize: step === 1 ? 16 : 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {step === 1 ? '−' : `-${step}`}
                </button>))}
              <div style={{ flex: 1, textAlign: 'center', padding: '6px 4px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 16, fontWeight: 800, color: 'var(--text)', minWidth: 40 }}>
                {amounts[u.type] || 1}
              </div>
              {[50, 10, 1].map(step => (<button key={`+${step}`} onClick={() => setAmounts(p => ({ ...p, [u.type]: Math.min(9999, (p[u.type] || 1) + step) }))} style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(39,174,96,0.2)', border: '1px solid rgba(39,174,96,0.4)', color: '#27ae60', fontSize: step === 1 ? 16 : 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {step === 1 ? '+' : `+${step}`}
                </button>))}
            </div>

            <button className={isUsdtUnit ? 'btn' : 'btn btn-gold'} style={{ width: '100%', padding: '10px', fontSize: 14, opacity: canAfford ? 1 : 0.5, borderRadius: 10,
                    ...(isUsdtUnit ? { background: 'linear-gradient(135deg,#7b1515,#c0392b)', border: '1px solid #e74c3c', color: '#fff' } : {}) }} disabled={loading === u.type || !canAfford} onClick={() => train(u.type)}>
              {loading === u.type ? '...' : isTraining
                    ? t('add_to_queue', { n: amounts[u.type] || 1 })
                    : isUsdtUnit
                        ? <>{t('recruit')} {amounts[u.type] || 1} (<img src="/assets/icon_dollar.png" style={{ width: 12, height: 12, verticalAlign: 'middle' }}/>${usdtCostTotal})</>
                        : isVipUnit || isRagnar
                            ? <>{t('recruit')} {amounts[u.type] || 1} (<img src="/assets/icon_gem.png" style={{ width: 12, height: 12, verticalAlign: 'middle' }}/>{(0, format_1.fmt)(cost)})</>
                            : `${t('recruit')} ${amounts[u.type] || 1} (💰 ${(0, format_1.fmt)(cost)})`}
            </button>
            {!canAfford && (<div style={{ fontSize: 11, color: '#e74c3c', textAlign: 'center' }}>
                {isUsdtUnit
                        ? <><img src="/assets/icon_dollar.png" style={{ width: 11, height: 11, verticalAlign: 'middle' }}/> {t('missing_usdt_balance') || 'יתרת USDT לא מספיקה'} ({usdtBal.toFixed(4)}/${usdtCostTotal})</>
                        : isVipUnit || isRagnar ? t('missing_gems', { n: (0, format_1.fmt)(cost - (kingdom?.gems || 0)) }) : t('missing_gold', { n: (0, format_1.fmt)(cost - (kingdom?.gold || 0)) })}
              </div>)}
          </div>)}
      </div>);
    }
    const regularUnits = units.filter(u => REGULAR_UNITS.includes(u.type));
    const vipUnits = units.filter(u => VIP_UNITS.includes(u.type));
    if (!units || units.length === 0) {
        return (<div className="screen">
        <div className="screen-title">{t('army_title')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '60px 0', color: '#a0845a' }}>
          <div className="shimmer" style={{ width: 200, height: 8, borderRadius: 4 }}/>
          <div style={{ fontSize: 13 }}>{t('loading_units')}</div>
        </div>
      </div>);
    }
    return (<div className="screen">
      <div className="screen-title">{t('army_title')}</div>

      <div style={{ background: 'linear-gradient(135deg,rgba(231,76,60,0.15),rgba(192,57,43,0.1))', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 14, padding: '14px 20px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#a0845a', fontSize: 12 }}>{t('total_power')}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#e74c3c', textShadow: '0 0 10px rgba(231,76,60,0.4)' }}>⚔️ {(0, format_1.fmt)(totalPower)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#a0845a', fontSize: 12 }}>{t('soldiers')}</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{(0, format_1.fmt)(units.reduce((s, u) => s + u.count, 0))}</div>
        </div>
      </div>

      {units.some(u => u.trainingCount > 0) && (<div style={{ background: 'rgba(52,152,219,0.1)', border: '1px solid rgba(52,152,219,0.3)', borderRadius: 12, padding: '10px 14px', marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#3498db', marginBottom: 6 }}>{t('training_queue')}</div>
          {units.filter(u => u.trainingCount > 0).map(u => (<div key={u.type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a0845a', marginBottom: 3 }}>
              <span>{t('u_' + u.type)}: {(0, format_1.fmt)(u.trainingCount)} {t('soldiers').toLowerCase()}</span>
              <span style={{ color: '#3498db' }}>⏳ <Countdown_1.default endsAt={u.trainingEndsAt}/></span>
            </div>))}
        </div>)}

      {(() => {
            const totalWounded = units.reduce((s, u) => s + (u.woundedCount || 0), 0);
            if (totalWounded === 0)
                return null;
            const hospitalLevel = buildings.find(b => b.type === 'hospital')?.level ?? 0;
            const healRate = 5 + hospitalLevel * 10;
            const hoursLeft = totalWounded / healRate;
            const totalMins = Math.ceil(hoursLeft * 60);
            const hh = Math.floor(totalMins / 60);
            const mm = totalMins % 60;
            const timeStr = hh > 0 ? `${hh}h ${mm}m` : `${mm}m`;
            return (<div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 12, padding: '10px 14px', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#e74c3c', marginBottom: 6 }}>🏥 {t('b_hospital')}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a0845a' }}>
              <span>{t('hospital_wounded_total', { n: (0, format_1.fmt)(totalWounded) })}</span>
              <span style={{ color: '#f39c12' }}>{t('hospital_heal_time', { time: timeStr })}</span>
            </div>
            {units.filter(u => (u.woundedCount || 0) > 0).map(u => (<div key={u.type} style={{ fontSize: 10, color: '#e74c3c', marginTop: 3 }}>
                {t('u_' + u.type)}: {(0, format_1.fmt)(u.woundedCount)} 🩹
              </div>))}
          </div>);
        })()}

      <div style={{ background: foodBalance < 0 ? 'rgba(231,76,60,0.12)' : 'rgba(120,192,48,0.10)', border: `1px solid ${foodBalance < 0 ? 'rgba(231,76,60,0.35)' : 'rgba(120,192,48,0.3)'}`, borderRadius: 12, padding: '10px 16px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#a0845a', fontSize: 11 }}>{t('food_balance')}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: foodBalance < 0 ? '#e74c3c' : '#7dbb3f' }}>
            🌾 {foodBalance >= 0 ? '+' : ''}{(0, format_1.fmt)(foodBalance)}{t('per_hour')}
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, color: '#a0845a' }}>
          <div>{t('food_prod', { n: (0, format_1.fmt)(foodProduction) })}</div>
          <div>{t('food_consumed', { n: (0, format_1.fmt)(totalFoodUpkeep) })}</div>
          {foodBalance < 0 && <div style={{ color: '#e74c3c', fontWeight: 700, marginTop: 2 }}>{t('desert_warning')}</div>}
        </div>
      </div>

      {msg && (<div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 12, background: msg.startsWith('✅') ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)', border: `1px solid ${msg.startsWith('✅') ? '#27ae60' : '#e74c3c'}44`, color: msg.startsWith('✅') ? '#27ae60' : '#e74c3c', fontSize: 13, textAlign: 'center' }}>
          {msg}
        </div>)}

      <div style={{ fontSize: 13, fontWeight: 700, color: '#a0845a', marginBottom: 8 }}>{t('regular_soldiers')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {regularUnits.map(u => <UnitCard key={u.type} u={u}/>)}
      </div>

      
      {(() => {
            const goldHeroUnits = units.filter(u => GOLD_HEROES.includes(u.type));
            if (goldHeroUnits.length === 0)
                return null;
            return (<>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#85c1e9' }}>🗡️ {t('gold_heroes')}</div>
              <span style={{ fontSize: 10, color: '#85c1e9', background: 'rgba(133,193,233,0.12)', borderRadius: 8, padding: '2px 8px', fontWeight: 700 }}>💰 {t('gold')}</span>
            </div>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 10 }}>{t('gold_heroes_desc')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {goldHeroUnits.map(u => <UnitCard key={u.type} u={u}/>)}
            </div>
          </>);
        })()}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f1c40f' }}>{t('vip_heroes')}</div>
        {isVip
            ? <span style={{ fontSize: 10, color: '#27ae60', background: 'rgba(39,174,96,0.15)', borderRadius: 8, padding: '2px 8px', fontWeight: 700 }}>{t('vip_active_badge')}</span>
            : <span style={{ fontSize: 10, color: '#a0845a', background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '2px 8px' }}>{t('vip_req_badge')}</span>}
      </div>
      <div style={{ fontSize: 11, color: '#666', marginBottom: 10 }}>{t('vip_heroes_desc')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {vipUnits.map(u => <UnitCard key={u.type} u={u}/>)}
      </div>

      
      {(() => {
            const specialUnitsInArmy = units.filter(u => SPECIAL_UNITS.includes(u.type));
            if (specialUnitsInArmy.length === 0)
                return null;
            return (<>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#c0392b' }}>⚔️ {t('special_heroes') || 'גיבורים מיוחדים'}</div>
              <span style={{ fontSize: 10, color: '#27ae60', background: 'rgba(39,174,96,0.15)', borderRadius: 8, padding: '2px 8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><img src="/assets/icon_dollar.png" style={{ width: 11, height: 11 }}/> USDT</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {specialUnitsInArmy.map(u => <UnitCard key={u.type} u={u}/>)}
            </div>
          </>);
        })()}

      
      {ragnarInArmy && ragnarUnit && (<div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e67e22', marginBottom: 8 }}>🦸 {t('ragnar_name')} <span style={{ fontSize: 10, color: '#e67e22', background: 'rgba(230,126,34,0.15)', borderRadius: 5, padding: '1px 6px', marginRight: 6 }}>🔗 {t('referral_hero')}</span></div>
          <UnitCard key="ragnar" u={ragnarUnit}/>
        </div>)}

      
      <div style={{ fontSize: 13, fontWeight: 700, color: '#e67e22', marginBottom: 8 }}>{t('referral_hero')}</div>
      <div style={{
            background: ragnarUnlocked
                ? 'linear-gradient(135deg,rgba(230,126,34,0.2),rgba(180,80,10,0.15))'
                : 'linear-gradient(135deg,rgba(30,15,0,0.9),rgba(50,25,0,0.8))',
            border: `1px solid ${ragnarUnlocked ? 'rgba(230,126,34,0.5)' : 'rgba(230,126,34,0.15)'}`,
            borderRadius: 12, padding: 14,
            boxShadow: ragnarUnlocked ? '0 0 16px rgba(230,126,34,0.2)' : 'none',
        }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 54, height: 54, borderRadius: 13, flexShrink: 0,
            background: ragnarUnlocked
                ? 'linear-gradient(135deg,#e67e22,#a04010)'
                : 'linear-gradient(135deg,#3a2010,#201008)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
            border: `1px solid ${ragnarUnlocked ? 'rgba(230,126,34,0.6)' : 'rgba(230,126,34,0.2)'}`,
            boxShadow: ragnarUnlocked ? '0 0 14px rgba(230,126,34,0.4)' : 'none',
        }}>
            {ragnarUnlocked ? '🦸' : '🔒'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: ragnarUnlocked ? '#e67e22' : '#666' }}>
              {t('ragnar_name')}
              <span style={{ fontSize: 10, marginRight: 8, background: 'rgba(230,126,34,0.15)', color: '#e67e22', borderRadius: 5, padding: '1px 6px' }}>🔗 {t('referral_hero')}</span>
            </div>
            <div style={{ fontSize: 11, color: '#a0845a', marginTop: 3, display: 'flex', gap: 10 }}>
              <span>⚔️ 400</span>
              <span>🛡️ 300</span>
              <span>🌾 -20{t('per_hour')}</span>
            </div>
            <div style={{ fontSize: 10, color: '#a0845a', marginTop: 2 }}>
              {ragnarClaimed ? t('ragnar_claimed') : t('ragnar_required', { n: RAGNAR_REQUIRED })}
            </div>
          </div>
        </div>

        {!ragnarClaimed && (<>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a0845a', marginBottom: 4 }}>
              <span>{t('progress_label')}</span>
              <span style={{ color: ragnarUnlocked ? '#e67e22' : '#a0845a', fontWeight: 700 }}>
                {t('ragnar_progress', { current: referredCount, total: RAGNAR_REQUIRED })}
                {!ragnarUnlocked && ` — ${t('more_friends_needed', { n: RAGNAR_REQUIRED - referredCount })}`}
              </span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (referredCount / RAGNAR_REQUIRED) * 100)}%`, background: 'linear-gradient(90deg,#a04010,#e67e22)', borderRadius: 3, transition: 'width 0.5s' }}/>
            </div>

            {ragnarUnlocked ? (<button onClick={claimRagnar} disabled={claiming} style={{ width: '100%', padding: '11px', borderRadius: 10, background: 'linear-gradient(135deg,#e67e22,#a04010)', border: 'none', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                {claiming ? '...' : t('claim_ragnar')}
              </button>) : (<div style={{ textAlign: 'center', fontSize: 12, color: '#666', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                {t('invite_more_friends', { n: RAGNAR_REQUIRED - referredCount })}
              </div>)}
          </>)}


      </div>

    </div>);
}
function TitanPurchaseSection() {
    const { kingdom, refresh } = (0, gameStore_1.useGameStore)();
    const t = (0, useT_1.useT)();
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [msg, setMsg] = (0, react_1.useState)('');
    const [msgOk, setMsgOk] = (0, react_1.useState)(true);
    const bal = kingdom?.usdtBalance ?? 0;
    const COST = 0.1;
    const canAfford = bal >= COST;
    function show(text, ok = true) { setMsg(text); setMsgOk(ok); setTimeout(() => setMsg(''), 4000); }
    async function buy() {
        setLoading(true);
        try {
            const r = await client_1.api.post('/kingdom/buy-titan');
            await refresh();
            window.dispatchEvent(new Event('usdt-balance-refresh'));
            show(`⚔️ Titan הצטרף לצבאך! סה"כ: ${r.titanCount} Titans`);
        }
        catch (e) {
            show('❌ ' + (e.response?.data?.message || t('error')), false);
        }
        finally {
            setLoading(false);
        }
    }
    return (<div style={{ marginTop: 20, paddingBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#e74c3c', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid rgba(231,76,60,0.15)' }}>
        ⚔️ גיבור מיוחד — Titan
      </div>
      <div style={{ background: 'linear-gradient(135deg,rgba(231,76,60,0.1),rgba(120,30,20,0.05))', border: '1px solid rgba(231,76,60,0.25)', borderRadius: 14, padding: 14 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#7b1515,#c0392b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0 }}>⚔️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#e74c3c' }}>Titan</div>
            <div style={{ fontSize: 11, color: '#a0845a', marginTop: 2 }}>גיבור אגדי — הלוחם החזק ביותר</div>
            <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 12, fontWeight: 700 }}>
              <span style={{ color: '#e74c3c' }}>⚔️ 600</span>
              <span style={{ color: '#3498db' }}>🛡️ 450</span>
              <span style={{ color: '#a0845a' }}>🍞 20/שעה</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: '#a0845a' }}>
            עלות: <strong style={{ color: canAfford ? '#27ae60' : '#e74c3c' }}>0.1 USDT</strong>
            {' '}· יתרה: <strong style={{ color: '#27ae60' }}>${bal.toFixed(4)}</strong>
          </div>
          {!canAfford && <div style={{ fontSize: 10, color: '#e74c3c' }}>יתרה לא מספיקה</div>}
        </div>
        <div style={{ fontSize: 10, color: '#666', marginBottom: 10 }}>
          כל רכישה מוסיפה 1 Titan · ניתן לרכוש מספר פעמים · תשלום מיתרת USDT
        </div>
        {msg && <div style={{ fontSize: 12, color: msgOk ? '#27ae60' : '#e74c3c', marginBottom: 8, textAlign: 'center' }}>{msg}</div>}
        <button onClick={buy} disabled={loading || !canAfford} style={{ width: '100%', padding: '11px', borderRadius: 10, background: canAfford && !loading ? 'linear-gradient(135deg,#7b1515,#c0392b)' : 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.4)', color: canAfford ? '#fff' : '#666', fontWeight: 800, fontSize: 13, cursor: !canAfford || loading ? 'not-allowed' : 'pointer', opacity: !canAfford || loading ? 0.6 : 1 }}>
          {loading ? '⏳ מוסיף לתור אימון...' : `⚔️ רכוש Titan — 0.1 USDT (אימון 10 דק׳)`}
        </button>
      </div>
    </div>);
}
//# sourceMappingURL=ArmyScreen.js.map