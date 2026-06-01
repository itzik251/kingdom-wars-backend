import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid') id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar' }) type: string;

  @Column({ type: 'simple-json', default: '{}' }) payload: Record<string, any>;

  @Column({ default: false }) read: boolean;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
