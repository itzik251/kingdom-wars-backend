"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AttackScreen;
const react_1 = require("react");
const gameStore_1 = require("../store/gameStore");
const format_1 = require("../utils/format");
const client_1 = require("../api/client");
const KingdomProfileSheet_1 = require("../components/KingdomProfileSheet");
const useT_1 = require("../i18n/useT");
const KINGDOM_AVATARS = ['🏰', '🗺️', '⚔️', '🏯', '🛡️', '👑', '🌋', '🏔️', '🗡️', '⚡'];
function AttackScreen() {
    const { refresh, kingdom } = (0, gameStore_1.useGameStore)();
    const attackBoostActive = !!(kingdom?.attackSpeedBoostUntil &&
        new Date() < new Date(kingdom.attackSpeedBoostUntil));
    const [targets, setTargets] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [attacking, setAttacking] = (0, react_1.useState)(null);
    const [marchCountdown, setMarchCountdown] = (0, react_1.useState)(0);
    const [report, setReport] = (0, react_1.useState)(null);
    const [showBattle, setShowBattle] = (0, react_1.useState)(false);
    const [profileId, setProfileId] = (0, react_1.useState)(null);
    const [history, setHistory] = (0, react_1.useState)([]);
    const [showHistory, setShowHistory] = (0, react_1.useState)(false);
    const t = (0, useT_1.useT)();
    const cancelMarchRef = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(() => {
        loadTargets();
        loadHistory();
        cancelMarchRef.current = false;
        return () => { cancelMarchRef.current = true; };
    }, []);
    async function loadHistory() {
        try {
            setHistory(await client_1.api.get('/combat/history'));
        }
        catch (_) { }
    }
    async function loadTargets() {
        setLoading(true);
        try {
            const data = await client_1.api.get('/combat/targets');
            setTargets(data);
        }
        finally {
            setLoading(false);
        }
    }
    async function attack(profile) {
        if (attacking)
            return;
        setAttacking(profile.id);
        setReport(null);
        cancelMarchRef.current = false;
        try {
            const baseMarch = profile.marchSeconds || 5;
            const marchSecs = attackBoostActive ? Math.max(1, Math.ceil(baseMarch / 2)) : baseMarch;
            setMarchCountdown(marchSecs);
            await new Promise((res, rej) => {
                let remaining = marchSecs;
                const tick = setInterval(() => {
                    if (cancelMarchRef.current) {
                        clearInterval(tick);
                        rej(new Error('CANCELLED'));
                        return;
                    }
                    remaining -= 1;
                    setMarchCountdown(remaining);
                    if (remaining <= 0) {
                        clearInterval(tick);
                        res();
                    }
                }, 1000);
            });
            setMarchCountdown(0);
            const result = await client_1.api.post('/combat/attack', { defenderKingdomId: profile.id });
            setProfileId(null);
            setReport(result);
            setShowBattle(true);
            await refresh();
            setTargets(prev => prev.filter(t => t.id !== profile.id));
        }
        catch (e) {
            if (e?.message !== 'CANCELLED') {
                alert(e.response?.data?.message || t('error'));
            }
        }
        finally {
            setAttacking(null);
            setMarchCountdown(0);
        }
    }
    return (<div style={{ background: 'linear-gradient(180deg,#0a0a1a 0%,#0d1529 100%)', minHeight: '100vh', paddingBottom: 130 }}>

      {showHistory && (<div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#f4d03f' }}>{t('battle_history_title')}</div>
            <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', color: '#666', fontSize: 24, cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {history.length === 0 ? (<div style={{ textAlign: 'center', color: '#a0845a', paddingTop: 60 }}>{t('no_battles')}</div>) : history.map((h) => (<div key={h.id} style={{ background: h.won ? 'rgba(39,174,96,0.1)' : 'rgba(231,76,60,0.1)', border: `1px solid ${h.won ? 'rgba(39,174,96,0.3)' : 'rgba(231,76,60,0.3)'}`, borderRadius: 12, padding: '12px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: h.won ? '#27ae60' : '#e74c3c', fontSize: 14 }}>
                    {h.won ? `🏆 ${t('victory')}` : `💀 ${t('defeat')}`} · {h.isAttacker ? t('attacked_target', { name: h.defenderName }) : t('was_attacked', { name: h.attackerName })}
                  </span>
                  <span style={{ fontSize: 11, color: '#666' }}>{new Date(h.createdAt).toLocaleDateString()}</span>
                </div>
                {h.loot && (h.loot.gold > 0 || h.loot.wood > 0) && (<div style={{ fontSize: 12, color: '#a0845a' }}>
                    {h.isAttacker && h.won ? '🎁 ' : '💸 '}
                    💰{(0, format_1.fmt)(h.loot.gold)} 🪵{(0, format_1.fmt)(h.loot.wood)} 🪨{(0, format_1.fmt)(h.loot.stone)}
                  </div>)}
              </div>))}
          </div>
        </div>)}

      {showBattle && report && (<div style={{
                position: 'fixed', inset: 0, zIndex: 100,
                background: 'rgba(0,0,0,0.92)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 16, padding: 24,
            }}>
          <div style={{ fontSize: 64, animation: 'pulse 0.5s infinite', textAlign: 'center' }}>
            {report.attackerWins ? '🏆' : '💀'}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: report.attackerWins ? '#f4d03f' : '#e74c3c' }}>
            {report.attackerWins ? t('battle_win') : t('battle_loss')}
          </div>

          {report.attackerWins && (report.winStreak ?? 0) >= 2 && (<div style={{ background: 'rgba(244,208,63,0.15)', border: '1px solid #f4d03f', borderRadius: 20, padding: '5px 16px', color: '#f4d03f', fontWeight: 700, fontSize: 14, animation: 'pulse-glow 2s infinite' }}>
              {t('win_streak', { n: report.winStreak ?? 0 })}
              {(report.streakBonus ?? 0) > 0 && <span> · +{(0, format_1.fmt)(report.streakBonus)} 💰</span>}
            </div>)}

          <div style={{ display: 'flex', gap: 24, alignItems: 'center', fontSize: 15 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#f4d03f', fontWeight: 700, fontSize: 20 }}>⚔️ {report.attackerPower}</div>
              <div style={{ color: '#a0845a', fontSize: 12 }}>{t('your_power')}</div>
            </div>
            <div style={{ fontSize: 20, color: '#6b3a00' }}>VS</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#e74c3c', fontWeight: 700, fontSize: 20 }}>🛡️ {report.defenderPower}</div>
              <div style={{ color: '#a0845a', fontSize: 12 }}>{t('defender_power')}</div>
            </div>
          </div>

          {report.attackerWins && (<div style={{
                    background: 'rgba(244,208,63,0.1)', border: '1px solid rgba(244,208,63,0.3)',
                    borderRadius: 12, padding: '14px 28px', textAlign: 'center',
                }}>
              <div style={{ fontSize: 13, color: '#a0845a', marginBottom: 8 }}>{t('loot_label')}</div>
              <div style={{ display: 'flex', gap: 16, fontSize: 16, fontWeight: 700, flexWrap: 'wrap', justifyContent: 'center' }}>
                <span>💰 {(0, format_1.fmt)(report.loot.gold)}</span>
                <span>🪵 {(0, format_1.fmt)(report.loot.wood)}</span>
                <span>🪨 {(0, format_1.fmt)(report.loot.stone)}</span>
                {(report.loot.usdt ?? 0) > 0 && (<span style={{ color: '#27ae60' }}>💵 {report.loot.usdt.toFixed(4)} USDT</span>)}
              </div>
            </div>)}

          
          {report.attackerLosses && Object.values(report.attackerLosses).some(v => v > 0) && (<div style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: 12, padding: '10px 18px', textAlign: 'center', width: '100%', maxWidth: 360 }}>
              <div style={{ fontSize: 12, color: '#a0845a', marginBottom: 5 }}>⚔️ {t('your_losses')}</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', fontSize: 12 }}>
                {Object.entries(report.attackerLosses).filter(([, v]) => v > 0).map(([type, v]) => (<span key={type} style={{ color: '#e74c3c' }}>-{(0, format_1.fmt)(v)} {t('u_' + type)}</span>))}
              </div>
            </div>)}

          
          {report.defenderLosses && Object.values(report.defenderLosses).some(v => v > 0) && (<div style={{ background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.25)', borderRadius: 12, padding: '10px 18px', textAlign: 'center', width: '100%', maxWidth: 360 }}>
              <div style={{ fontSize: 12, color: '#a0845a', marginBottom: 5 }}>🛡️ {t('enemy_losses')}</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', fontSize: 12 }}>
                {Object.entries(report.defenderLosses).filter(([, v]) => v > 0).map(([type, v]) => (<span key={type} style={{ color: '#27ae60' }}>-{(0, format_1.fmt)(v)} {t('u_' + type)}</span>))}
              </div>
            </div>)}

          {report.buildingDamaged && (<div style={{ background: 'rgba(230,126,34,0.12)', border: '1px solid rgba(230,126,34,0.4)', borderRadius: 12, padding: '12px 20px', textAlign: 'center', color: '#e67e22', fontWeight: 700, fontSize: 14 }}>
              💥 {t('building_damaged', { name: t('b_' + report.buildingDamaged.type), n: report.buildingDamaged.newLevel })}
            </div>)}

          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-gold" style={{ padding: '12px 24px', fontSize: 15 }} onClick={() => { setReport(null); setShowBattle(false); loadTargets(); }}>
              {t('attack_again')}
            </button>
            {report.attackerWins && (<button className="btn btn-green" style={{ padding: '12px 20px', fontSize: 14 }} onClick={() => {
                    const tg = window.Telegram?.WebApp;
                    const loot = `💰${(0, format_1.fmt)(report.loot.gold)} 🪵${(0, format_1.fmt)(report.loot.wood)} 🪨${(0, format_1.fmt)(report.loot.stone)}`;
                    const text = `⚔️ I won a battle in Kingdom Wars!\n🏆 Loot: ${loot}\n💪 Power: ${report.attackerPower} vs ${report.defenderPower}\n\n🎮 Join me!`;
                    if (tg?.openTelegramLink) {
                        tg.openTelegramLink(`https://t.me/share/url?url=https://t.me/Kingdomw_bot&text=${encodeURIComponent(text)}`);
                    }
                }}>
                {t('battle_share')}
              </button>)}
            <button className="btn btn-ghost" style={{ padding: '12px 24px', fontSize: 15 }} onClick={() => { setReport(null); setShowBattle(false); }}>
              {t('back_home')}
            </button>
          </div>
        </div>)}

      {profileId && (<KingdomProfileSheet_1.default kingdomId={profileId} attacking={attacking === profileId} marchCountdown={marchCountdown} onClose={() => setProfileId(null)} onAttack={attack}/>)}

      <div style={{ padding: '16px', textAlign: 'center', background: 'rgba(0,0,0,0.4)' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#e74c3c' }}>{t('attack_title')}</div>
        <div style={{ fontSize: 12, color: '#a0845a', marginTop: 2 }}>{t('choose_kingdom')}</div>
      </div>

      {loading ? (<div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌍</div>
          <div style={{ color: '#a0845a' }}>{t('scanning')}</div>
        </div>) : targets.length === 0 ? (<div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🕊️</div>
          <div style={{ color: '#a0845a', fontSize: 15 }}>{t('no_targets')}</div>
          <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={loadTargets}>{t('search_again')}</button>
        </div>) : (<>
          <div style={{ padding: '12px 16px' }}>
            <div style={{
                background: 'radial-gradient(ellipse at center, #1a2a4a 0%, #0a0f1a 100%)',
                borderRadius: 16, padding: 16, border: '1px solid rgba(100,150,255,0.2)',
                position: 'relative', minHeight: 200,
            }}>
              {[...Array(20)].map((_, i) => (<div key={i} style={{
                    position: 'absolute',
                    left: `${(i * 17 + 5) % 90}%`, top: `${(i * 13 + 3) % 80}%`,
                    width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2,
                    background: 'white', borderRadius: '50%', opacity: 0.4 + (i % 5) * 0.1,
                }}/>))}

              {targets.slice(0, 8).map((tgt, i) => {
                const avatar = KINGDOM_AVATARS[i % KINGDOM_AVATARS.length];
                const x = 5 + (i % 4) * 23;
                const y = 10 + Math.floor(i / 4) * 45;
                return (<div key={tgt.id} onClick={() => setProfileId(tgt.id)} style={{
                        position: 'absolute', left: `${x}%`, top: `${y}%`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        cursor: 'pointer', transform: attacking === tgt.id ? 'scale(0.9)' : 'scale(1)',
                        transition: 'transform 0.15s',
                    }}>
                    <div style={{ fontSize: 32, filter: 'drop-shadow(0 0 6px rgba(255,100,100,0.6))' }}>
                      {attacking === tgt.id ? '💥' : avatar}
                    </div>
                    <div style={{ fontSize: 9, color: '#f4d03f', fontWeight: 700, background: 'rgba(0,0,0,0.7)', borderRadius: 4, padding: '1px 5px', marginTop: 2, whiteSpace: 'nowrap' }}>
                      {(tgt.user?.firstName || tgt.name).substring(0, 8)}
                    </div>
                    <div style={{ fontSize: 8, color: '#e74c3c', marginTop: 1 }}>💰{(0, format_1.fmt)(tgt.gold)}</div>
                  </div>);
            })}

              <div style={{ position: 'absolute', left: '42%', top: '35%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 36, filter: 'drop-shadow(0 0 8px rgba(244,208,63,0.8))' }}>👑</div>
                <div style={{ fontSize: 10, color: '#f4d03f', fontWeight: 700, background: 'rgba(0,0,0,0.7)', borderRadius: 4, padding: '1px 5px' }}>{t('you_label')}</div>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: '#a0845a' }}>{t('kingdoms_available', { n: targets.length })}</div>
              {history.length > 0 && (<button onClick={() => setShowHistory(true)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '5px 10px', color: '#a0845a', fontSize: 11, cursor: 'pointer' }}>
                  {t('history_btn', { n: history.length })}
                </button>)}
            </div>
            {targets.map((tgt, i) => (<div key={tgt.id} style={{
                    background: 'linear-gradient(135deg, rgba(30,0,0,0.8), rgba(50,10,10,0.8))',
                    border: '1px solid rgba(231,76,60,0.3)',
                    borderRadius: 12, padding: '12px 14px', marginBottom: 10,
                    display: 'flex', alignItems: 'center', gap: 12,
                }}>
                <div style={{ fontSize: 32 }}>{KINGDOM_AVATARS[i % KINGDOM_AVATARS.length]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{tgt.name}</div>
                  <div style={{ fontSize: 11, color: '#a0845a' }}>@{tgt.user?.username || tgt.user?.firstName || '?'}</div>
                  <div style={{ display: 'flex', gap: 10, fontSize: 12, marginTop: 4 }}>
                    <span>💰 {(0, format_1.fmt)(tgt.gold)}</span>
                    <span>🪵 {(0, format_1.fmt)(tgt.wood)}</span>
                    <span>🏆 {(0, format_1.fmt)(tgt.score)}</span>
                  </div>
                </div>
                <button onClick={() => setProfileId(tgt.id)} style={{
                    background: attacking === tgt.id
                        ? 'linear-gradient(135deg,#b8860b,#f4d03f)'
                        : 'linear-gradient(135deg,#c0392b,#e74c3c)',
                    border: 'none', borderRadius: 10, padding: '10px 16px',
                    color: attacking === tgt.id ? '#000' : 'white',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    boxShadow: '0 3px 10px rgba(231,76,60,0.4)',
                }}>
                  {attacking === tgt.id ? `⚔️ ${marchCountdown}s` : t('check_btn')}
                </button>
              </div>))}
          </div>

          <div style={{ textAlign: 'center', paddingBottom: 16 }}>
            <button className="btn btn-ghost" onClick={loadTargets} style={{ fontSize: 13 }}>
              {t('refresh_map')}
            </button>
          </div>
        </>)}
    </div>);
}
//# sourceMappingURL=AttackScreen.js.map