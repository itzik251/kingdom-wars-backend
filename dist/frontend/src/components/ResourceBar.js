"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ResourceBar;
const gameStore_1 = require("../store/gameStore");
const format_1 = require("../utils/format");
const RESOURCES = [
    { key: 'gold', icon: '/assets/icon_gold.png', maxKey: 'maxGold', color: '#f4d03f' },
    { key: 'wood', icon: '/assets/icon_wood.png', maxKey: 'maxWood', color: '#c8874a' },
    { key: 'stone', icon: '/assets/icon_stone.png', maxKey: 'maxStone', color: '#b0b8c0' },
    { key: 'food', icon: '/assets/icon_food.png', maxKey: 'maxFood', color: '#7dbb3f' },
    { key: 'gems', icon: '/assets/icon_gem.png', maxKey: null, color: '#1aafbf' },
];
function ResourceBar() {
    const kingdom = (0, gameStore_1.useGameStore)(s => s.kingdom);
    const productionRates = (0, gameStore_1.useGameStore)(s => s.productionRates);
    if (!kingdom)
        return null;
    const workers = kingdom.workers ?? 0;
    const explorers = kingdom.explorerCount ?? 0;
    function openWorkers() {
        window.dispatchEvent(new Event('open-workers'));
    }
    return (<div style={{
            display: 'flex', alignItems: 'center',
            padding: '4px 6px',
            background: 'linear-gradient(180deg, rgba(8,4,0,0.97) 0%, rgba(14,8,0,0.95) 100%)',
            borderBottom: '1px solid rgba(244,208,63,0.1)',
            flexShrink: 0,
            gap: 2,
        }}>
      {RESOURCES.map(({ key, icon, maxKey, color }) => {
            const val = kingdom[key] ?? 0;
            const max = maxKey ? kingdom[maxKey] ?? 0 : 0;
            const rate = productionRates[key] ?? 0;
            const pct = max > 0 ? val / max : 1;
            const isFull = !!maxKey && pct >= 0.99;
            const isLow = !!maxKey && pct < 0.15;
            const valColor = isFull ? '#e74c3c' : isLow ? '#f39c12' : color;
            return (<div key={key} title={maxKey ? `${(0, format_1.fmt)(val)} / ${(0, format_1.fmt)(max)}` : undefined} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 0 }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <img src={icon} alt={key} style={{ width: 13, height: 13, objectFit: 'contain' }}/>
              <span style={{ fontSize: 11, fontWeight: 700, color: valColor, lineHeight: 1 }}>{(0, format_1.fmt)(val)}</span>
            </div>
            
            {maxKey && rate !== 0 && (<span style={{ fontSize: 8.5, color: rate > 0 ? '#5a8' : '#c55', lineHeight: 1, marginTop: 1 }}>
                {rate > 0 ? '+' : ''}{(0, format_1.fmt)(rate)}/h
              </span>)}
            
            {maxKey && (<div style={{ width: '85%', height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginTop: 2 }}>
                <div style={{ height: '100%', borderRadius: 1, width: `${Math.min(100, pct * 100)}%`, background: valColor, transition: 'width 0.4s' }}/>
              </div>)}
          </div>);
        })}

      
      <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.07)', margin: '0 2px', flexShrink: 0 }}/>

      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <img src="/assets/icon_dollar.png" alt="usdt" style={{ width: 12, height: 12, objectFit: 'contain' }}/>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#27ae60' }}>${(kingdom.usdtBalance || 0).toFixed(3)}</span>
        </div>
      </div>

    </div>);
}
//# sourceMappingURL=ResourceBar.js.map