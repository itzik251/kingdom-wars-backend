import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'telegram_id', type: 'varchar', unique: true })
  telegramId: string;

  @Column({ nullable: true })
  username: string;

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ name: 'referral_code', unique: true })
  referralCode: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'referred_by' })
  referredBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'last_login', nullable: true })
  lastLogin: Date;

  @Column({ default: 'en' })
  language: string;

  @Column({ name: 'terms_accepted_at', nullable: true })
  termsAcceptedAt: Date;

  @Column({ name: 'claimed_referral_milestones', type: 'simple-array', default: '' })
  claimedReferralMilestones: number[];
}
