"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExplorationService = void 0;
exports.fogRadius = fogRadius;
exports.generateKingdomMap = generateKingdomMap;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const map_node_entity_1 = require("./map-node.entity");
const exploration_mission_entity_1 = require("./exploration-mission.entity");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const building_entity_1 = require("../building/building.entity");
const unit_entity_1 = require("../units/unit.entity");
const unit_entity_2 = require("../units/unit.entity");
function maxExplorers(academyLevel) {
    if (academyLevel >= 10)
        return 5;
    if (academyLevel >= 6)
        return 3;
    if (academyLevel >= 3)
        return 2;
    return 1;
}
function raidCooldownDays(academyLevel) {
    if (academyLevel >= 11)
        return 1;
    if (academyLevel >= 6)
        return 3;
    if (academyLevel >= 3)
        return 5;
    return 7;
}
function missionHours(distance) {
    return Math.min(12, Math.max(1, Math.round(distance * 0.5)));
}
function fogRadius(explorerCount, academyLevel) {
    const power = explorerCount * academyLevel;
    if (power >= 50)
        return 14;
    if (power >= 25)
        return 10;
    if (power >= 10)
        return 7;
    if (power >= 4)
        return 5;
    if (power >= 1)
        return 3;
    return 0;
}
const EXPLORATION_HEROES = [unit_entity_2.UnitType.OGRE, unit_entity_2.UnitType.MAGE, unit_entity_2.UnitType.DWARF_FIGHTER];
const RESOURCE_TYPES = ['gold', 'wood', 'stone', 'food'];
function seededRand(seed) {
    let s = seed;
    return () => {
        s |= 0;
        s = s + 0x6D2B79F5 | 0;
        let t = Math.imul(s ^ s >>> 15, 1 | s);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
function generateKingdomMap(kingdomId) {
    const seed = kingdomId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const rand = seededRand(seed);
    const nodes = [];
    const MAP_RADIUS = 15;
    let heroesPlaced = 0;
    for (let attempt = 0; attempt < 300 && nodes.length < 80; attempt++) {
        const angle = rand() * Math.PI * 2;
        const dist = 3 + rand() * (MAP_RADIUS - 3);
        const x = Math.round(Math.cos(angle) * dist);
        const y = Math.round(Math.sin(angle) * dist);
        if (nodes.find(n => n.x === x && n.y === y))
            continue;
        const r = rand();
        let type;
        let resourceType = null;
        let amount = 0;
        let heroType = null;
        if (heroesPlaced < EXPLORATION_HEROES.length && r < 0.06) {
            type = map_node_entity_1.MapNodeType.HERO;
            heroType = EXPLORATION_HEROES[heroesPlaced];
            heroesPlaced++;
        }
        else if (r < 0.12) {
            type = map_node_entity_1.MapNodeType.RARE_RESOURCE;
            resourceType = 'magic';
            amount = Math.floor(200 + rand() * 800);
        }
        else {
            type = map_node_entity_1.MapNodeType.RESOURCE;
            resourceType = RESOURCE_TYPES[Math.floor(rand() * RESOURCE_TYPES.length)];
            const distFactor = Math.sqrt(x * x + y * y) / MAP_RADIUS;
            amount = Math.floor((500 + rand() * 2000) * (1 + distFactor));
        }
        nodes.push({ kingdomId, x, y, type, resourceType, amount, heroType });
    }
    return nodes;
}
let ExplorationService = class ExplorationService {
    constructor(nodeRepo, missionRepo, kingdomRepo, buildingRepo, unitRepo) {
        this.nodeRepo = nodeRepo;
        this.missionRepo = missionRepo;
        this.kingdomRepo = kingdomRepo;
        this.buildingRepo = buildingRepo;
        this.unitRepo = unitRepo;
    }
    async ensureMap(kingdomId) {
        const count = await this.nodeRepo.count({ where: { kingdomId } });
        if (count > 0)
            return;
        const nodes = generateKingdomMap(kingdomId);
        await this.nodeRepo.save(nodes.map(n => this.nodeRepo.create({ ...n, discovered: false })));
    }
    async getMap(kingdomId) {
        await this.ensureMap(kingdomId);
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        const academy = await this.buildingRepo.findOne({ where: { kingdom: { id: kingdomId }, type: building_entity_1.BuildingType.ACADEMY } });
        const academyLevel = academy?.level ?? 0;
        const radius = fogRadius(kingdom.explorerCount, academyLevel);
        const allNodes = await this.nodeRepo.find({ where: { kingdomId } });
        const activeMissions = await this.missionRepo.find({
            where: { kingdomId, status: exploration_mission_entity_1.MissionStatus.ACTIVE },
        });
        const returnedMissions = await this.missionRepo.find({
            where: { kingdomId, status: exploration_mission_entity_1.MissionStatus.RETURNED },
            order: { startedAt: 'DESC' },
            take: 10,
        });
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
        return {
            fogRadius: radius,
            academyLevel,
            explorerCount: kingdom.explorerCount,
            maxExplorers: maxExplorers(academyLevel),
            activeMissions,
            returnedMissions,
            nodes: visibleNodes,
            magic: kingdom.magic,
        };
    }
    async hireExplorer(kingdomId) {
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        const academy = await this.buildingRepo.findOne({ where: { kingdom: { id: kingdomId }, type: building_entity_1.BuildingType.ACADEMY } });
        if (!academy || academy.level < 1)
            throw new common_1.BadRequestException('Academy required');
        const max = maxExplorers(academy.level);
        if (kingdom.explorerCount >= max)
            throw new common_1.BadRequestException(`Max explorers for Academy level: ${max}`);
        const COST_GOLD = 200;
        const COST_GEMS = 20;
        if (kingdom.gold < COST_GOLD)
            throw new common_1.BadRequestException('Not enough gold (200 required)');
        if ((kingdom.gems ?? 0) < COST_GEMS)
            throw new common_1.BadRequestException('Not enough gems (20 required)');
        kingdom.gold -= COST_GOLD;
        kingdom.gems = (kingdom.gems ?? 0) - COST_GEMS;
        kingdom.explorerCount += 1;
        await this.kingdomRepo.save(kingdom);
        return { explorerCount: kingdom.explorerCount, maxExplorers: max };
    }
    async sendMission(kingdomId, targetX, targetY) {
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        if (kingdom.explorerCount <= 0)
            throw new common_1.BadRequestException('No explorers available');
        const activeCount = await this.missionRepo.count({ where: { kingdomId, status: exploration_mission_entity_1.MissionStatus.ACTIVE } });
        if (activeCount >= kingdom.explorerCount)
            throw new common_1.BadRequestException('All explorers are on missions');
        const distance = Math.sqrt(targetX * targetX + targetY * targetY);
        const hours = missionHours(distance);
        const returnsAt = new Date(Date.now() + hours * 3_600_000);
        const mission = this.missionRepo.create({
            kingdomId,
            targetX,
            targetY,
            distance,
            returnsAt,
            status: exploration_mission_entity_1.MissionStatus.ACTIVE,
        });
        await this.missionRepo.save(mission);
        return { mission, hoursUntilReturn: hours };
    }
    async completeMissions() {
        const now = new Date();
        const finished = await this.missionRepo.find({ where: { status: exploration_mission_entity_1.MissionStatus.ACTIVE } });
        for (const mission of finished) {
            if (now < new Date(mission.returnsAt))
                continue;
            await this.processMissionReturn(mission);
        }
    }
    async processMissionReturn(mission) {
        await this.ensureMap(mission.kingdomId);
        const kingdom = await this.kingdomRepo.findOne({ where: { id: mission.kingdomId } });
        const academy = await this.buildingRepo.findOne({ where: { kingdom: { id: mission.kingdomId }, type: building_entity_1.BuildingType.ACADEMY } });
        const academyLevel = academy?.level ?? 0;
        const radius = fogRadius(kingdom.explorerCount, academyLevel);
        const DISCOVER_RADIUS = 3;
        const undiscovered = await this.nodeRepo.find({ where: { kingdomId: mission.kingdomId, discovered: false } });
        const nearby = undiscovered.filter(n => {
            const dx = n.x - mission.targetX;
            const dy = n.y - mission.targetY;
            return Math.sqrt(dx * dx + dy * dy) <= DISCOVER_RADIUS;
        });
        const inFogRange = undiscovered.filter(n => Math.sqrt(n.x * n.x + n.y * n.y) <= radius);
        const toDiscover = [...new Set([...nearby, ...inFogRange])];
        const discoveredNodeIds = [];
        if (toDiscover.length > 0) {
            for (const node of toDiscover) {
                node.discovered = true;
                node.discoveredAt = new Date();
            }
            await this.nodeRepo.save(toDiscover);
            discoveredNodeIds.push(...toDiscover.map(n => n.id));
            for (const node of toDiscover) {
                if (node.type === map_node_entity_1.MapNodeType.HERO && node.heroType) {
                    const existing = await this.unitRepo.findOne({
                        where: { kingdom: { id: mission.kingdomId }, type: node.heroType },
                    });
                    if (!existing) {
                        const unit = this.unitRepo.create({
                            kingdom: { id: mission.kingdomId },
                            type: node.heroType,
                            count: 0,
                            woundedCount: 0,
                            trainingCount: 0,
                        });
                        await this.unitRepo.save(unit);
                    }
                }
            }
        }
        mission.status = exploration_mission_entity_1.MissionStatus.RETURNED;
        mission.discoveredNodeIds = discoveredNodeIds;
        await this.missionRepo.save(mission);
    }
    async raidNode(kingdomId, nodeId) {
        const node = await this.nodeRepo.findOne({ where: { id: nodeId, kingdomId } });
        if (!node || !node.discovered)
            throw new common_1.BadRequestException('Node not found or not discovered');
        if (node.type === map_node_entity_1.MapNodeType.HERO)
            throw new common_1.BadRequestException('Cannot raid a hero node');
        const academy = await this.buildingRepo.findOne({ where: { kingdom: { id: kingdomId }, type: building_entity_1.BuildingType.ACADEMY } });
        if (!this.canRaid(node, academy?.level ?? 0)) {
            throw new common_1.BadRequestException('Raid cooldown not expired');
        }
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        const gained = {};
        if (node.resourceType === 'magic') {
            const amt = Math.min(node.amount, kingdom.maxMagic - (kingdom.magic ?? 0));
            kingdom.magic = (kingdom.magic ?? 0) + amt;
            gained.magic = amt;
        }
        else if (node.resourceType === 'gold') {
            const amt = Math.min(node.amount, kingdom.maxGold - kingdom.gold);
            kingdom.gold += amt;
            gained.gold = amt;
        }
        else if (node.resourceType === 'wood') {
            const amt = Math.min(node.amount, kingdom.maxWood - kingdom.wood);
            kingdom.wood += amt;
            gained.wood = amt;
        }
        else if (node.resourceType === 'stone') {
            const amt = Math.min(node.amount, kingdom.maxStone - kingdom.stone);
            kingdom.stone += amt;
            gained.stone = amt;
        }
        else if (node.resourceType === 'food') {
            const amt = Math.min(node.amount, kingdom.maxFood - kingdom.food);
            kingdom.food += amt;
            gained.food = amt;
        }
        node.lastRaidedAt = new Date();
        await Promise.all([this.kingdomRepo.save(kingdom), this.nodeRepo.save(node)]);
        return { gained };
    }
    async recruitHero(kingdomId, nodeId) {
        const node = await this.nodeRepo.findOne({ where: { id: nodeId, kingdomId } });
        if (!node || !node.discovered || node.type !== map_node_entity_1.MapNodeType.HERO || !node.heroType) {
            throw new common_1.BadRequestException('Hero node not found');
        }
        const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
        const { UNIT_STATS } = await Promise.resolve().then(() => require('../../constants/game.constants'));
        const stats = UNIT_STATS[node.heroType];
        const cost = stats?.gemsCost ?? 150;
        if ((kingdom.gems ?? 0) < cost)
            throw new common_1.BadRequestException(`Not enough gems (need ${cost})`);
        kingdom.gems = (kingdom.gems ?? 0) - cost;
        await this.kingdomRepo.save(kingdom);
        let unit = await this.unitRepo.findOne({ where: { kingdom: { id: kingdomId }, type: node.heroType } });
        if (!unit) {
            unit = this.unitRepo.create({ kingdom: { id: kingdomId }, type: node.heroType, count: 0, woundedCount: 0, trainingCount: 0 });
        }
        unit.count += 1;
        await this.unitRepo.save(unit);
        return { heroType: node.heroType, count: unit.count };
    }
    canRaid(node, academyLevel) {
        if (!node.discovered)
            return false;
        if (!node.lastRaidedAt)
            return true;
        const cooldownMs = raidCooldownDays(academyLevel) * 24 * 3_600_000;
        return Date.now() - new Date(node.lastRaidedAt).getTime() >= cooldownMs;
    }
};
exports.ExplorationService = ExplorationService;
__decorate([
    (0, schedule_1.Cron)('*/5 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExplorationService.prototype, "completeMissions", null);
exports.ExplorationService = ExplorationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(map_node_entity_1.MapNode)),
    __param(1, (0, typeorm_1.InjectRepository)(exploration_mission_entity_1.ExplorationMission)),
    __param(2, (0, typeorm_1.InjectRepository)(kingdom_entity_1.Kingdom)),
    __param(3, (0, typeorm_1.InjectRepository)(building_entity_1.Building)),
    __param(4, (0, typeorm_1.InjectRepository)(unit_entity_1.Unit)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ExplorationService);
//# sourceMappingURL=exploration.service.js.map