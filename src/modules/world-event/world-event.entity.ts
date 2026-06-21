import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type WorldEventStatus = 'scheduled' | 'announced' | 'active' | 'finished';
export type EventChoice = 'fight' | 'shield' | 'none';

@Entity('world_events')
export class WorldEvent {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ default: 'barbarian_invasion' }) type: string;
  @Column({ default: 'announced' }) status: WorldEventStatus;
  @Column({ type: 'int', default: 0 }) barbarianPower: number;
  @Column({ type: 'int', default: 0 }) participantCount: number;
  @Column({ type: 'int', default: 0 }) winnersCount: number;
  @Column({ nullable: true }) announcedAt: Date;
  @Column() startsAt: Date;
  @Column() endsAt: Date;
  @Column({ default: false }) globalWin: boolean;
  @CreateDateColumn() createdAt: Date;
}

@Entity('world_event_registrations')
export class WorldEventRegistration {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() eventId: string;
  @Column() kingdomId: string;
  @Column({ default: 'none' }) choice: EventChoice;
  @Column({ type: 'int', default: 0 }) defenderPower: number;
  @Column({ type: 'int', default: 0 }) barbarianKills: number;
  @Column({ default: false }) won: boolean;
  @Column({ default: false }) rewardClaimed: boolean;
  @Column({ type: 'int', default: 0 }) gemReward: number;
  @Column({ type: 'int', default: 0 }) goldReward: number;
  @CreateDateColumn() createdAt: Date;
}
