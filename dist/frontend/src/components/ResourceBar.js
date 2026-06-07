"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ResourceBar;
const gameStore_1 = require("../store/gameStore");
const format_1 = require("../utils/format");
const LanguageSwitcher_1 = require("./LanguageSwitcher");
const RESOURCES = [
    { key: 'gold', emoji: '💰', maxKey: 'maxGold' },
    { key: 'wood', emoji: '🪵', maxKey: 'maxWood' },
    { key: 'stone', emoji: '🪨', maxKey: 'maxStone' },
    { key: 'food', emoji: '🌾', maxKey: 'maxFood' },
    { key: 'gems', emoji: '💎', maxKey: null },
];
function ResourceBar() {
    const kingdom = (0, gameStore_1.useGameStore)(s => s.kingdom);
    if (!kingdom)
        return null;
    return (<div className="resource-bar" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', flexWrap: 'wrap' }}>
      
      {RESOURCES.map(({ key, emoji, maxKey }) => {
            const val = kingdom[key];
            const max = maxKey ? kingdom[maxKey] : 0;
            const pct = max > 0 ? val / max : 1;
            const low = maxKey && pct < 0.15;
            const full = maxKey && pct >= 0.99;
            const glow = full ? '0 0 8px rgba(231,76,60,0.6)' : low ? '0 0 8px rgba(243,156,18,0.6)' : 'none';
            return (<div key={key} className="resource-item" title={maxKey ? `${(0, format_1.fmt)(val)} / ${(0, format_1.fmt)(max)}` : undefined} style={{ boxShadow: glow, borderRadius: 8, padding: glow !== 'none' ? '2px 7px' : undefined, color: full ? '#e74c3c' : low ? '#f39c12' : undefined, transition: 'box-shadow 0.3s', flexShrink: 0 }}>
            <span>{emoji}</span>
            <span>{(0, format_1.fmt)(val)}{maxKey ? `/${(0, format_1.fmt)(max)}` : ''}</span>
          </div>);
        })}

      
      <div className="resource-item" style={{ color: '#27ae60', fontWeight: 700, flexShrink: 0 }}>
        💵 ${(kingdom.usdtBalance || 0).toFixed(2)}
      </div>

      
      <div style={{ flexShrink: 0, marginLeft: 'auto' }}>
        <LanguageSwitcher_1.default />
      </div>
    </div>);
}
//# sourceMappingURL=ResourceBar.js.map