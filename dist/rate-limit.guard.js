"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitGuard = exports.RateLimit = void 0;
const common_1 = require("@nestjs/common");

// Per-user per-action rate limiter (in-memory)
const limitMap = new Map(); // key: "userId:action" -> { count, resetAt }

function RateLimit(maxRequests, windowSeconds) {
    return (0, common_1.SetMetadata)('rateLimit', { maxRequests, windowSeconds });
}
exports.RateLimit = RateLimit;

class RateLimitGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(ctx) {
        const meta = this.reflector.get('rateLimit', ctx.getHandler());
        if (!meta) return true;
        const req = ctx.switchToHttp().getRequest();
        const userId = req.user?.userId || req.ip;
        const action = `${userId}:${req.url}`;
        const now = Date.now();
        const entry = limitMap.get(action);
        if (!entry || now > entry.resetAt) {
            limitMap.set(action, { count: 1, resetAt: now + meta.windowSeconds * 1000 });
            return true;
        }
        if (entry.count >= meta.maxRequests) {
            throw new common_1.HttpException(
                `יותר מדי בקשות — נסה שוב בעוד ${Math.ceil((entry.resetAt - now) / 1000)} שניות`,
                429
            );
        }
        entry.count++;
        return true;
    }
}
exports.RateLimitGuard = RateLimitGuard;
RateLimitGuard.prototype['__guards__'] = true;

// Cleanup old entries every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [k, v] of limitMap.entries()) {
        if (now > v.resetAt) limitMap.delete(k);
    }
}, 600_000);
