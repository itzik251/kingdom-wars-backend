import { AuthService } from './auth.service';
declare class LoginDto {
    initData: string;
    referralCode?: string;
}
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        token: string;
        userId: string;
    }>;
}
export {};
