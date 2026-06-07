"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAdsGram = useAdsGram;
const react_1 = require("react");
const BLOCK_IDS = {
    reward: '34207',
    interstitial: 'int-34204',
};
function useAdsGram(type, onReward, onError) {
    const controllerRef = (0, react_1.useRef)(null);
    const show = (0, react_1.useCallback)(async () => {
        const AdController = window.Adsgram?.init({ blockId: BLOCK_IDS[type] });
        if (!AdController) {
            onError?.('AdsGram not available');
            return;
        }
        controllerRef.current = AdController;
        try {
            const result = await AdController.show();
            if (result.done) {
                onReward?.();
            }
            else {
                onError?.(result.description || 'Ad skipped');
            }
        }
        catch (e) {
            onError?.(e?.message || 'Ad error');
        }
    }, [type, onReward, onError]);
    return show;
}
//# sourceMappingURL=useAdsGram.js.map