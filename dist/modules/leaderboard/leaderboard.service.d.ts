import { Repository } from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';
export declare class LeaderboardService {
    private kingdomRepo;
    constructor(kingdomRepo: Repository<Kingdom>);
    getTop(limit?: number): Promise<Kingdom[]>;
}
