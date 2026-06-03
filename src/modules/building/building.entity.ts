import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';

export enum BuildingType {
  TOWN_HALL    = 'town_hall',
  GOLD_MINE    = 'gold_mine',
  LUMBER_MILL  = 'lumber_mill',
  STONE_QUARRY = 'stone_quarry',
  FARM         = 'farm',
  BARRACKS     = 'barracks',
  ACADEMY      = 'academy',
  WALL         = 'wall',
  WATCH_TOWER  = 'watch_tower',
  HOSPITAL     = 'hospital',
  ARCANE_TOWER = 'arcane_tower',
}

@Entity('buildings')
export class Building {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Kingdom)
  @JoinColumn({ name: 'kingdom_id' })
  kingdom: Kingdom;

  @Column({ type: 'varchar' })
  type: BuildingType;

  @Column({ type: 'integer', default: 1 })
  level: number;

  @Column({ default: 0 })
  slot: number;

  @Column({ name: 'upgrade_ends_at', nullable: true })
  upgradeEndsAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  get isUpgrading(): boolean {
    return this.upgradeEndsAt && new Date() < new Date(this.upgradeEndsAt);
  }
}
