import { Controller, Post, Patch, Body, HttpException, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { IsString, IsOptional } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

class LoginDto {
  @IsString()
  initData: string;

  @IsString()
  @IsOptional()
  referralCode?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    try {
      return await this.authService.loginOrRegister(dto.initData, dto.referralCode);
    } catch (e) {
      console.error('Login error:', e?.message, e?.stack?.split('\n')[0]);
      throw new HttpException(
        { message: e?.message || 'Login failed', detail: e?.stack?.split('\n')[0] },
        e?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('language')
  @UseGuards(JwtAuthGuard)
  async setLanguage(@Request() req, @Body() body: { language: string }) {
    return this.authService.setLanguage(req.user.userId, body.language);
  }

  @Post('accept-terms')
  @UseGuards(JwtAuthGuard)
  async acceptTerms(@Request() req) {
    return this.authService.acceptTerms(req.user.userId);
  }
}
