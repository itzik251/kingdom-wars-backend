import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';

export enum QuestPeriod { DAILY = 'daily', WEEKLY = 'weekly' }

@Entity('quests')
@Unique(['kingdom', 'questKey', 'periodDate'])
export class Quest {
  @PrimaryGeneratedColumn('uuid') id: string;

  @ManyToOne(() => Kingdom)
  @JoinColumn({ name: 'kingdom_id' })
  kingdom: Kingdom;

  @Column({ name: 'quest_key' }) questKey: string;

  @Column({ type: 'varchar' }) period: QuestPeriod;

  @Column({ default: 0 }) progress: number;
  @Column() target: number;

  @Column({ default: false }) completed: boolean;
  @Column({ name: 'reward_claimed', default: false }) rewardClaimed: boolean;

  @Column({ name: 'period_date', type: 'date', default: () => 'CURRENT_DATE' })
  periodDate: string;
}
