import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  OneToOne, JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('kingdoms')
export class Kingdom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ default: 'My Kingdom' })
  name: string;

  @Column({ default: 500 })
  gold: number;

  @Column({ default: 300 })
  wood: number;

  @Column({ default: 200 })
  stone: number;

  @Column({ default: 100 })
  food: number;

  @Column({ default: 50 })
  gems: number;

  @Column({ name: 'max_gold', default: 5000 })
  maxGold: number;

  @Column({ name: 'max_wood', default: 4000 })
  maxWood: number;

  @Column({ name: 'max_stone', default: 3000 })
  maxStone: number;

  @Column({ name: 'max_food', default: 2000 })
  maxFood: number;

  @Column({ name: 'shield_until', nullable: true })
  shieldUntil: Date;

  @Column({ default: 0 })
  score: number;

  @Column({ name: 'last_resource_tick', nullable: true })
  lastResourceTick: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  get isShielded(): boolean {
    return this.shieldUntil && new Date() < new Date(this.shieldUntil);
  }
}
