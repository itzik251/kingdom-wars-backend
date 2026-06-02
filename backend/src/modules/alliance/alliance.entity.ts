import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';

@Entity('alliances')
export class Alliance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true, length: 6 })
  tag: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Kingdom)
  @JoinColumn({ name: 'leader_id' })
  leader: Kingdom;

  @Column({ type: 'bigint', default: 0 })
  score: number;

  @Column({ name: 'max_members', type: 'smallint', default: 50 })
  maxMembers: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
