import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Alliance } from '../alliance/alliance.entity';

export type ResourceType = 'gold' | 'wood' | 'stone' | 'food';
export type TradeStatus = 'open' | 'accepted' | 'cancelled';

@Entity('trade_offers')
export class TradeOffer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'alliance_id' })
  allianceId: string;

  @ManyToOne(() => Alliance)
  @JoinColumn({ name: 'alliance_id' })
  alliance: Alliance;

  @Column({ name: 'offerer_kingdom_id' })
  offererKingdomId: string;

  @ManyToOne(() => Kingdom)
  @JoinColumn({ name: 'offerer_kingdom_id' })
  offererKingdom: Kingdom;

  @Column({ name: 'give_type', type: 'varchar' })
  giveType: ResourceType;

  @Column({ name: 'give_amount', type: 'int' })
  giveAmount: number;

  @Column({ name: 'want_type', type: 'varchar' })
  wantType: ResourceType;

  @Column({ name: 'want_amount', type: 'int' })
  wantAmount: number;

  @Column({ type: 'varchar', default: 'open' })
  status: TradeStatus;

  @Column({ name: 'accepter_kingdom_id', nullable: true })
  accepterKingdomId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
