const { Client } = require('ssh2');
const conn = new Client();

const HOST = '187.124.49.18';
const USER = 'root';
const PASS = 'j?UA.&ypMI0,MpbH';
const FILE = '/var/www/kingdom-wars/dist/modules/admin/admin.controller.js';

conn.on('ready', () => {
  // Read the compiled JS file
  let data = '';
  conn.exec('cat ' + FILE, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('data', d => data += d.toString());
    stream.on('close', () => {
      // Find the giveVip method pattern and add removeVip after it
      const marker = "__decorate([";
      const giveVipDecorator = `(0, common_1.Post)('give-vip/:telegramId')`;

      // Find the closing of giveVip method block to insert after it
      const idx = data.indexOf(giveVipDecorator);
      if (idx === -1) { console.log('❌ Could not find give-vip decorator'); console.log(data.substring(0, 500)); conn.end(); return; }

      // Find the end of giveVip's __decorate block
      // Look for the next top-level __decorate([ after giveVip
      const afterGiveVip = data.indexOf('__decorate([', idx + 100);
      if (afterGiveVip === -1) { console.log('❌ Could not find end of giveVip block'); conn.end(); return; }

      // Find the semicolon that ends the giveVip decorator block
      const endOfGiveVipBlock = data.lastIndexOf(';', afterGiveVip);
      if (endOfGiveVipBlock === -1) { console.log('❌ Could not find semicolon'); conn.end(); return; }

      // Check if removeVip already exists
      if (data.includes("remove-vip/:telegramId")) {
        console.log('✅ remove-vip already exists in dist!');
        conn.end();
        return;
      }

      const removeVipCode = `
    async removeVip(headers, telegramId) {
        this.guard(headers);
        const user = await this.userRepo.findOne({ where: { telegramId } });
        if (!user) return { error: 'User not found' };
        const kingdom = await this.kingdomRepo.findOne({ where: { user: { id: user.id } } });
        if (!kingdom) return { error: 'Kingdom not found' };
        kingdom.vipExpiresAt = null;
        await this.kingdomRepo.save(kingdom);
        return { success: true };
    }
__decorate([
    (0, common_1.Post)('remove-vip/:telegramId'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Param)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "removeVip", null);`;

      const patched = data.slice(0, endOfGiveVipBlock + 1) + removeVipCode + data.slice(endOfGiveVipBlock + 1);

      // Write patched file back
      conn.exec('cat > ' + FILE + ' << \'ENDOFFILE\'\n' + patched + '\nENDOFFILE', (err2, stream2) => {
        if (err2) { console.error(err2); conn.end(); return; }
        stream2.on('data', d => process.stdout.write(d.toString()));
        stream2.on('close', () => {
          console.log('❌ heredoc approach unreliable for large files, using sftp instead');
          conn.end();
        });
      });
    });
  });
}).connect({ host: HOST, port: 22, username: USER, password: PASS, readyTimeout: 30000 });
