"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BuildScreen;
const react_1 = require("react");
const gameStore_1 = require("../store/gameStore");
const format_1 = require("../utils/format");
const Countdown_1 = require("../components/Countdown");
const costs_1 = require("../utils/costs");
const client_1 = require("../api/client");
const useT_1 = require("../i18n/useT");
const BUILDING_ICONS = {
    town_hall: '🏛️', gold_mine: '⛏️', lumber_mill: '🪵', stone_quarry: '🪨',
    farm: '🌾', barracks: '⚔️', academy: '📚', wall: '🧱', watch_tower: '🗼',
    hospital: '🏥', arcane_tower: '🔮',
};
const BUILDING_COLORS = {
    town_hall: '#f4d03f', gold_mine: '#ffd700', lumber_mill: '#8B5E3C',
    stone_quarry: '#aaa', farm: '#7dbb3f', barracks: '#e74c3c',
    academy: '#9b59b6', wall: '#95a5a6', watch_tower: '#3498db',
    hospital: '#e74c3c', arcane_tower: '#9b59b6',
};
function BuildScreen() {
    const { buildings, kingdom, refresh } = (0, gameStore_1.useGameStore)();
    const [loading, setLoading] = (0, react_1.useState)(null);
    const [msg, setMsg] = (0, react_1.useState)('');
    const t = (0, useT_1.useT)();
    async function upgrade(type) {
        setLoading(type);
        setMsg('');
        try {
            await client_1.api.post('/buildings/upgrade', { type });
            await refresh();
            setMsg(t('upgrade_done'));
        }
        catch (e) {
            setMsg(e.response?.data?.message || t('error'));
        }
        finally {
            setLoading(null);
        }
    }
    async function speedUp(type) {
        setLoading('speedup-' + type);
        setMsg('');
        try {
            await client_1.api.post('/buildings/speedup', { type });
            await refresh();
            setMsg(t('speedup_done'));
        }
        catch (e) {
            setMsg(e.response?.data?.message || t('error'));
        }
        finally {
            setLoading(null);
        }
    }
    return (<div className="screen">
      <div className="screen-title">{t('build_title')}</div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
            { key: 'gold', maxKey: 'maxGold', emoji: '💰', color: '#f4d03f' },
            { key: 'wood', maxKey: 'maxWood', emoji: '🪵', color: '#b07a45' },
            { key: 'stone', maxKey: 'maxStone', emoji: '🪨', color: '#b8c0c4' },
            { key: 'food', maxKey: 'maxFood', emoji: '🌾', color: '#7dbb3f' },
        ].map(({ key, maxKey, emoji, color }) => {
            const val = kingdom?.[key] ?? 0;
            const max = kingdom?.[maxKey] ?? 0;
            const pct = max > 0 ? Math.min((val / max) * 100, 100) : 0;
            const full = pct >= 99;
            return (<div key={key} style={{
                    flex: '1 1 70px', minWidth: 70,
                    background: 'rgba(0,0,0,0.35)',
                    border: `1px solid ${full ? '#e74c3c66' : color + '22'}`,
                    borderRadius: 9, padding: '6px 8px',
                    boxShadow: full ? '0 0 10px rgba(231,76,60,0.4)' : 'none',
                }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: full ? '#e74c3c' : color }}>
                <span>{emoji} {full ? t('storage_full_label') : `${Math.round(pct)}%`}</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: full ? '#e74c3c' : color, borderRadius: 2, transition: 'width 0.3s' }}/>
              </div>
            </div>);
        })}
      </div>

      {msg && (<div style={{
                padding: '10px 14px', borderRadius: 10, marginBottom: 12,
                background: msg.startsWith('⬆️') ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)',
                border: `1px solid ${msg.startsWith('⬆️') ? '#27ae60' : '#e74c3c'}44`,
                color: msg.startsWith('⬆️') ? '#27ae60' : '#e74c3c',
                fontSize: 13, textAlign: 'center',
            }}>
          {msg}
        </div>)}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {buildings.map(b => {
            const color = BUILDING_COLORS[b.type] || '#f4d03f';
            const isUpg = b.upgradeEndsAt && new Date() < new Date(b.upgradeEndsAt);
            const cost = (0, costs_1.upgradeCost)(b.type, b.level);
            const have = {
                gold: kingdom?.gold ?? 0,
                wood: kingdom?.wood ?? 0,
                stone: kingdom?.stone ?? 0,
            };
            const canAfford = cost.gold <= have.gold && cost.wood <= have.wood && cost.stone <= have.stone;
            return (<div key={b.id} style={{
                    background: 'linear-gradient(135deg,var(--bg-card),var(--bg-card2))',
                    border: `1px solid ${isUpg ? '#3498db' : color}33`,
                    borderRadius: 12,
                    padding: 14,
                    boxShadow: isUpg ? '0 0 12px rgba(52,152,219,0.2)' : 'none',
                }} className={isUpg ? 'upgrading-building' : ''}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 9,
                    background: `${color}22`,
                    border: `1px solid ${color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20,
                }}>
                    {isUpg
                    ? <span className="hammer-icon">🔨</span>
                    : BUILDING_ICONS[b.type] || '🏠'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color }}>{t('b_' + b.type)}</div>
                    <div style={{ color: '#a0845a', fontSize: 11 }}>{t('level_arrow', { from: b.level, to: b.level + 1 })}</div>
                  </div>
                </div>
                <div style={{
                    background: `${color}22`, border: `1px solid ${color}44`,
                    borderRadius: 8, padding: '3px 10px',
                    fontSize: 12, fontWeight: 700, color,
                }}>
                  Lv.{b.level}
                </div>
              </div>

              <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
                <div style={{
                    height: '100%', width: `${Math.min((b.level / 30) * 100, 100)}%`,
                    background: `linear-gradient(90deg,${color}88,${color})`,
                    borderRadius: 3, transition: 'width 0.4s',
                }}/>
              </div>

              {b.type === 'town_hall' && (<div style={{
                        background: 'rgba(244,208,63,0.08)', border: '1px solid rgba(244,208,63,0.2)',
                        borderRadius: 8, padding: '7px 10px', marginBottom: 10,
                        display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: '#a0845a',
                    }}>
                  <span>{t('max_storage_label')}</span>
                  <span style={{ color: '#f4d03f', fontWeight: 700 }}>💰 {(0, format_1.fmt)(kingdom?.maxGold ?? 0)}</span>
                  <span style={{ color: '#8B5E3C', fontWeight: 700 }}>🪵 {(0, format_1.fmt)(kingdom?.maxWood ?? 0)}</span>
                  <span style={{ color: '#aaa', fontWeight: 700 }}>🪨 {(0, format_1.fmt)(kingdom?.maxStone ?? 0)}</span>
                </div>)}

              {isUpg ? (<div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 12px', borderRadius: 8,
                        background: 'rgba(52,152,219,0.1)', border: '1px solid rgba(52,152,219,0.3)',
                        color: '#3498db', fontSize: 13,
                    }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                    <span>⏳</span>
                    <span>{t('upgrading_label')} <Countdown_1.default endsAt={b.upgradeEndsAt}/></span>
                  </div>
                  {(() => {
                        const secsLeft = Math.max(0, (new Date(b.upgradeEndsAt).getTime() - Date.now()) / 1000);
                        const gemCost = Math.max(1, Math.ceil(secsLeft / 60));
                        return (<button className="btn btn-gold" style={{ whiteSpace: 'nowrap', fontSize: 12, padding: '6px 10px' }} disabled={loading === 'speedup-' + b.type} onClick={() => speedUp(b.type)}>
                        {loading === 'speedup-' + b.type ? '⏳' : t('speedup_gems', { n: gemCost })}
                      </button>);
                    })()}
                </div>) : (<>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    {['gold', 'wood', 'stone'].map(res => {
                        if (cost[res] <= 0)
                            return null;
                        const enough = have[res] >= cost[res];
                        const meta = costs_1.RESOURCE_META[res];
                        return (<div key={res} style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '3px 9px', borderRadius: 7,
                                fontSize: 12, fontWeight: 700,
                                background: enough ? `${meta.color}1a` : 'rgba(231,76,60,0.15)',
                                border: `1px solid ${enough ? meta.color + '44' : '#e74c3c66'}`,
                                color: enough ? meta.color : '#e74c3c',
                            }}>
                          <span>{meta.emoji}</span>
                          <span>{(0, format_1.fmt)(cost[res])}</span>
                        </div>);
                    })}
                  </div>
                  <button className="btn btn-gold" style={{ width: '100%', padding: '10px', fontSize: 13, opacity: canAfford ? 1 : 0.55 }} disabled={loading === b.type || !canAfford} onClick={() => upgrade(b.type)}>
                    {loading === b.type
                        ? t('processing')
                        : canAfford
                            ? t('upgrade_to_lv', { n: b.level + 1 })
                            : t('no_resources_btn')}
                  </button>
                </>)}
            </div>);
        })}
      </div>
    </div>);
}
//# sourceMappingURL=BuildScreen.js.map