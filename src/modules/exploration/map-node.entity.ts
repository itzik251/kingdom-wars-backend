import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum MapNodeType {
  RESOURCE    = 'resource',
  RARE_RESOURCE = 'rare_resource',
  HERO        = 'hero',
}

export enum RareResourceType {
  MAGIC = 'magic',
}

@Entity('map_nodes')
export class MapNode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'kingdom_id', nullable: true })
  kingdomId: string; // which kingdom generated this node (each kingdom has its own map)

  @Column()
  x: number;

  @Column()
  y: number;

  @Column({ type: 'varchar' })
  type: MapNodeType;

  // For resource / rare_resource nodes
  @Column({ name: 'resource_type', nullable: true })
  resourceType: string; // 'gold' | 'wood' | 'stone' | 'food' | 'magic'

  @Column({ default: 0 })
  amount: number;

  // For hero nodes
  @Column({ name: 'hero_type', nullable: true })
  heroType: string; // 'ogre' | 'mage' | 'dwarf_fighter'

  @Column({ name: 'discovered', default: false })
  discovered: boolean;

  @Column({ name: 'discovered_at', nullable: true })
  discoveredAt: Date;

  @Column({ name: 'last_raided_at', nullable: true })
  lastRaidedAt: Date;
}
