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
  GIANT        = 'giant',
  // Exploration-discovered heroes
  OGRE         = 'ogre',
  MAGE         = 'mage',
  DWARF_FIGHTER = 'dwarf_fighter',
}

export const HERO_TYPES = new Set<UnitType>([
  UnitType.KNIGHT,
  UnitType.PALADIN,
  UnitType.DRAGON_RIDER,
  UnitType.RAGNAR,
  UnitType.TITAN,
  UnitType.GIANT,
  UnitType.OGRE,
  UnitType.MAGE,
  UnitType.DWARF_FIGHTER,
]);

// Heroes that require exploration discovery before they appear in army
export const EXPLORATION_HEROES = new Set<UnitType>([
  UnitType.OGRE,
  UnitType.MAGE,
  UnitType.DWARF_FIGHTER,
]);

// Daily gem salary per hero type
export const HERO_SALARY_GEMS: Record<string, number> = {
  [UnitType.KNIGHT]:       1,
  [UnitType.PALADIN]:      3,
  [UnitType.DRAGON_RIDER]: 5,
  [UnitType.RAGNAR]:       2,
  [UnitType.TITAN]:        0,
  [UnitType.GIANT]:        10,
  [UnitType.OGRE]:         4,
  [UnitType.MAGE]:         6,
  [UnitType.DWARF_FIGHTER]: 3,
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
