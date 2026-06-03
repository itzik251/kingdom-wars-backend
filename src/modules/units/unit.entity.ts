import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';

export enum UnitType {
  SPEARMAN     = 'spearman',
  ARCHER       = 'archer',
  SWORDSMAN    = 'swordsman',
  CAVALRY      = 'cavalry',
  CATAPULT     = 'catapult',
  ELITE_GUARD  = 'elite_guard',
  PALADIN      = 'paladin',
  DRAGON_RIDER = 'dragon_rider',
}

@Entity('units')
export class Unit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Kingdom)
  @JoinColumn({ name: 'kingdom_id' })
  kingdom: Kingdom;

  @Column({ type: 'varchar' })
  type: UnitType;

  @Column({ default: 0 })
  count: number;

  @Column({ name: 'training_count', default: 0 })
  trainingCount: number;

  @Column({ name: 'training_ends_at', nullable: true })
  trainingEndsAt: Date;

  @Column({ name: 'wounded_count', default: 0 })
  woundedCount: number;
}
