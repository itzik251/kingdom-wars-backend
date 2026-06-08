const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');

const HOST = '187.124.49.18', USER = 'root', PASS = 'j?UA.&ypMI0,MpbH';
const REMOTE = '/var/www/kingdom-wars/dist/modules/admin/admin.module.js';
const LOCAL_TMP = path.join(__dirname, '_admin_module_dist.js');

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) { console.error(err); conn.end(); return; }
    sftp.fastGet(REMOTE, LOCAL_TMP, (err) => {
      if (err) { console.error(err); conn.end(); return; }

      const fixed = `"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const admin_controller_1 = require("./admin.controller");
const tron_service_1 = require("./tron.service");
const user_entity_1 = require("../user/user.entity");
const kingdom_entity_1 = require("../kingdom/kingdom.entity");
const notification_module_1 = require("../notifications/notification.module");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, kingdom_entity_1.Kingdom]), notification_module_1.NotificationModule],
        controllers: [admin_controller_1.AdminController],
        providers: [tron_service_1.TronService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map
`;

      fs.writeFileSync(LOCAL_TMP, fixed);
      console.log('✅ Fixed locally');

      sftp.fastPut(LOCAL_TMP, REMOTE, (err) => {
        if (err) { console.error('Upload error:', err); conn.end(); return; }
        console.log('✅ Uploaded fixed admin.module.js');
        conn.exec('pm2 restart all 2>&1 | tail -5', (err, stream) => {
          stream.on('data', d => process.stdout.write(d.toString()));
          stream.on('close', () => {
            console.log('\n✅ Done!');
            fs.unlinkSync(LOCAL_TMP);
            conn.end();
          });
        });
      });
    });
  });
}).connect({ host: HOST, port: 22, username: USER, password: PASS, readyTimeout: 30000 });
