"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGameStore = void 0;
const zustand_1 = require("zustand");
const client_1 = require("../api/client");
exports.useGameStore = (0, zustand_1.create)((set, get) => ({
    token: null,
    kingdom: null,
    buildings: [],
    units: [],
    productionRates: {},
    isLoading: false,
    activeScreen: 'home',
    marchingSquads: (() => {
        try {
            const saved = localStorage.getItem('kw_march_meta');
            if (!saved)
                return {};
            const meta = JSON.parse(saved);
            const now = Date.now();
            const valid = Object.fromEntries(Object.entries(meta).filter(([, v]) => v.endsAt > now));
            const squads = {};
            for (const [id, v] of Object.entries(valid))
                squads[id] = v.squad ?? {};
            return squads;
        }
        catch {
            return {};
        }
    })(),
    marchMeta: (() => {
        try {
            const saved = localStorage.getItem('kw_march_meta');
            if (!saved)
                return {};
            const meta = JSON.parse(saved);
            const now = Date.now();
            return Object.fromEntries(Object.entries(meta).filter(([, v]) => v.endsAt > now));
        }
        catch {
            return {};
        }
    })(),
    pendingBattleReport: null,
    pendingError: null,
    setToken: (token) => {
        set({ token });
        localStorage.setItem('kw_token', token);
    },
    setScreen: (screen) => set({ activeScreen: screen }),
    loadKingdom: async () => {
        set({ isLoading: true });
        try {
            const data = await client_1.api.get('/kingdom');
            const prev = get();
            set({
                kingdom: {
                    ...data.kingdom,
                    shieldActive: data.shieldActive,
                    shieldUntil: data.shieldUntil,
                    isVip: !!data.isVip,
                    workers: data.workers ?? 0,
                    maxWorkers: data.maxWorkers ?? 5,
                    usdtBalance: data.kingdom?.usdtBalance ?? 0,
                    attackSpeedBoostUntil: data.kingdom?.attackSpeedBoostUntil ?? null,
                    productionBoostUntil: data.kingdom?.productionBoostUntil ?? null,
                },
                buildings: data.buildings ?? prev.buildings,
                units: (() => {
                    const raw = data.units ?? prev.units;
                    const squads = Object.values(get().marchingSquads);
                    if (!squads.length)
                        return raw;
                    return raw.map(u => {
                        const totalMarching = squads.reduce((s, sq) => s + (sq[u.type] ?? 0), 0);
                        return { ...u, count: Math.max(0, u.count - totalMarching) };
                    });
                })(),
                productionRates: data.productionRates && Object.keys(data.productionRates).length > 0
                    ? data.productionRates
                    : prev.productionRates,
            });
        }
        finally {
            set({ isLoading: false });
        }
    },
    refresh: async () => {
        const { loadKingdom } = get();
        await loadKingdom();
    },
    addMarchingSquad: (kingdomId, squad, heroType, endsAt) => set(state => {
        const newMeta = { ...state.marchMeta, [kingdomId]: { squad, heroType, endsAt } };
        try {
            localStorage.setItem('kw_march_meta', JSON.stringify(newMeta));
        }
        catch { }
        return {
            marchingSquads: { ...state.marchingSquads, [kingdomId]: squad ?? {} },
            marchMeta: newMeta,
            units: squad ? state.units.map(u => ({
                ...u,
                count: Math.max(0, u.count - (squad[u.type] ?? 0)),
            })) : state.units,
        };
    }),
    removeMarchingSquad: (kingdomId) => set(state => {
        const { [kingdomId]: _s, ...squads } = state.marchingSquads;
        const { [kingdomId]: _m, ...meta } = state.marchMeta;
        try {
            localStorage.setItem('kw_march_meta', JSON.stringify(meta));
        }
        catch { }
        return { marchingSquads: squads, marchMeta: meta };
    }),
    setPendingBattleReport: (report) => set({ pendingBattleReport: report }),
    clearPendingBattleReport: () => set({ pendingBattleReport: null }),
    setPendingError: (msg) => set({ pendingError: msg }),
    clearPendingError: () => set({ pendingError: null }),
}));
//# sourceMappingURL=gameStore.js.map