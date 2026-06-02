export function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(Math.floor(n));
}

export function timeLeft(endsAt: string | null): string {
  if (!endsAt) return '';
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'הושלם';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  if (h > 0) return `${h}ש ${m}ד`;
  if (m > 0) return `${m}:${String(s).padStart(2, '0')}`;
  return `${s}ש`;
}

export const BUILDING_NAMES: Record<string, string> = {
  town_hall:    '🏛️ Town Hall',
  gold_mine:    '💰 מכרה זהב',
  lumber_mill:  '🪵 מסור',
  stone_quarry: '🪨 מחצבה',
  farm:         '🌾 חווה',
  barracks:     '⚔️ כפר',
  academy:      '📚 אקדמיה',
  wall:         '🧱 חומה',
  watch_tower:  '🗼 מגדל שמירה',
};

export const UNIT_NAMES: Record<string, string> = {
  spearman:   '🪖 חניתן',
  archer:     '🏹 קשת',
  swordsman:  '⚔️ חרבן',
  cavalry:    '🐴 פרש',
  catapult:   '💣 קטפולטה',
  elite_guard:'👑 שומר עלית',
};
