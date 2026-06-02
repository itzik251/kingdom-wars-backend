import { useGameStore } from '../store/gameStore';
import { fmt } from '../utils/format';

const RESOURCES = [
  { key: 'gold',  emoji: '💰', maxKey: 'maxGold'  },
  { key: 'wood',  emoji: '🪵', maxKey: 'maxWood'  },
  { key: 'stone', emoji: '🪨', maxKey: 'maxStone' },
  { key: 'food',  emoji: '🌾', maxKey: 'maxFood'  },
  { key: 'gems',  emoji: '💎', maxKey: null        },
] as const;

declare global { interface Window { Telegram?: any; } }

function closeApp() {
  window.Telegram?.WebApp?.close();
}

const isInTelegram = !!window.Telegram?.WebApp?.initData;

export default function ResourceBar() {
  const kingdom = useGameStore(s => s.kingdom);
  if (!kingdom) return null;

  return (
    <div className="resource-bar">
      {RESOURCES.map(({ key, emoji, maxKey }) => (
        <div key={key} className="resource-item" title={maxKey ? `${fmt(kingdom[key])} / ${fmt(kingdom[maxKey])}` : undefined}>
          <span>{emoji}</span>
          <span>{fmt(kingdom[key])}</span>
        </div>
      ))}
      {kingdom.shieldActive && (
        <div className="resource-item" style={{ color: '#3498db' }}>
          🛡️
        </div>
      )}
      {isInTelegram && (
        <button
          onClick={closeApp}
          style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            color: '#6b3a00', fontSize: 18, cursor: 'pointer', padding: '0 4px',
            lineHeight: 1,
          }}
          title="סגור"
        >
          ✕
        </button>
      )}
    </div>
  );
}
