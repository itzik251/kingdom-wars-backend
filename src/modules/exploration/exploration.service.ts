import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { MapNode, MapNodeType } from './map-node.entity';
import { ExplorationMission, MissionStatus } from './exploration-mission.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Building, BuildingType } from '../building/building.entity';
import { Unit } from '../units/unit.entity';
import { UnitType } from '../units/unit.entity';
import { NotificationService } from '../notifications/notification.service';

// Academy level → max explorers
function maxExplorers(academyLevel: number): number {
  if (academyLevel >= 10) return 5;
  if (academyLevel >= 6)  return 3;
  if (academyLevel >= 3)  return 2;
  return 1;
}

// Academy level → training time in seconds
function explorerTrainingSecs(academyLevel: number, isVip: boolean): number {
  let secs: number;
  if (academyLevel >= 10) secs = 30 * 60;
  else if (academyLevel >= 6) secs = 60 * 60;
  else if (academyLevel >= 3) secs = 2 * 60 * 60;
  else secs = 4 * 60 * 60;
  return isVip ? Math.floor(secs * 0.75) : secs;
}

// Academy level → raid cooldown in days
function raidCooldownDays(academyLevel: number): number {
  if (academyLevel >= 10) return 1;
  if (academyLevel >= 6)  return 3;
  if (academyLevel >= 3)  return 5;
  return 7;
}

// Distance → mission duration in hours (0.5h per tile, min 1h, max 12h)
function missionHours(distance: number): number {
  return Math.min(12, Math.max(1, Math.round(distance * 0.5)));
}

// How many tiles each research-power level can see (fog radius)
export function fogRadius(explorerCount: number, academyLevel: number): number {
  const power = explorerCount * academyLevel;
  if (power >= 50) return 14;
  if (power >= 25) return 10;
  if (power >= 10) return 7;
  if (power >= 4)  return 5;
  if (power >= 1)  return 3;
  return 0; // no academy or no explorers → full fog
}

const EXPLORATION_HEROES = [UnitType.OGRE, UnitType.MAGE, UnitType.DWARF_FIGHTER];
const RESOURCE_TYPES = ['gold', 'wood', 'stone', 'food'];

// Deterministic seeded random (mulberry32)
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Generate the static map for a kingdom (deterministic from kingdomId)
export function generateKingdomMap(kingdomId: string): Omit<MapNode, 'id' | 'discovered' | 'discoveredAt' | 'lastRaidedAt'>[] {
  // Seed from kingdom id characters
  const seed = kingdomId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rand = seededRand(seed);
  const nodes: Omit<MapNode, 'id' | 'discovered' | 'discoveredAt' | 'lastRaidedAt'>[] = [];
  const MAP_RADIUS = 15;

  // Spread ~80 nodes across the map (excluding center 2 tiles = kingdom area)
  let heroesPlaced = 0;
  for (let attempt = 0; attempt < 300 && nodes.length < 80; attempt++) {
    const angle = rand() * Math.PI * 2;
    const dist = 3 + rand() * (MAP_RADIUS - 3); // min distance 3 from center
    const x = Math.round(Math.cos(angle) * dist);
    const y = Math.round(Math.sin(angle) * dist);

    // Avoid duplicates
    if (nodes.find(n => n.x === x && n.y === y)) continue;

    const r = rand();
    let type: MapNodeType;
    let resourceType: string | null = null;
    let amount = 0;
    let heroType: string | null = null;

    if (heroesPlaced < EXPLORATION_HEROES.length && r < 0.06) {
      // Place each hero type once
      type = MapNodeType.HERO;
      heroType = EXPLORATION_HEROES[heroesPlaced];
      heroesPlaced++;
    } else if (r < 0.12) {
      // Rare resource (magic)
      type = MapNodeType.RARE_RESOURCE;
      resourceType = 'magic';
      amount = Math.floor(200 + rand() * 800);
    } else {
      // Regular resource
      type = MapNodeType.RESOURCE;
      resourceType = RESOURCE_TYPES[Math.floor(rand() * RESOURCE_TYPES.length)];
      const distFactor = Math.sqrt(x * x + y * y) / MAP_RADIUS;
      amount = Math.floor((500 + rand() * 2000) * (1 + distFactor)); // farther = more loot
    }

    nodes.push({ kingdomId, x, y, type, resourceType, amount, heroType });
  }

  return nodes;
}

