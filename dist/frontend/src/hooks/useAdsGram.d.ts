declare const BLOCK_IDS: {
    reward: string;
    interstitial: string;
};
type AdType = keyof typeof BLOCK_IDS;
export declare function useAdsGram(type: AdType, onReward?: () => void, onError?: (err: string) => void): () => Promise<void>;
export {};
