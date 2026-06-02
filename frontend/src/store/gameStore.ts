import { create } from 'zustand';
import { api } from '../api/client';

export interface Resources {
  gold: number; wood: number; stone: number; food: number; gems: number;
  maxGold: number; maxWood: number; maxStone: number; maxFood: number;
}

export interface Building {
  id: string; type: string; level: number;
  upgradeEndsAt: string | null; isUpgrading: boolean;
}

export interface Unit {
  type: string; count: number;
  trainingCount: number; trainingEndsAt: string | null;
}

export interface Kingdom extends Resources {
  id: string; name: string; score: number;
  shieldUntil: string | null; shieldActive: boolean;
  lastResourceTick: string;
}

interface GameState {
  token: string | null;
  kingdom: Kingdom | null;
  buildings: Building[];
  units: Unit[];
  productionRates: Record<string, number>;
  isLoading: boolean;
  activeScreen: 'home' | 'build' | 'army' | 'attack' | 'alliance' | 'referral' | 'shop';

  setToken: (token: string) => void;
  setScreen: (screen: GameState['activeScreen']) => void;
  loadKingdom: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
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
      const data = await api.get('/kingdom');
      set({
        kingdom: { ...data.kingdom, shieldActive: data.shieldActive, shieldUntil: data.shieldUntil },
        buildings: data.buildings,
        units: data.units,
        productionRates: data.productionRates,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  refresh: async () => {
    const { loadKingdom } = get();
    await loadKingdom();
  },
}));
