const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const HOST = '187.124.49.18';
const USER = 'root';
const PASS = 'j?UA.&ypMI0,MpbH';
const REMOTE = '/var/www/kingdom-wars/dist/modules/admin/admin.controller.js';
const LOCAL_TMP = path.join(__dirname, '_admin_controller_dist.js');

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) { console.error(err); conn.end(); return; }

    // Download
    sftp.fastGet(REMOTE, LOCAL_TMP, (err) => {
      if (err) { console.error('Download error:', err); conn.end(); return; }
      console.log('✅ Downloaded dist/admin.controller.js');

      let code = fs.readFileSync(LOCAL_TMP, 'utf8');

      if (code.includes("'remove-vip/:telegramId'")) {
        console.log('✅ remove-vip already patched!');
        conn.end();
        return;
      }

      // Find the giveVip async method
      const giveVipMethodMatch = code.match(/async giveVip\(([^)]+)\)\s*\{[\s\S]*?return this\.giveResource[^}]+\}\s*\n/);
      if (!giveVipMethodMatch) {
        console.log('❌ Could not find giveVip method');
        console.log(code.substring(0, 300));
        conn.end();
        return;
      }

      const removeVipMethod = `
    async removeVip(headers, telegramId) {
        this.guard(headers);
        const user = await this.userRepo.findOne({ where: { telegramId } });
        if (!user)
            return { error: 'User not found' };
        const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: user.id } } });
        if (!kingdom)
            return { error: 'Kingdom not found' };
        kingdom.vipExpiresAt = null;
        await this.kingdomRepo.save(kingdom);
        return { success: true };
    }
`;

      // Insert removeVip method after giveVip method
      code = code.replace(
        giveVipMethodMatch[0],
        giveVipMethodMatch[0] + removeVipMethod
      );

      // Now find the giveVip __decorate block and add removeVip decorator after it
      // Pattern: find the decorator for giveVip and add removeVip decorator after the closing ];
      const giveVipDecorIdx = code.indexOf("'give-vip/:telegramId'");
      if (giveVipDecorIdx === -1) { console.log('❌ Could not find give-vip decorator'); conn.end(); return; }

      // Find the end of this __decorate block (the ], AdminController.prototype, "giveVip", null); line)
      const giveVipPrototypeEnd = code.indexOf('"giveVip", null);', giveVipDecorIdx);
      if (giveVipPrototypeEnd === -1) { console.log('❌ Could not find giveVip prototype end'); conn.end(); return; }
      const insertAt = giveVipPrototypeEnd + '"giveVip", null);'.length;

      const removeVipDecorator = `
__decorate([
    (0, common_1.Post)('remove-vip/:telegramId'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Param)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "removeVip", null);`;

      code = code.slice(0, insertAt) + removeVipDecorator + code.slice(insertAt);

      fs.writeFileSync(LOCAL_TMP, code);
      console.log('✅ Patched locally');

      // Upload back
      sftp.fastPut(LOCAL_TMP, REMOTE, (err) => {
        if (err) { console.error('Upload error:', err); conn.end(); return; }
        console.log('✅ Uploaded patched file');
        conn.exec('pm2 restart all 2>&1 | tail -3', (err, stream) => {
          stream.on('data', d => process.stdout.write(d.toString()));
          stream.on('close', () => { console.log('\n✅ Done!'); fs.unlinkSync(LOCAL_TMP); conn.end(); });
        });
      });
    });
  });
}).connect({ host: HOST, port: 22, username: USER, password: PASS, readyTimeout: 30000 });
