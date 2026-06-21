import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TradeOffer, ResourceType } from './trade-offer.entity';
import { Kingdom } from '../kingdom/kingdom.entity';
import { Building } from '../building/building.entity';
import { AllianceMember } from '../alliance/alliance-member.entity';

const ALLOWED: ResourceType[] = ['gold', 'wood', 'stone', 'food'];
const MAX_OPEN_OFFERS = 3;

@Injectable()
export class TradeService {
  constructor(
    @InjectRepository(TradeOffer) private offerRepo: Repository<TradeOffer>,
    @InjectRepository(Kingdom)    private kingdomRepo: Repository<Kingdom>,
    @InjectRepository(Building)   private buildingRepo: Repository<Building>,
    @InjectRepository(AllianceMember) private memberRepo: Repository<AllianceMember>,
  ) {}

  private async getKingdomAndAlliance(kingdomId: string) {
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    if (!kingdom) throw new BadRequestException('Kingdom not found');
    const member = await this.memberRepo.findOne({ where: { kingdomId } });
    if (!member) throw new BadRequestException('NOT_IN_ALLIANCE');
    return { kingdom, allianceId: member.allianceId };
  }

  private async getTownHallLevel(kingdomId: string): Promise<number> {
    const th = await this.buildingRepo.findOne({ where: { kingdom: { id: kingdomId }, type: 'town_hall' as any } });
    return th?.level ?? 1;
  }

  private maxTradeAmount(thLevel: number): number {
    return thLevel * 1000;
  }

  private getResource(kingdom: Kingdom, type: ResourceType): number {
    return (kingdom as any)[type] ?? 0;
  }

  private setResource(kingdom: Kingdom, type: ResourceType, value: number) {
    (kingdom as any)[type] = value;
  }

  async createOffer(kingdomId: string, giveType: ResourceType, giveAmount: number, wantType: ResourceType, wantAmount: number) {
    if (!ALLOWED.includes(giveType) || !ALLOWED.includes(wantType))
      throw new BadRequestException('INVALID_RESOURCE');
    if (giveType === wantType)
      throw new BadRequestException('SAME_RESOURCE');
    if (giveAmount <= 0 || wantAmount <= 0)
      throw new BadRequestException('INVALID_AMOUNT');

    const { kingdom, allianceId } = await this.getKingdomAndAlliance(kingdomId);
    const thLevel = await this.getTownHallLevel(kingdomId);
    const maxAmt = this.maxTradeAmount(thLevel);

    if (giveAmount > maxAmt || wantAmount > maxAmt)
      throw new BadRequestException(`MAX_AMOUNT_${maxAmt}`);

    const openCount = await this.offerRepo.count({ where: { offererKingdomId: kingdomId, status: 'open' } });
    if (openCount >= MAX_OPEN_OFFERS)
      throw new BadRequestException('TOO_MANY_OFFERS');

    const available = this.getResource(kingdom, giveType);
    if (available < giveAmount)
      throw new BadRequestException('NOT_ENOUGH_RESOURCES');

    // Lock resources immediately
    this.setResource(kingdom, giveType, available - giveAmount);
    await this.kingdomRepo.save(kingdom);

    const offer = this.offerRepo.create({ allianceId, offererKingdomId: kingdomId, giveType, giveAmount, wantType, wantAmount, status: 'open' });
    await this.offerRepo.save(offer);
    return offer;
  }

  async listOffers(kingdomId: string) {
    const { allianceId } = await this.getKingdomAndAlliance(kingdomId);
    const offers = await this.offerRepo.find({
      where: { allianceId, status: 'open' },
      relations: ['offererKingdom'],
      order: { createdAt: 'DESC' },
    });
    return offers.map(o => ({
      id: o.id,
      offererKingdomId: o.offererKingdomId,
      offererName: o.offererKingdom?.name ?? '?',
      giveType: o.giveType,
      giveAmount: o.giveAmount,
      wantType: o.wantType,
      wantAmount: o.wantAmount,
      createdAt: o.createdAt,
      isMine: o.offererKingdomId === kingdomId,
    }));
  }

  async acceptOffer(kingdomId: string, offerId: string) {
    const offer = await this.offerRepo.findOne({ where: { id: offerId } });
    if (!offer) throw new BadRequestException('OFFER_NOT_FOUND');
    if (offer.status !== 'open') throw new BadRequestException('OFFER_NOT_OPEN');
    if (offer.offererKingdomId === kingdomId) throw new BadRequestException('CANNOT_ACCEPT_OWN');

    const { allianceId } = await this.getKingdomAndAlliance(kingdomId);
    if (offer.allianceId !== allianceId) throw new BadRequestException('NOT_IN_ALLIANCE');

    const [accepter, offerer] = await Promise.all([
      this.kingdomRepo.findOne({ where: { id: kingdomId } }),
      this.kingdomRepo.findOne({ where: { id: offer.offererKingdomId } }),
    ]);

    const accepterHas = this.getResource(accepter, offer.wantType);
    if (accepterHas < offer.wantAmount) throw new BadRequestException('NOT_ENOUGH_RESOURCES');

    // Transfer: accepter pays wantAmount, receives giveAmount (already locked)
    this.setResource(accepter, offer.wantType, accepterHas - offer.wantAmount);
    this.setResource(accepter, offer.giveType, this.getResource(accepter, offer.giveType) + offer.giveAmount);
    // Offerer receives wantAmount
    this.setResource(offerer, offer.wantType, this.getResource(offerer, offer.wantType) + offer.wantAmount);

    offer.status = 'accepted';
    offer.accepterKingdomId = kingdomId;

    await Promise.all([
      this.kingdomRepo.save(accepter),
      this.kingdomRepo.save(offerer),
      this.offerRepo.save(offer),
    ]);

    return { ok: true };
  }

  async cancelOffer(kingdomId: string, offerId: string) {
    const offer = await this.offerRepo.findOne({ where: { id: offerId, offererKingdomId: kingdomId } });
    if (!offer) throw new BadRequestException('OFFER_NOT_FOUND');
    if (offer.status !== 'open') throw new BadRequestException('OFFER_NOT_OPEN');

    // Refund locked resources
    const kingdom = await this.kingdomRepo.findOne({ where: { id: kingdomId } });
    this.setResource(kingdom, offer.giveType, this.getResource(kingdom, offer.giveType) + offer.giveAmount);

    offer.status = 'cancelled';
    await Promise.all([this.kingdomRepo.save(kingdom), this.offerRepo.save(offer)]);
    return { ok: true };
  }
}
