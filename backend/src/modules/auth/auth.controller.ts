import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { IsString, IsOptional } from 'class-validator';
import { AuthService } from './auth.service';

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
}
