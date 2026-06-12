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
  KNIGHT       = 'knight',
  PALADIN      = 'paladin',
  DRAGON_RIDER = 'dragon_rider',
  RAGNAR       = 'ragnar',
  TITAN        = 'titan',
}

export const HERO_TYPES = new Set<UnitType>([
  UnitType.KNIGHT,
  UnitType.PALADIN,
  UnitType.DRAGON_RIDER,
  UnitType.RAGNAR,
  UnitType.TITAN,
]);

// Daily gem salary per hero type
export const HERO_SALARY_GEMS: Record<string, number> = {
  [UnitType.KNIGHT]:       0, // free starter hero — no salary
  [UnitType.PALADIN]:      3,
  [UnitType.DRAGON_RIDER]: 5,
  [UnitType.RAGNAR]:       2,
  [UnitType.TITAN]:        0, // purchased with real USDT — permanent, never leaves
};

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
