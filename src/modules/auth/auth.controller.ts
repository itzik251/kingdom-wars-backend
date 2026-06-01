import { Controller, Post, Body } from '@nestjs/common';
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
  login(@Body() dto: LoginDto) {
    return this.authService.loginOrRegister(dto.initData, dto.referralCode);
  }
}
