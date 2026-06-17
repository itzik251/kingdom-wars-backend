export declare enum AuditAction {
    BUILD = "build",
    UPGRADE = "upgrade",
    TRAIN_UNITS = "train_units",
    SPEND_GEMS = "spend_gems",
    SPEND_GOLD = "spend_gold",
    SPEND_USDT = "spend_usdt",
    EARN_USDT = "earn_usdt",
    COMBAT = "combat",
    WITHDRAW = "withdraw",
    BUY_SHIELD = "buy_shield",
    BUY_VIP = "buy_vip",
    EXPAND_STORAGE = "expand_storage",
    HIRE_WORKER = "hire_worker"
}
export declare class AuditLog {
    id: string;
    userId: string;
    kingdomId: string;
    action: AuditAction;
    details: Record<string, any>;
    createdAt: Date;
}
