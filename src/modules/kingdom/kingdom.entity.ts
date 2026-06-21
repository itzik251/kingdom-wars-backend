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

  @Column({ name: 'shield_expired_notified_at', nullable: true })
  shieldExpiredNotifiedAt: Date;

  @Column({ default: 0 })
  score: number;

  @Column({ name: 'win_streak', default: 0 })
  winStreak: number;

  @Column({ name: 'last_resource_tick', nullable: true })
  lastResourceTick: Date;

  @Column({ name: 'last_attack_at', nullable: true })
  lastAttackAt: Date;

  @Column({ name: 'production_boost_until', nullable: true })
  productionBoostUntil: Date;

  @Column({ name: 'vip_expires_at', nullable: true })
  vipExpiresAt: Date;

  @Column({ name: 'ads_watched_today', default: 0 })
  adsWatchedToday: number;

  @Column({ name: 'ads_watched_date', nullable: true })
  adsWatchedDate: string; // ISO date string like '2024-01-15'

  @Column({ default: 0 })
  workers: number;

  @Column({ name: 'max_workers', default: 5 })
  maxWorkers: number;

  @Column({ name: 'usdt_balance', type: 'float', default: 0 })
  usdtBalance: number;

  @Column({ name: 'game_balance', type: 'float', default: 0 })
  gameBalance: number;

  @Column({ name: 'attack_speed_boost_until', nullable: true })
  attackSpeedBoostUntil: Date;

  @Column({ name: 'storage_boost_until', nullable: true })
  storageBoostUntil: Date;

  @Column({ name: 'withdrawal_wallet', nullable: true })
  withdrawalWallet: string;

  @Column({ name: 'withdrawal_pending', type: 'float', default: 0 })
  withdrawalPending: number;

  @Column({ name: 'withdrawal_status', default: 'none' }) // 'none' | 'pending' | 'approved' | 'rejected'
  withdrawalStatus: string;

  @Column({ name: 'ragnar_hero_granted_count', default: 0 })
  ragnarHeroGrantedCount: number;

  @Column({ default: 0 })
  magic: number;

  @Column({ name: 'max_magic', default: 1000 })
  maxMagic: number;

  @Column({ name: 'explorer_count', default: 0 })
  explorerCount: number;

  @Column({ name: 'explorer_training_ends_at', nullable: true })
  explorerTrainingEndsAt: Date;

  @Column({ name: 'explorer_training_count', default: 0 })
  explorerTrainingCount: number;

  @Column({ name: 'explorer_training_queue', type: 'text', nullable: true })
  explorerTrainingQueueJson: string;

  // Strike system
  @Column({ name: 'strike_started_at', nullable: true })
  strikeStartedAt: Date;

  @Column({ name: 'strike_notified_at', nullable: true })
  strikeNotifiedAt: Date;

  @Column({ name: 'strike_removal_notified_at', nullable: true })
  strikeRemovalNotifiedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  get isShielded(): boolean {
    return this.shieldUntil && new Date() < new Date(this.shieldUntil);
  }

  get isVip(): boolean {
    return this.vipExpiresAt && new Date() < new Date(this.vipExpiresAt);
  }
}