@Injectable()
export class ExplorationService {
  constructor(
    @InjectRepository(MapNode) private nodeRepo: Repository<MapNode>,
    @InjectRepository(ExplorationMission) private missionRepo: Repository<ExplorationMission>,
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
    @InjectRepository(Building) private buildingRepo: Repository<Building>,
    @InjectRepository(Unit) private unitRepo: Repository<Unit>,
    private notificationService: NotificationService,
  ) {}

  // ── Ensure map nodes exist for this kingdom ───────────────────────────────
  private async ensureMap(kingdomId: string): Promise<void> {
    const count = await this.nodeRepo.count({ where: { kingdomId } });
    if (count > 0) return;
    const nodes = generateKingdomMap(kingdomId);
    await this.nodeRepo.save(nodes.map(n => this.nodeRepo.create({ ...n, discovered: false })));
  }

  // ── Get map state for frontend ─────────────────────────────────────────────
  async getMap(kingdomId: string) {
    await this.ensureMap(kingdomId);
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    if (!kingdom) throw new BadRequestException('Kingdom not found');
    const academy = await this.buildingRepo.findOne({ where: { kingdom: { id: kingdomId }, type: BuildingType.ACADEMY } });
    const academyLevel = academy?.level ?? 0;
    const radius = fogRadius(kingdom.explorerCount, academyLevel);

    const allNodes = await this.nodeRepo.find({ where: { kingdomId } });
    const activeMissions = await this.missionRepo.find({
      where: { kingdomId, status: MissionStatus.ACTIVE },
    });
    const returnedMissions = await this.missionRepo.find({
      where: { kingdomId, status: MissionStatus.RETURNED },
      order: { startedAt: 'DESC' },
      take: 10,
    });

    // Visible nodes: discovered OR within fog radius
    const visibleNodes = allNodes
      .filter(n => n.discovered || (Math.sqrt(n.x * n.x + n.y * n.y) <= radius))
      .map(n => ({
        id: n.id,
        x: n.x,
        y: n.y,
        type: n.type,
        resourceType: n.resourceType,
        amount: n.amount,
        heroType: n.heroType,
        discovered: n.discovered,
        lastRaidedAt: n.lastRaidedAt,
        raidCooldownDays: raidCooldownDays(academyLevel),
        canRaid: this.canRaid(n, academyLevel),
      }));

    // Complete training if timer expired
    if (kingdom.explorerTrainingEndsAt && new Date() >= new Date(kingdom.explorerTrainingEndsAt)) {
      kingdom.explorerCount += 1;
      kingdom.explorerTrainingEndsAt = null;
      await this.kingdomRepo.save(kingdom);
    }

    return {
      fogRadius: radius,
      academyLevel,
      explorerCount: kingdom.explorerCount,
      maxExplorers: maxExplorers(academyLevel),
      explorerTrainingEndsAt: kingdom.explorerTrainingEndsAt ?? null,
      activeMissions,
      returnedMissions,
      nodes: visibleNodes,
      magic: kingdom.magic,
    };
  }

  // ── Hire explorer ─────────────────────────────────────────────────────────
  async hireExplorer(kingdomId: string) {
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    const academy = await this.buildingRepo.findOne({ where: { kingdom: { id: kingdomId }, type: BuildingType.ACADEMY } });

    if (!academy || academy.level < 1) throw new BadRequestException('Academy required');
    const max = maxExplorers(academy.level);
    const totalExplorers = kingdom.explorerCount + (kingdom.explorerTrainingEndsAt ? 1 : 0);
    if (totalExplorers >= max) throw new BadRequestException(`Max explorers for Academy level: ${max}`);
    if (kingdom.explorerTrainingEndsAt && new Date() < new Date(kingdom.explorerTrainingEndsAt)) {
      throw new BadRequestException('חוקר כבר באימון — המתן לסיום');
    }

    const COST_GOLD = 200;
    const COST_GEMS = 20;
    if (kingdom.gold < COST_GOLD) throw new BadRequestException('Not enough gold (200 required)');
    if ((kingdom.gems ?? 0) < COST_GEMS) throw new BadRequestException('Not enough gems (20 required)');

    kingdom.gold -= COST_GOLD;
    kingdom.gems = (kingdom.gems ?? 0) - COST_GEMS;

    const isVip = kingdom.vipExpiresAt && new Date() < new Date(kingdom.vipExpiresAt);
    const trainSecs = explorerTrainingSecs(academy.level, !!isVip);
    kingdom.explorerTrainingEndsAt = new Date(Date.now() + trainSecs * 1000);

    await this.kingdomRepo.save(kingdom);
    return {
      explorerCount: kingdom.explorerCount,
      maxExplorers: max,
      explorerTrainingEndsAt: kingdom.explorerTrainingEndsAt,
      trainingSecs: trainSecs,
    };
  }

