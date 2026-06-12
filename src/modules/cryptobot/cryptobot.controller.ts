import { Controller, Post, Body, Request, UseGuards, Headers, Logger, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CryptoBotService } from './cryptobot.service';
import { VipService } from '../vip/vip.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kingdom } from '../kingdom/kingdom.entity';
import { VIP_DURATION_DAYS } from '../../constants/game.constants';
import { ConfigService } from '@nestjs/config';

// Track used invoice IDs to prevent replay attacks
const activatedInvoices = new Set<number>();

@Controller('cryptobot')
export class CryptoBotController {
  private readonly logger = new Logger(CryptoBotController.name);

  constructor(
    private cryptoBotService: CryptoBotService,
    private vipService: VipService,
    private config: ConfigService,
    @InjectRepository(Kingdom) private kingdomRepo: Repository<Kingdom>,
  ) {}

  /** Create a VIP invoice and return the payment URL */
  @Post('create-vip-invoice')
  @UseGuards(JwtAuthGuard)
  async createVipInvoice(@Request() req: any) {
    const invoice = await this.cryptoBotService.createVipInvoice(req.user.userId, 5);
    return {
      invoiceId: invoice.invoice_id,
      payUrl: invoice.mini_app_invoice_url || invoice.bot_invoice_url || invoice.pay_url,
      amount: '5 USDT',
      expiresIn: 3600,
    };
  }

  /** Poll to check if invoice was paid — call after user claims they paid */
  @Post('check-vip-payment')
  @UseGuards(JwtAuthGuard)
  async checkVipPayment(@Request() req: any, @Body() body: { invoiceId: number }) {
    const invoice = await this.cryptoBotService.getInvoice(body.invoiceId);
    if (!invoice) return { paid: false, reason: 'invoice_not_found' };
    if (invoice.status !== 'paid') return { paid: false, status: invoice.status };

    // Verify the payload belongs to this user
    const payloadUserId = invoice.payload?.split(':')?.[1];
    if (payloadUserId !== req.user.userId) {
      return { paid: false, reason: 'user_mismatch' };
    }

    // ── Replay protection: each invoice can only activate VIP once ───────────
    const invoiceId = Number(body.invoiceId);
    if (activatedInvoices.has(invoiceId)) {
      return { paid: true, vipActivated: false, reason: 'already_activated' };
    }
    activatedInvoices.add(invoiceId);

    const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: req.user.userId } } });
    if (!kingdom) return { paid: false, reason: 'kingdom_not_found' };

    const expiresAt = new Date(
      Math.max(Date.now(), kingdom.vipExpiresAt?.getTime() ?? 0) + VIP_DURATION_DAYS * 86_400_000,
    );
    await this.kingdomRepo.update({ id: kingdom.id }, { vipExpiresAt: expiresAt });
    this.logger.log(`VIP activated via check-vip-payment: userId=${req.user.userId} invoice=${invoiceId}`);
    return { paid: true, vipActivated: true, expiresAt };
  }

  /** CryptoBot webhook — called automatically when payment completes */
  @Post('webhook')
  async handleWebhook(@Body() body: any, @Headers() headers: any) {
    // ── Verify CryptoBot webhook signature ───────────────────────────────────
    // CryptoBot signs with HMAC-SHA256: key=SHA256(token), data=JSON body string
    const cryptoBotToken = this.config.get<string>('CRYPTO_BOT_TOKEN') || '';
    if (cryptoBotToken) {
      const receivedSig = headers['crypto-pay-api-signature'] || headers['Crypto-Pay-Api-Signature'] || '';
      if (!receivedSig) {
        this.logger.warn('CryptoBot webhook: missing signature header — rejected');
        throw new UnauthorizedException('Missing webhook signature');
      }
      const bodyStr = JSON.stringify(body);
      const secretKey = crypto.createHash('sha256').update(cryptoBotToken).digest();
      const expectedSig = crypto.createHmac('sha256', secretKey).update(bodyStr).digest('hex');
      if (!crypto.timingSafeEqual(Buffer.from(receivedSig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
        this.logger.warn('CryptoBot webhook: invalid signature — rejected');
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    if (body?.update_type === 'invoice_paid') {
      const invoice = body.payload as any;
      const invoiceId = Number(invoice?.invoice_id);
      const payload = invoice?.payload || '';

      // ── Replay protection ─────────────────────────────────────────────────
      if (activatedInvoices.has(invoiceId)) {
        this.logger.warn(`Duplicate webhook for invoice ${invoiceId} — ignored`);
        return { ok: true };
      }
      activatedInvoices.add(invoiceId);

      if (payload.startsWith('vip:')) {
        const userId = payload.split(':')?.[1];
        if (!userId) return { ok: true };

        const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: userId } } });
        if (!kingdom) return { ok: true };

        const expiresAt = new Date(
          Math.max(Date.now(), kingdom.vipExpiresAt?.getTime() ?? 0) + VIP_DURATION_DAYS * 86_400_000,
        );
        await this.kingdomRepo.update({ id: kingdom.id }, { vipExpiresAt: expiresAt });
        this.logger.log(`VIP activated via webhook: userId=${userId} invoice=${invoiceId}`);
      }
    }
    return { ok: true };
  }
}
