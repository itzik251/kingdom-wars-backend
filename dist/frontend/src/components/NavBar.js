"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NavBar;
const gameStore_1 = require("../store/gameStore");
const useT_1 = require("../i18n/useT");
function NavBar() {
    const { activeScreen, setScreen } = (0, gameStore_1.useGameStore)();
    const t = (0, useT_1.useT)();
    const ROW1 = [
        { key: 'home', emoji: '🏰', tkey: 'nav_home' },
        { key: 'repair', emoji: '🔧', tkey: 'nav_repair' },
        { key: 'army', emoji: '⚔️', tkey: 'nav_army' },
        { key: 'attack', emoji: '🗡️', tkey: 'nav_attack' },
    ];
    const ROW2 = [
        { key: 'worldmap', emoji: '🗺️', tkey: 'nav_worldmap' },
        { key: 'leaderboard', emoji: '🏆', tkey: 'nav_leaderboard' },
        { key: 'quests', emoji: '📋', tkey: 'nav_quests' },
        { key: 'shop', emoji: '🛒', tkey: 'nav_shop' },
    ];
    const renderTab = ({ key, emoji, tkey }) => {
        const label = t(tkey).replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, '').trim();
        return (<button key={key} className={`nav-item ${activeScreen === key ? 'active' : ''}`} onClick={() => setScreen(key)} style={{ flex: 1, flexDirection: 'column', gap: 3, padding: '6px 2px' }}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>{emoji}</span>
        <span style={{ fontSize: 9, fontWeight: activeScreen === key ? 700 : 400 }}>{label}</span>
      </button>);
    };
    return (<nav style={{
            background: 'linear-gradient(180deg, rgba(20,10,0,0.97), rgba(10,5,0,0.99))',
            borderTop: '1px solid rgba(244,208,63,0.15)',
            display: 'flex', flexDirection: 'column',
            flexShrink: 0,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.6)',
        }}>
      
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {ROW1.map(renderTab)}
      </div>
      
      <div style={{ display: 'flex' }}>
        {ROW2.map(renderTab)}
      </div>
    </nav>);
}
//# sourceMappingURL=NavBar.js.map