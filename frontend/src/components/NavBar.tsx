import { useGameStore } from '../store/gameStore';

const TABS = [
  { key: 'home',     emoji: '🏰', label: 'ממלכה' },
  { key: 'build',    emoji: '🏗️', label: 'בנייה'  },
  { key: 'army',     emoji: '⚔️', label: 'צבא'   },
  { key: 'attack',   emoji: '🗡️', label: 'תקיפה' },
  { key: 'alliance', emoji: '🤝', label: 'ברית'  },
  { key: 'referral', emoji: '🔗', label: 'הזמן'  },
  { key: 'shop',     emoji: '🛒', label: 'חנות'  },
] as const;

export default function NavBar() {
  const { activeScreen, setScreen } = useGameStore();

  return (
    <nav className="nav-bar">
      {TABS.map(({ key, emoji, label }) => (
        <button
          key={key}
          className={`nav-item ${activeScreen === key ? 'active' : ''}`}
          onClick={() => setScreen(key as any)}
        >
          <span style={{ fontSize: 18 }}>{emoji}</span>
          <span style={{ fontSize: 9 }}>{label}</span>
        </button>
      ))}
    </nav>
  );
}
