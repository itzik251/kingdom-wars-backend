import { Kingdom } from '../kingdom/kingdom.entity';
export declare class Alliance {
    id: string;
    name: string;
    tag: string;
    description: string;
    leader: Kingdom;
    score: number;
    maxMembers: number;
    createdAt: Date;
}
