import { UnitsService } from './units.service';
import { UnitType } from './unit.entity';
import { KingdomService } from '../kingdom/kingdom.service';
import { QuestService } from '../quest/quest.service';
declare class TrainDto {
    type: UnitType;
    amount: number;
}
export declare class UnitsController {
    private unitsService;
    private kingdomService;
    private questService;
    constructor(unitsService: UnitsService, kingdomService: KingdomService, questService: QuestService);
    train(req: any, dto: TrainDto): Promise<{
        unit: import("./unit.entity").Unit;
        trainingEndsAt: Date;
        durationSeconds: number;
    }>;
}
export {};
