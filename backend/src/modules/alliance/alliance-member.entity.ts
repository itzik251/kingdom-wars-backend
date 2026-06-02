import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, CreateDateColumn } from 'typeorm';
import { Alliance } from './alliance.entity';
import { Kingdom } from '../kingdom/kingdom.entity';

export enum AllianceRole {
  LEADER  = 'leader',
  OFFICER = 'officer',
  MEMBER  = 'member',
}

@Entity('alliance_members')
export class AllianceMember {
  @PrimaryColumn({ name: 'alliance_id' })
  allianceId: string;

  @PrimaryColumn({ name: 'kingdom_id' })
  kingdomId: string;

  @ManyToOne(() => Alliance)
  @JoinColumn({ name: 'alliance_id' })
  alliance: Alliance;

  @ManyToOne(() => Kingdom)
  @JoinColumn({ name: 'kingdom_id' })
  kingdom: Kingdom;

  @Column({ type: 'varchar', default: AllianceRole.MEMBER })
  role: AllianceRole;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;
}
