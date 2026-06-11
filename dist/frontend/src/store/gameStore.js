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
                units: data.units ?? prev.units,
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
}));
//# sourceMappingURL=gameStore.js.map