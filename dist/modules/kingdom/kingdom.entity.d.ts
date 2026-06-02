import { User } from '../user/user.entity';
export declare class Kingdom {
    id: string;
    user: User;
    name: string;
    gold: number;
    wood: number;
    stone: number;
    food: number;
    gems: number;
    maxGold: number;
    maxWood: number;
    maxStone: number;
    maxFood: number;
    shieldUntil: Date;
    score: number;
    winStreak: number;
    lastResourceTick: Date;
    createdAt: Date;
    get isShielded(): boolean;
}
