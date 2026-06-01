import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private notifService: NotificationService) {}

  @Get()
  getUnread(@Request() req) {
    return this.notifService.getUnread(req.user.userId);
  }

  @Post('read')
  markRead(@Request() req) {
    return this.notifService.markRead(req.user.userId);
  }
}
