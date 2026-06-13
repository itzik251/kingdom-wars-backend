import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AntiBotService } from './antibot.service';
export declare const AntiBotAction: (action: string) => import("@nestjs/common").CustomDecorator<string>;
export declare class AntiBotGuard implements CanActivate {
    private antiBotService;
    private reflector;
    constructor(antiBotService: AntiBotService, reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
