import { create } from 'zustand';
import { api } from '../api/client';

export interface Resources {
  gold: number; wood: number; stone: number; food: number; gems: number;
  maxGold: number; maxWood: number; maxStone: number; maxFood: number;
}

export interface Building {
  id: string; type: string; level: number; slot?: number;
  upgradeEndsAt: string | null; isUpgrading: boolean;
  needsRepair?: boolean;
  repairEndsAt?: string | null;
  gridX?: number | null; gridY?: number | null;
}

export interface Unit {
  type: string; count: number;
  trainingCount: number; trainingEndsAt: string | null;
  woundedCount?: number;
}

export interface Kingdom extends Resources {
  id: string; name: string; score: number;
  shieldUntil: string | null; shieldActive: boolean;
  lastResourceTick: string;
  isVip?: boolean;
  vipExpiresAt?: string | null;
  workers: number;
  maxWorkers: number;
  explorerCount?: number;
  usdtBalance?: number;
  attackSpeedBoostUntil?: string | null;
  productionBoostUntil?: string | null;
}

interface GameState {
  token: string | null;
  kingdom: Kingdom | null;
  buildings: Building[];
  units: Unit[];
  productionRates: Record<string, number>;
  isLoading: boolean;
  activeScreen: 'home' | 'repair' | 'army' | 'attack' | 'alliance' | 'referral' | 'shop' | 'leaderboard' | 'quests' | 'worldmap' | 'messages' | 'contact';

  // kingdomId → squad currently marching to that kingdom
  marchingSquads: Record<string, Record<string, number>>;
  // kingdomId → march metadata (survives navigation so countdowns can resume)
  marchMeta: Record<string, { squad?: Record<string, number>; heroType?: string; endsAt: number }>;
  // battle result waiting to be shown (survives navigation)
  pendingBattleReport: any | null;
  pendingError: string | null;

  setToken: (token: string) => void;
  setScreen: (screen: GameState['activeScreen']) => void;
  loadKingdom: () => Promise<void>;
  refresh: () => Promise<void>;
  addMarchingSquad: (kingdomId: string, squad: Record<string, number> | undefined, heroType: string | undefined, endsAt: number) => void;
  removeMarchingSquad: (kingdomId: string) => void;
  setPendingBattleReport: (report: any) => void;
  clearPendingBattleReport: () => void;
  setPendingError: (msg: string) => void;
  clearPendingError: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
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
      if (!saved) return {};
      const meta: Record<string, { squad?: Record<string, number>; heroType?: string; endsAt: number }> = JSON.parse(saved);
      const now = Date.now();
      const valid = Object.fromEntries(Object.entries(meta).filter(([, v]) => v.endsAt > now));
      const squads: Record<string, Record<string, number>> = {};
      for (const [id, v] of Object.entries(valid)) squads[id] = v.squad ?? {};
      return squads;
    } catch { return {}; }
  })(),
  marchMeta: (() => {
    try {
      const saved = localStorage.getItem('kw_march_meta');
      if (!saved) return {};
      const meta: Record<string, { squad?: Record<string, number>; heroType?: string; endsAt: number }> = JSON.parse(saved);
      const now = Date.now();
      return Object.fromEntries(Object.entries(meta).filter(([, v]) => v.endsAt > now));
    } catch { return {}; }
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
      const data = await api.get('/kingdom');
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
          const raw: Unit[] = data.units ?? prev.units;
          const squads = Object.values(get().marchingSquads);
          if (!squads.length) return raw;
          return raw.map(u => {
            const totalMarching = squads.reduce((s, sq) => s + (sq[u.type] ?? 0), 0);
            return { ...u, count: Math.max(0, u.count - totalMarching) };
          });
        })(),
        productionRates:
          data.productionRates && Object.keys(data.productionRates).length > 0
            ? data.productionRates
            : prev.productionRates,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  refresh: async () => {
    const { loadKingdom } = get();
    await loadKingdom();
  },

  addMarchingSquad: (kingdomId, squad, heroType, endsAt) => set(state => {
    const newMeta = { ...state.marchMeta, [kingdomId]: { squad, heroType, endsAt } };
    try { localStorage.setItem('kw_march_meta', JSON.stringify(newMeta)); } catch {}
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
    try { localStorage.setItem('kw_march_meta', JSON.stringify(meta)); } catch {}
    return { marchingSquads: squads, marchMeta: meta };
  }),

  setPendingBattleReport: (report) => set({ pendingBattleReport: report }),
  clearPendingBattleReport: () => set({ pendingBattleReport: null }),
  setPendingError: (msg) => set({ pendingError: msg }),
  clearPendingError: () => set({ pendingError: null }),
}));
