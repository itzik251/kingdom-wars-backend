"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RepairScreen;
const react_1 = require("react");
const gameStore_1 = require("../store/gameStore");
const client_1 = require("../api/client");
const format_1 = require("../utils/format");
const useT_1 = require("../i18n/useT");
function RepairScreen() {
    const { buildings, refresh } = (0, gameStore_1.useGameStore)();
    const [repairing, setRepairing] = (0, react_1.useState)(null);
    const [msg, setMsg] = (0, react_1.useState)('');
    const t = (0, useT_1.useT)();
    const damaged = buildings.filter((b) => b.needsRepair);
    async function repair(buildingId) {
        setRepairing(buildingId);
        setMsg('');
        try {
            await client_1.api.post(`/buildings/repair/${buildingId}`);
            await refresh();
            setMsg(t('repair_fixed'));
        }
        catch (e) {
            setMsg('❌ ' + (e.response?.data?.message || t('error')));
        }
        finally {
            setRepairing(null);
        }
    }
    return (<div className="screen">
      <div className="screen-title">{t('repair_title')}</div>

      {msg && (<div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 12, background: msg.startsWith('✅') ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)', border: `1px solid ${msg.startsWith('✅') ? '#27ae60' : '#e74c3c'}44`, color: msg.startsWith('✅') ? '#27ae60' : '#e74c3c', fontSize: 13, textAlign: 'center' }}>
          {msg}
        </div>)}

      {damaged.length === 0 ? (<div style={{ textAlign: 'center', padding: '60px 20px', color: '#a0845a' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏗️</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{t('all_intact')}</div>
          <div style={{ fontSize: 13 }}>{t('repair_hint')}</div>
        </div>) : (<>
          <div style={{ fontSize: 12, color: '#e74c3c', marginBottom: 12 }}>
            {t('damaged_warning', { n: damaged.length })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {damaged.map((b) => (<div key={b.id} style={{ background: 'linear-gradient(135deg,rgba(60,10,10,0.9),rgba(40,5,5,0.8))', border: '1px solid rgba(231,76,60,0.35)', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      {format_1.BUILDING_ICONS[b.type] || '🏠'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#e74c3c' }}>{t('b_' + b.type)}</div>
                      <div style={{ fontSize: 11, color: '#a0845a' }}>{t('repair_level_battle', { n: b.level })}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 18 }}>💥</span>
                </div>
                <button className="btn btn-gold" style={{ width: '100%', fontSize: 13 }} disabled={repairing === b.id} onClick={() => repair(b.id)}>
                  {repairing === b.id ? t('repair_fixing') : t('repair_btn')}
                </button>
              </div>))}
          </div>
        </>)}
    </div>);
}
//# sourceMappingURL=RepairScreen.js.map