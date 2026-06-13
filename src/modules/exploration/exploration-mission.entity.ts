import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum MissionStatus {
  ACTIVE   = 'active',
  RETURNED = 'returned',
}

@Entity('exploration_missions')
export class ExplorationMission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'kingdom_id' })
  kingdomId: string;

  @Column({ name: 'target_x' })
  targetX: number;

  @Column({ name: 'target_y' })
  targetY: number;

  @Column({ type: 'float' })
  distance: number;

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'returns_at' })
  returnsAt: Date;

  @Column({ type: 'varchar', default: MissionStatus.ACTIVE })
  status: MissionStatus;

  // Discovered node ids (filled on return)
  @Column({ name: 'discovered_node_ids', type: 'simple-array', nullable: true })
  discoveredNodeIds: string[];
}
