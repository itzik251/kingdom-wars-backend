import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum AuditAction {
  BUILD          = 'build',
  UPGRADE        = 'upgrade',
  TRAIN_UNITS    = 'train_units',
  SPEND_GEMS     = 'spend_gems',
  SPEND_GOLD     = 'spend_gold',
  SPEND_USDT     = 'spend_usdt',
  EARN_USDT      = 'earn_usdt',
  COMBAT         = 'combat',
  WITHDRAW       = 'withdraw',
  BUY_SHIELD     = 'buy_shield',
  BUY_VIP        = 'buy_vip',
  EXPAND_STORAGE = 'expand_storage',
  HIRE_WORKER    = 'hire_worker',
  EXCHANGE_GEMS  = 'exchange_gems',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'kingdom_id', nullable: true })
  kingdomId: string;

  @Column({ type: 'varchar' })
  action: AuditAction;

  @Column({ type: process.env.NODE_ENV === 'production' ? 'jsonb' : ('simple-json' as any), nullable: true })
  details: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
