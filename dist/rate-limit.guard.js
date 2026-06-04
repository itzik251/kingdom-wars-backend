"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitGuard = exports.RateLimit = void 0;
const common_1 = require("@nestjs/common");

// Per-user rate limiter — NO DI needed, instantiated with new RateLimitGuard(max, windowSecs)
const limitMap = new Map();

class RateLimitGuard {
    constructor(maxRequests, windowSeconds) {
        this.maxRequests = maxRequests;
        this.windowSeconds = windowSeconds;
    }
    canActivate(ctx) {
        const req = ctx.switchToHttp().getRequest();
        const userId = req.user?.userId || req.ip || 'anon';
        const key = `${userId}:${req.method}:${req.route?.path || req.url}`;
        const now = Date.now();
        const entry = limitMap.get(key);
        if (!entry || now > entry.resetAt) {
            limitMap.set(key, { count: 1, resetAt: now + this.windowSeconds * 1000 });
            return true;
        }
        if (entry.count >= this.maxRequests) {
            const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
            throw new common_1.HttpException(
                `יותר מדי בקשות — נסה שוב בעוד ${retryAfter} שניות`,
                429
            );
        }
        entry.count++;
        return true;
    }
}
exports.RateLimitGuard = RateLimitGuard;

// Dummy decorator kept for compatibility (no longer needed but harmless)
function RateLimit(maxRequests, windowSeconds) {
    return () => {};
}
exports.RateLimit = RateLimit;

// Cleanup old entries every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [k, v] of limitMap.entries()) {
        if (now > v.resetAt) limitMap.delete(k);
    }
}, 600_000);
