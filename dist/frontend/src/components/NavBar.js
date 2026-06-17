"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NavBar;
const react_1 = require("react");
const gameStore_1 = require("../store/gameStore");
const useT_1 = require("../i18n/useT");
const LanguageSwitcher_1 = require("./LanguageSwitcher");
const translations_1 = require("../i18n/translations");
const TABS = [
    { key: 'home', emoji: '🏰', tkey: 'nav_home' },
    { key: 'worldmap', emoji: '🗺️', tkey: 'nav_worldmap' },
    { key: 'army', emoji: '⚔️', tkey: 'nav_army' },
    { key: 'attack', emoji: '🗡️', tkey: 'nav_attack' },
    { key: 'repair', emoji: '🔧', tkey: 'nav_repair' },
    { key: 'alliance', emoji: '🤝', tkey: 'nav_alliance' },
    { key: 'leaderboard', emoji: '🏆', tkey: 'nav_leaderboard' },
    { key: 'quests', emoji: '📋', tkey: 'nav_quests' },
    { key: 'shop', emoji: '🛒', tkey: 'nav_shop' },
    { key: 'messages', emoji: '📬', tkey: 'nav_messages' },
];
function NavBar() {
    const { activeScreen, setScreen } = (0, gameStore_1.useGameStore)();
    const kingdom = (0, gameStore_1.useGameStore)(s => s.kingdom);
    const t = (0, useT_1.useT)();
    const { lang } = (0, useT_1.useLangStore)();
    const isRtl = translations_1.LANGUAGES.find(l => l.code === lang)?.rtl ?? true;
    const side = isRtl ? 'left' : 'right';
    const [open, setOpen] = (0, react_1.useState)(false);
    const active = TABS.find(tb => tb.key === activeScreen);
    const isVip = !!kingdom?.isVip;
    const kingdomName = kingdom?.name ?? '';
    const firstChar = [...kingdomName][0] ?? '';
    const hasFlag = firstChar && kingdomName.startsWith(firstChar + ' ');
    const flagEmoji = hasFlag ? firstChar : null;
    const displayName = hasFlag ? kingdomName.slice([...kingdomName][0].length).trimStart() : kingdomName;
    function go(key) {
        setScreen(key);
        setOpen(false);
    }
    return (<>
      
      {open && (<div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 490, background: 'rgba(0,0,0,0.5)' }}/>)}

      
      <button onClick={() => setOpen(v => !v)} style={{
            position: 'fixed', top: 46, [side]: 10, zIndex: 510,
            width: 40, height: 40, borderRadius: 12,
            background: open
                ? 'linear-gradient(135deg, #f4d03f, #e67e22)'
                : 'linear-gradient(160deg, rgba(30,15,0,0.95), rgba(15,7,0,0.97))',
            border: `1.5px solid ${open ? '#f4d03f' : 'rgba(244,208,63,0.3)'}`,
            boxShadow: open ? '0 4px 20px rgba(244,208,63,0.4)' : '0 2px 12px rgba(0,0,0,0.6)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: open ? 18 : 20,
            transition: 'all 0.18s',
        }}>
        {open ? <span style={{ color: '#000', fontWeight: 900, fontSize: 16 }}>✕</span> : <span>{active?.emoji ?? '☰'}</span>}
      </button>

      
      <div style={{
            position: 'fixed', top: 92, [side]: 10, zIndex: 500,
            width: 230,
            background: 'linear-gradient(160deg, rgba(18,9,0,0.99), rgba(8,4,0,0.99))',
            border: '1px solid rgba(244,208,63,0.2)',
            borderRadius: 16,
            padding: '10px 8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            opacity: open ? 1 : 0,
            visibility: open ? 'visible' : 'hidden',
            pointerEvents: open ? 'auto' : 'none',
            transition: 'opacity 0.15s, visibility 0.15s',
        }}>
        
        <button onClick={() => { window.dispatchEvent(new Event('open-rename')); setOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(244,208,63,0.07)', border: '1px solid rgba(244,208,63,0.15)', borderRadius: 10, padding: '7px 10px', cursor: 'pointer', marginBottom: 8 }}>
          {flagEmoji && <span style={{ fontSize: 24, lineHeight: 1 }}>{flagEmoji}</span>}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#f4d03f' }}>{displayName}</span>
              {isVip && <img src="/assets/icon_vip.png" alt="VIP" style={{ width: 28, height: 18, objectFit: 'contain' }}/>}
            </div>
            <div style={{ fontSize: 9, color: '#666', marginTop: 1, textAlign: isRtl ? 'right' : 'left' }}>{t('edit_kingdom_hint')}</div>
          </div>
        </button>

        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <LanguageSwitcher_1.default />
        </div>

        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
          {TABS.map(({ key, emoji, tkey }) => {
            const isActive = activeScreen === key;
            const label = t(tkey).replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, '').trim();
            return (<button key={key} onClick={() => go(key)} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    padding: '7px 2px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: isActive ? 'rgba(244,208,63,0.18)' : 'rgba(255,255,255,0.04)',
                    boxShadow: isActive ? 'inset 0 0 0 1px rgba(244,208,63,0.35)' : 'none',
                }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>{emoji}</span>
                <span style={{ fontSize: 8, color: isActive ? '#f4d03f' : '#888', fontWeight: isActive ? 700 : 400, textAlign: 'center' }}>{label}</span>
              </button>);
        })}
        </div>
      </div>
    </>);
}
//# sourceMappingURL=NavBar.js.map