  // ── Send explorer on mission ──────────────────────────────────────────────
  async sendMission(kingdomId: string, targetX: number, targetY: number) {
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    if (!kingdom) throw new BadRequestException('Kingdom not found');
    if (kingdom.explorerCount <= 0) throw new BadRequestException('No explorers available');

    // Check if all explorers are busy
    const activeCount = await this.missionRepo.count({ where: { kingdomId, status: MissionStatus.ACTIVE } });
    if (activeCount >= kingdom.explorerCount) throw new BadRequestException('All explorers are on missions');

    const distance = Math.sqrt(targetX * targetX + targetY * targetY);
    const hours = missionHours(distance);
    const returnsAt = new Date(Date.now() + hours * 3_600_000);

    const mission = this.missionRepo.create({
      kingdomId,
      targetX,
      targetY,
      distance,
      returnsAt,
      status: MissionStatus.ACTIVE,
    });
    await this.missionRepo.save(mission);
    return { mission, hoursUntilReturn: hours };
  }

  // ── Cron: complete finished missions ─────────────────────────────────────
  @Cron('*/5 * * * *')
  async completeMissions() {
    const now = new Date();
    const finished = await this.missionRepo.find({ where: { status: MissionStatus.ACTIVE } });
    for (const mission of finished) {
      if (now < new Date(mission.returnsAt)) continue;
      await this.processMissionReturn(mission);
    }
  }

  private discoveryParams(academyLevel: number): { chance: number; minNodes: number; maxNodes: number } {
    if (academyLevel >= 10) return { chance: 0.95, minNodes: 2, maxNodes: 3 };
    if (academyLevel >= 6)  return { chance: 0.80, minNodes: 1, maxNodes: 3 };
    if (academyLevel >= 3)  return { chance: 0.60, minNodes: 1, maxNodes: 2 };
    return { chance: 0.40, minNodes: 1, maxNodes: 1 };
  }

  private async processMissionReturn(mission: ExplorationMission) {
    await this.ensureMap(mission.kingdomId);
    const kingdom = await this.kingdomRepo.findOne({ where: { id: mission.kingdomId } });
    if (!kingdom) return;
    const academy = await this.buildingRepo.findOne({ where: { kingdom: { id: mission.kingdomId }, type: BuildingType.ACADEMY } });
    const academyLevel = academy?.level ?? 0;
    const radius = fogRadius(kingdom.explorerCount, academyLevel);

    const { chance, minNodes, maxNodes } = this.discoveryParams(academyLevel);
    const discoveredNodeIds: string[] = [];

    if (Math.random() < chance) {
      const DISCOVER_RADIUS = 3;
      const undiscovered = await this.nodeRepo.find({ where: { kingdomId: mission.kingdomId, discovered: false } });
      const nearby = undiscovered.filter(n => {
        const dx = n.x - mission.targetX;
        const dy = n.y - mission.targetY;
        return Math.sqrt(dx * dx + dy * dy) <= DISCOVER_RADIUS;
      });

      // Also discover everything within fog radius from center (passive)
      const inFogRange = undiscovered.filter(n => Math.sqrt(n.x * n.x + n.y * n.y) <= radius);

      // Limit nearby discoveries by academy level; fog-range always fully revealed
      const nodeCount = minNodes + Math.floor(Math.random() * (maxNodes - minNodes + 1));
      const shuffledNearby = nearby.sort(() => Math.random() - 0.5).slice(0, nodeCount);
      const toDiscover = [...new Map([...shuffledNearby, ...inFogRange].map(n => [n.id, n])).values()];

      if (toDiscover.length > 0) {
        for (const node of toDiscover) {
          node.discovered = true;
          node.discoveredAt = new Date();
        }
        await this.nodeRepo.save(toDiscover);
        discoveredNodeIds.push(...toDiscover.map(n => n.id));

        for (const node of toDiscover) {
          if (node.type === MapNodeType.HERO && node.heroType) {
            const existing = await this.unitRepo.findOne({
              where: { kingdom: { id: mission.kingdomId }, type: node.heroType as UnitType },
            });
            if (!existing) {
              const unit = this.unitRepo.create({
                kingdom: { id: mission.kingdomId },
                type: node.heroType as UnitType,
                count: 0,
                woundedCount: 0,
                trainingCount: 0,
              });
              await this.unitRepo.save(unit);
            }
          }
        }
      }
    }

    mission.status = MissionStatus.RETURNED;
    mission.discoveredNodeIds = discoveredNodeIds;
    await this.missionRepo.save(mission);

    // Push notification
    const kingdom2 = await this.kingdomRepo.findOne({ where: { id: mission.kingdomId }, relations: ['user'] });
    if (kingdom2?.user) {
      let foundNodes: { type: string; resourceType?: string; heroType?: string }[] = [];
      if (discoveredNodeIds.length > 0) {
        foundNodes = await this.nodeRepo.findByIds(discoveredNodeIds);
      }
      this.notificationService.create(kingdom2.user.id, 'explorer_returned', { foundNodes }).catch(() => {});
    }
  }

