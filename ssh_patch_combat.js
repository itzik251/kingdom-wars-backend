const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const HOST = '187.124.49.18', USER = 'root', PASS = 'j?UA.&ypMI0,MpbH';
const REMOTE = '/var/www/kingdom-wars/dist/modules/combat/combat.service.js';
const LOCAL_TMP = path.join(__dirname, '_combat_service_dist.js');

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) { console.error(err); conn.end(); return; }
    sftp.fastGet(REMOTE, LOCAL_TMP, (err) => {
      if (err) { console.error('Download error:', err); conn.end(); return; }
      console.log('Downloaded combat.service.js');

      let code = fs.readFileSync(LOCAL_TMP, 'utf8');

      // Check if already patched
      if (code.includes('language: defenderKingdomFull.user.language')) {
        console.log('Already patched!');
        fs.unlinkSync(LOCAL_TMP);
        conn.end();
        return;
      }

      // Find the attacked notification call and add language
      const oldPattern = `telegramId: defenderKingdomFull.user.telegramId,\n            }).catch`;
      const newPattern = `telegramId: defenderKingdomFull.user.telegramId,\n                language: defenderKingdomFull.user.language,\n            }).catch`;

      if (!code.includes('telegramId: defenderKingdomFull.user.telegramId,')) {
        // try without indentation assumptions
        code = code.replace(
          /telegramId:\s*defenderKingdomFull\.user\.telegramId,(\s*\})/,
          'telegramId: defenderKingdomFull.user.telegramId,\n                language: defenderKingdomFull.user.language,$1'
        );
      } else {
        code = code.replace(
          /telegramId:\s*defenderKingdomFull\.user\.telegramId,(\s*\})/,
          'telegramId: defenderKingdomFull.user.telegramId,\n                language: defenderKingdomFull.user.language,$1'
        );
      }

      if (!code.includes('language: defenderKingdomFull.user.language')) {
        console.log('❌ Pattern not found, showing context around telegramId:');
        const idx = code.indexOf('defenderKingdomFull.user.telegramId');
        console.log(code.substring(idx - 50, idx + 150));
        fs.unlinkSync(LOCAL_TMP);
        conn.end();
        return;
      }

      fs.writeFileSync(LOCAL_TMP, code);
      console.log('Patched locally');

      sftp.fastPut(LOCAL_TMP, REMOTE, (err) => {
        if (err) { console.error('Upload error:', err); conn.end(); return; }
        console.log('Uploaded patched combat.service.js');
        conn.exec('pm2 restart all 2>&1 | tail -3', (err, stream) => {
          stream.on('data', d => process.stdout.write(d.toString()));
          stream.on('close', () => {
            console.log('✅ Done!');
            fs.unlinkSync(LOCAL_TMP);
            conn.end();
          });
        });
      });
    });
  });
}).connect({ host: HOST, port: 22, username: USER, password: PASS, readyTimeout: 30000 });
