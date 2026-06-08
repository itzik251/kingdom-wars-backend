const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');
const HOST = '187.124.49.18', USER = 'root', PASS = 'j?UA.&ypMI0,MpbH';

// New referral service JS
const REFERRAL_SERVICE_JS = `"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../user/user.entity");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");

function calcRewards(from, to) {
    let gems = 0, skins = 0, vipDays = 0;
    for (let i = from + 1; i <= to; i++) {
        gems += 100;
        if (i % 5 === 0) gems += 200;
        if (i % 10 === 0) skins++;
        if (i % 20 === 0) vipDays += 30;
    }
    return { gems, skins, vipDays };
}

let ReferralService = class ReferralService {
    constructor(userRepo, kingdomRepo) {
        this.userRepo = userRepo;
        this.kingdomRepo = kingdomRepo;
    }
    async getActiveReferralCount(userId) {
        const referredUsers = await this.userRepo.find({ where: { referredBy: { id: userId } } });
        let count = 0;
        for (const u of referredUsers) {
            const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: u.id } } });
            if (kingdom && kingdom.score > 0) count++;
        }
        return count;
    }
    async getStats(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        const referredCount = await this.getActiveReferralCount(userId);
        const claimedCount = user.referralClaimedCount ?? 0;
        const pending = calcRewards(claimedCount, referredCount);
        const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'KingdomWarsBot';
        const link = \`https://t.me/\${botUsername}?start=ref_\${user.referralCode}\`;
        return {
            referralCode: user.referralCode,
            link,
            referredCount,
            claimedCount,
            pendingRewards: pending,
            hasPending: pending.gems > 0 || pending.skins > 0 || pending.vipDays > 0,
            milestones: [],
        };
    }
    async claimRewards(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        const referredCount = await this.getActiveReferralCount(userId);
        const claimedCount = user.referralClaimedCount ?? 0;
        if (referredCount <= claimedCount) return { claimed: false, reason: 'no_pending' };
        const { gems, skins, vipDays } = calcRewards(claimedCount, referredCount);
        user.referralClaimedCount = referredCount;
        await this.userRepo.save(user);
        const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: userId } } });
        if (!kingdom) return { claimed: false, reason: 'no_kingdom' };
        if (gems > 0) kingdom.gems += gems;
        if (vipDays > 0) {
            const expiresAt = new Date(Math.max(Date.now(), kingdom.vipExpiresAt?.getTime() ?? 0) + vipDays * 86400000);
            kingdom.vipExpiresAt = expiresAt;
        }
        await this.kingdomRepo.save(kingdom);
        return { claimed: true, gems, skins, vipDays, newClaimedCount: referredCount };
    }
    async claimMilestone(userId, _milestoneCount) {
        return this.claimRewards(userId);
    }
};
exports.ReferralService = ReferralService;
exports.ReferralService = ReferralService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(kingdom_entity_1.Kingdom)),
    __metadata("design:paramtypes", [typeorm_2.Repository, typeorm_2.Repository])
], ReferralService);
//# sourceMappingURL=referral.service.js.map
`;

const REFERRAL_CONTROLLER_JS = `"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const referral_service_1 = require("./referral.service");
let ReferralController = class ReferralController {
    constructor(referralService) { this.referralService = referralService; }
    getStats(req) { return this.referralService.getStats(req.user.userId); }
    claimAll(req) { return this.referralService.claimRewards(req.user.userId); }
    claim(req, count) { return this.referralService.claimRewards(req.user.userId); }
};
exports.ReferralController = ReferralController;
__decorate([(0, common_1.Get)(), __param(0, (0, common_1.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], ReferralController.prototype, "getStats", null);
__decorate([(0, common_1.Post)('claim'), __param(0, (0, common_1.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], ReferralController.prototype, "claimAll", null);
__decorate([(0, common_1.Post)('claim/:count'), __param(0, (0, common_1.Request)()), __param(1, (0, common_1.Param)('count')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String]), __metadata("design:returntype", void 0)], ReferralController.prototype, "claim", null);
exports.ReferralController = ReferralController = __decorate([(0, common_1.Controller)('referral'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), __metadata("design:paramtypes", [referral_service_1.ReferralService])], ReferralController);
//# sourceMappingURL=referral.controller.js.map
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp(async (err, sftp) => {
    // 1. Upload frontend
    for (const [l, r] of [
      ['frontend/dist/index.html', '/var/www/kingdom-wars/public/index.html'],
      ['frontend/dist/assets/index-D3Yw00va.css', '/var/www/kingdom-wars/public/assets/index-D3Yw00va.css'],
      ['frontend/dist/assets/index-W5J63V8r.js', '/var/www/kingdom-wars/public/assets/index-W5J63V8r.js'],
    ]) {
      await new Promise((res, rej) => sftp.fastPut(path.join(__dirname, l), r, e => e ? rej(e) : res()));
      console.log('✅ frontend:', require('path').basename(l));
    }

    // 2. Upload backend src files
    for (const [l, r] of [
      ['src/modules/referral/referral.service.ts', '/var/www/kingdom-wars/src/modules/referral/referral.service.ts'],
      ['src/modules/referral/referral.controller.ts', '/var/www/kingdom-wars/src/modules/referral/referral.controller.ts'],
      ['src/modules/user/user.entity.ts', '/var/www/kingdom-wars/src/modules/user/user.entity.ts'],
    ]) {
      await new Promise((res, rej) => sftp.fastPut(path.join(__dirname, l), r, e => e ? rej(e) : res()));
      console.log('✅ src:', require('path').basename(l));
    }

    // 3. Upload dist files
    const TMP = path.join(__dirname, '_tmp_ref.js');
    fs.writeFileSync(TMP, REFERRAL_SERVICE_JS);
    await new Promise((res, rej) => sftp.fastPut(TMP, '/var/www/kingdom-wars/dist/modules/referral/referral.service.js', e => e ? rej(e) : res()));
    fs.writeFileSync(TMP, REFERRAL_CONTROLLER_JS);
    await new Promise((res, rej) => sftp.fastPut(TMP, '/var/www/kingdom-wars/dist/modules/referral/referral.controller.js', e => e ? rej(e) : res()));
    fs.unlinkSync(TMP);
    console.log('✅ dist referral files uploaded');

    // 4. DB migration - add referral_claimed_count column
    await new Promise(res => {
      conn.exec(`PGPASSWORD=kw_secure_2026 psql -h localhost -U kw_user -d kingdom_wars << 'SQL'
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_claimed_count INTEGER NOT NULL DEFAULT 0;
SQL`, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => { console.log('✅ DB migration done'); res(null); });
      });
    });

    // 5. Restart
    await new Promise(res => {
      conn.exec('pm2 restart all 2>&1 | tail -3', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => res(null));
      });
    });

    console.log('\n✅ All done!');
    conn.end();
  });
}).connect({ host: HOST, port: 22, username: USER, password: PASS, readyTimeout: 60000 });
