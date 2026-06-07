export interface KingdomProfile {
    id: string;
    name: string;
    username?: string;
    score: number;
    isShielded: boolean;
    shieldUntil?: string | null;
    resources: {
        gold: number;
        wood: number;
        stone: number;
    };
    lootable: {
        gold: number;
        wood: number;
        stone: number;
    };
    defPower: number;
    myAttackPower: number;
    winChance: number;
    marchSeconds: number;
    wallLevel: number;
    armySize: number;
    buildings: {
        type: string;
        level: number;
    }[];
}
interface Props {
    kingdomId: string;
    onClose: () => void;
    onAttack: (profile: KingdomProfile) => void;
    attacking?: boolean;
}
export default function KingdomProfileSheet({ kingdomId, onClose, onAttack, attacking }: Props): import("react").JSX.Element;
export {};
