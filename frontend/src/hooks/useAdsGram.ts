import { useCallback, useRef } from 'react';

const BLOCK_IDS = {
  reward: '34710',
  interstitial: 'int-34711',
};

type AdType = keyof typeof BLOCK_IDS;

export function useAdsGram(type: AdType, onReward?: () => void, onError?: (err: string) => void) {
  const controllerRef = useRef<any>(null);

  const show = useCallback(async () => {
    const AdController = (window as any).Adsgram?.init({ blockId: BLOCK_IDS[type] });
    if (!AdController) {
      onError?.('AdsGram not available');
      return;
    }
    controllerRef.current = AdController;
    try {
      const result = await AdController.show();
      if (result.done) {
        onReward?.();
      } else {
        onError?.(result.description || 'Ad skipped');
      }
    } catch (e: any) {
      onError?.(e?.message || 'Ad error');
    }
  }, [type, onReward, onError]);

  return show;
}
