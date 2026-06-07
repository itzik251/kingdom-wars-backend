import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private telegramService: TelegramService) {}

  // Webhook endpoint — Telegram calls this for every update
  @Post('webhook')
  handleWebhook(@Body() update: any) {
    this.telegramService.handleUpdate(update).catch(() => {});
    return { ok: true };
  }

  // Helper: register webhook URL
  @Get('set-webhook')
  setWebhook(@Query('url') url: string) {
    return this.telegramService.setWebhook(url);
  }

  // Helper: remove webhook (use polling instead)
  @Get('delete-webhook')
  deleteWebhook() {
    return this.telegramService.deleteWebhook();
  }

  // Register bot commands in the menu
  @Get('set-commands')
  setCommands() {
    return this.telegramService.setMyCommands();
  }
}