  // ── Raid a resource node ───────────────────────────────────────────────────
  async raidNode(kingdomId: string, nodeId: string) {
    const node = await this.nodeRepo.findOne({ where: { id: nodeId, kingdomId } });
    if (!node || !node.discovered) throw new BadRequestException('Node not found or not discovered');
    if (node.type === MapNodeType.HERO) throw new BadRequestException('Cannot raid a hero node');

    const academy = await this.buildingRepo.findOne({ where: { kingdom: { id: kingdomId }, type: BuildingType.ACADEMY } });
    if (!this.canRaid(node, academy?.level ?? 0)) {
      throw new BadRequestException('Raid cooldown not expired');
    }

    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    if (!kingdom) throw new BadRequestException('Kingdom not found');
    const gained: Record<string, number> = {};

    if (node.resourceType === 'magic') {
      const amt = Math.min(node.amount, kingdom.maxMagic - (kingdom.magic ?? 0));
      kingdom.magic = (kingdom.magic ?? 0) + amt;
      gained.magic = amt;
    } else if (node.resourceType === 'gold') {
      const amt = Math.min(node.amount, kingdom.maxGold - kingdom.gold);
      kingdom.gold += amt;
      gained.gold = amt;
    } else if (node.resourceType === 'wood') {
      const amt = Math.min(node.amount, kingdom.maxWood - kingdom.wood);
      kingdom.wood += amt;
      gained.wood = amt;
    } else if (node.resourceType === 'stone') {
      const amt = Math.min(node.amount, kingdom.maxStone - kingdom.stone);
      kingdom.stone += amt;
      gained.stone = amt;
    } else if (node.resourceType === 'food') {
      const amt = Math.min(node.amount, kingdom.maxFood - kingdom.food);
      kingdom.food += amt;
      gained.food = amt;
    }

    node.lastRaidedAt = new Date();
    await Promise.all([this.kingdomRepo.save(kingdom), this.nodeRepo.save(node)]);
    return { gained };
  }

  // ── Recruit a discovered hero ──────────────────────────────────────────────
  async recruitHero(kingdomId: string, nodeId: string) {
    const node = await this.nodeRepo.findOne({ where: { id: nodeId, kingdomId } });
    if (!node || !node.discovered || node.type !== MapNodeType.HERO || !node.heroType) {
      throw new BadRequestException('Hero node not found');
    }

    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    if (!kingdom) throw new BadRequestException('Kingdom not found');
    // Cost: gems only (from UNIT_STATS)
    const { UNIT_STATS } = await import('../../constants/game.constants');
    const stats = UNIT_STATS[node.heroType as UnitType];
    const cost = stats?.gemsCost ?? 150;
    if ((kingdom.gems ?? 0) < cost) throw new BadRequestException(`Not enough gems (need ${cost})`);

    kingdom.gems = (kingdom.gems ?? 0) - cost;
    await this.kingdomRepo.save(kingdom);

    let unit = await this.unitRepo.findOne({ where: { kingdom: { id: kingdomId }, type: node.heroType as UnitType } });
    if (!unit) {
      unit = this.unitRepo.create({ kingdom: { id: kingdomId }, type: node.heroType as UnitType, count: 0, woundedCount: 0, trainingCount: 0 });
    }
    unit.count += 1;
    await this.unitRepo.save(unit);
    return { heroType: node.heroType, count: unit.count };
  }

  private canRaid(node: MapNode, academyLevel: number): boolean {
    if (!node.discovered) return false;
    if (!node.lastRaidedAt) return true;
    const cooldownMs = raidCooldownDays(academyLevel) * 24 * 3_600_000;
    return Date.now() - new Date(node.lastRaidedAt).getTime() >= cooldownMs;
  }
}
