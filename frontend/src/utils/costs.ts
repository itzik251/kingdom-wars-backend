// Imports from shared — do NOT define costs/growth here.
export type { Cost } from '../../../packages/shared';
export { upgradeCost, BUILDING_BASE_COSTS } from '../../../packages/shared';

import type { Cost } from '../../../packages/shared';

export const RESOURCE_META: Record<keyof Cost, { emoji: string; color: string }> = {
  gold:  { emoji: '💰', color: '#f4d03f' },
  wood:  { emoji: '🪵', color: '#b07a45' },
  stone: { emoji: '🪨', color: '#b8c0c4' },
};
