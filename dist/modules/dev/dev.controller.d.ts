import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/user.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Building } from '../building/building.entity';
import { Unit } from '../units/unit.entity';
export declare class DevController {
    private config;
    private userRepo;
    private kingdomRepo;
    private buildingRepo;
    private unitRepo;
    constructor(config: ConfigService, userRepo: Repository<User>, kingdomRepo: Repository<Kingdom>, buildingRepo: Repository<Building>, unitRepo: Repository<Unit>);
    private guard;
    status(): {
        dev: boolean;
        users: string[];
    };
    seed(): Promise<{
        ok: boolean;
        results: string[];
    }>;
    boost(userIdx: string): Promise<{
        ok: boolean;
        error: string;
        message?: undefined;
    } | {
        ok: boolean;
        message: string;
        error?: undefined;
    }>;
}
