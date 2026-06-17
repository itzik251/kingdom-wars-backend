import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'paid';

@Entity('withdrawals')
export class Withdrawal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'float' })
  amount: number;

  @Column({ name: 'wallet_address' })
  walletAddress: string;

  @Column({ default: 'pending' })
  status: WithdrawalStatus;

  @Column({ name: 'tx_id', nullable: true })
  txId: string | null;

  @Column({ name: 'reject_reason', nullable: true })
  rejectReason: string | null;

  @Column({ name: 'admin_note', nullable: true })
  adminNote: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
