import React from 'react';
import type { KingdomProfile } from '../components/KingdomProfileSheet';
interface Props {
    profile: KingdomProfile;
    squad: Record<string, number>;
    winPct: number;
    marchSeconds: number;
    onClose: () => void;
    onFinish: () => void;
}
export default function BattleScreen(props: Props): React.JSX.Element;
export {};
