export interface KingdomProfile {
    id: string;
    name: string;
    username?: string;
    score: number;
    isShielded: boolean;
    shieldUntil?: string | null;
    usdtBalance?: number;
    resources: {
        gold: number;
        wood: number;
        stone: number;
    };
    lootable: {
        gold: number;
        wood: number;
        stone: number;
        gems: number;
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
export interface AttackSquad {
    heroType?: string;
    squad?: Record<string, number>;
}
interface Props {
    kingdomId: string;
    onClose: () => void;
    onAttack: (profile: KingdomProfile, squadOptions?: AttackSquad) => void;
    attacking?: boolean;
    marchCountdown?: number;
    sentSquad?: Record<string, number>;
}
export default function KingdomProfileSheet({ kingdomId, onClose, onAttack, attacking, marchCountdown, sentSquad }: Props): import("react").JSX.Element;
export {};
