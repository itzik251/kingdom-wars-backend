"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ResourceBar;
const react_1 = require("react");
const gameStore_1 = require("../store/gameStore");
const format_1 = require("../utils/format");
const LanguageSwitcher_1 = require("./LanguageSwitcher");
const RESOURCES = [
    { key: 'gold', icon: '/assets/icon_gold.png', maxKey: 'maxGold' },
    { key: 'wood', icon: '/assets/icon_wood.png', maxKey: 'maxWood' },
    { key: 'stone', icon: '/assets/icon_stone.png', maxKey: 'maxStone' },
    { key: 'food', icon: '/assets/icon_food.png', maxKey: 'maxFood' },
    { key: 'gems', icon: '/assets/icon_gem.png', maxKey: null },
];
function ResourceBar() {
    const kingdom = (0, gameStore_1.useGameStore)(s => s.kingdom);
    const refresh = (0, gameStore_1.useGameStore)(s => s.refresh);
    const [spinning, setSpinning] = (0, react_1.useState)(false);
    if (!kingdom)
        return null;
    async function handleRefreshUsdt() {
        if (spinning)
            return;
        setSpinning(true);
        await refresh().catch(() => { });
        window.dispatchEvent(new Event('usdt-balance-refresh'));
        setTimeout(() => setSpinning(false), 1000);
    }
    return (<div className="resource-bar" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', flexWrap: 'wrap' }}>
      
      {RESOURCES.map(({ key, icon, maxKey }) => {
            const val = kingdom[key];
            const max = maxKey ? kingdom[maxKey] : 0;
            const pct = max > 0 ? val / max : 1;
            const low = maxKey && pct < 0.15;
            const full = maxKey && pct >= 0.99;
            const glow = full ? '0 0 8px rgba(231,76,60,0.6)' : low ? '0 0 8px rgba(243,156,18,0.6)' : 'none';
            return (<div key={key} className="resource-item" title={maxKey ? `${(0, format_1.fmt)(val)} / ${(0, format_1.fmt)(max)}` : undefined} style={{ boxShadow: glow, borderRadius: 8, padding: glow !== 'none' ? '2px 7px' : undefined, color: full ? '#e74c3c' : low ? '#f39c12' : undefined, transition: 'box-shadow 0.3s', flexShrink: 0 }}>
            <img src={icon} alt={key} style={{ width: 16, height: 16, objectFit: 'contain', verticalAlign: 'middle', marginBottom: 1 }}/>
            <span>{(0, format_1.fmt)(val)}{maxKey ? `/${(0, format_1.fmt)(max)}` : ''}</span>
          </div>);
        })}

      
      <div className="resource-item" onClick={handleRefreshUsdt} style={{ color: '#27ae60', fontWeight: 700, flexShrink: 0, cursor: 'pointer', userSelect: 'none' }} title="לחץ לרענון">
        <img src="/assets/icon_dollar.png" alt="usdt" style={{ width: 16, height: 16, objectFit: 'contain', verticalAlign: 'middle', marginBottom: 1 }}/>
        ${(kingdom.usdtBalance || 0).toFixed(3)}
        <span style={{ marginLeft: 3, opacity: 0.6, fontSize: 9, transition: 'transform 0.5s', display: 'inline-block', transform: spinning ? 'rotate(360deg)' : 'rotate(0deg)' }}>🔄</span>
      </div>

      
      <div style={{ flexShrink: 0, marginLeft: 'auto' }}>
        <LanguageSwitcher_1.default />
      </div>
    </div>);
}
//# sourceMappingURL=ResourceBar.js.map