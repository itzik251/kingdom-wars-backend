"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UNIT_NAMES = exports.BUILDING_ICONS = exports.BUILDING_NAMES = void 0;
exports.fmt = fmt;
exports.timeLeft = timeLeft;
function fmt(n) {
    if (n >= 1_000_000)
        return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)
        return (n / 1_000).toFixed(1) + 'K';
    return String(Math.floor(n));
}
function timeLeft(endsAt) {
    if (!endsAt)
        return '';
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0)
        return '✓';
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    if (h > 0)
        return `${h}h ${m}m`;
    if (m > 0)
        return `${m}:${String(s).padStart(2, '0')}`;
    return `${s}s`;
}
exports.BUILDING_NAMES = {
    town_hall: 'עירייה',
    gold_mine: 'מכרה זהב',
    lumber_mill: 'נגרייה',
    stone_quarry: 'מחצבה',
    farm: 'חווה',
    barracks: 'בסיס צבאי',
    academy: 'אקדמיה',
    wall: 'חומה',
    watch_tower: 'מגדל שמירה',
    hospital: 'בית חולים',
    arcane_tower: 'מגדל ארקני',
};
exports.BUILDING_ICONS = {
    town_hall: '🏛️',
    gold_mine: '⛏️',
    lumber_mill: '🪵',
    stone_quarry: '🪨',
    farm: '🌾',
    barracks: '⚔️',
    academy: '📚',
    wall: '🧱',
    watch_tower: '🗼',
    hospital: '🏥',
    arcane_tower: '🔮',
};
exports.UNIT_NAMES = {
    spearman: '🪖 חניתן',
    archer: '🏹 קשת',
    swordsman: '⚔️ חרבן',
    cavalry: '🐴 פרש',
    catapult: '💣 קטפולטה',
    elite_guard: '👑 שומר עלית',
    paladin: '🛡️ פלדין',
    dragon_rider: '🐉 רוכב דרקון',
};
//# sourceMappingURL=format.js.map