const { Client } = require('ssh2');

const config = {
  host: '187.124.49.18',
  port: 22,
  username: 'root',
  password: 'j?UA.&ypMI0,MpbH',
  readyTimeout: 30000,
};

const PG = 'PGPASSWORD=kw_secure_2026 psql -h localhost -U kw_user -d kingdom_wars';

function runCommands(commands) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    const results = [];
    let idx = 0;

    function runNext() {
      if (idx >= commands.length) {
        conn.end();
        resolve(results);
        return;
      }
      const { label, cmd } = commands[idx++];
      conn.exec(cmd, (err, stream) => {
        if (err) {
          results.push({ label, stdout: '', stderr: err.message, code: -1 });
          runNext();
          return;
        }
        let stdout = '';
        let stderr = '';
        stream.on('data', d => stdout += d.toString());
        stream.stderr.on('data', d => stderr += d.toString());
        stream.on('close', (code) => {
          results.push({ label, stdout: stdout.trim(), stderr: stderr.trim(), code });
          runNext();
        });
      });
    }

    conn.on('ready', runNext);
    conn.on('error', reject);
    conn.connect(config);
  });
}

async function main() {
  // First, get a real telegram_id
  const prep = await runCommands([
    {
      label: 'GET_TID',
      cmd: `${PG} -t -c "SELECT u.telegram_id FROM users u JOIN kingdoms k ON k.user_id=u.id LIMIT 1;"`
    }
  ]);

  const tidResult = prep[0].stdout.trim();
  const TID = tidResult.split('\n')[0].trim();
  console.log('=== REAL TELEGRAM_ID ===');
  console.log(TID);
  console.log('========================\n');

  const commands = [
    // Step 1: DB query
    {
      label: 'STEP 1 — DB: usdt_balance last 5 users',
      cmd: `${PG} -c "SELECT u.telegram_id, k.usdt_balance, k.vip_expires_at FROM kingdoms k JOIN users u ON u.id=k.user_id ORDER BY u.created_at DESC LIMIT 5;"`
    },
    // Step 2: Fix NaN
    {
      label: 'STEP 2 — DB: Fix NaN usdt_balance',
      cmd: `${PG} -c "UPDATE kingdoms SET usdt_balance=0 WHERE usdt_balance='NaN' OR usdt_balance IS NULL;"`
    },
    // Step 3: grep constants
    {
      label: 'STEP 3 — constants file grep',
      cmd: `grep -n "VIP_PRICE_USDT\\|PAYMENT_WALLET\\|VIP_PRICE_TON\\|VIP_DURATION" /var/www/kingdom-wars/dist/constants/game.constants.js`
    },
    // Step 4: admin controller giveVip
    {
      label: 'STEP 4 — admin.controller.js giveVip grep',
      cmd: `grep -n "giveVip\\|give-vip\\|VIP_DURATION" /var/www/kingdom-wars/dist/modules/admin/admin.controller.js | head -10`
    },
    // Step 5: call give-vip API
    {
      label: `STEP 5 — API give-vip for ${TID}`,
      cmd: `curl -s -X POST "http://localhost:3000/api/admin/give-vip/${TID}" -H 'Content-Type: application/json' -H 'x-admin-secret: kw_admin_2026' -d '{"days":30}'`
    },
    // Step 6: call give-resource usdt
    {
      label: `STEP 6 — API give-resource usdt for ${TID}`,
      cmd: `curl -s -X POST "http://localhost:3000/api/admin/give-resource/${TID}" -H 'Content-Type: application/json' -H 'x-admin-secret: kw_admin_2026' -d '{"type":"usdt","amount":10}'`
    },
    // Step 7: check DB after give usdt
    {
      label: `STEP 7 — DB: usdt_balance after give for ${TID}`,
      cmd: `${PG} -c "SELECT k.usdt_balance FROM kingdoms k JOIN users u ON u.id=k.user_id WHERE u.telegram_id='${TID}';"`
    },
    // Step 8: notification.service.js lines 130-185
    {
      label: 'STEP 8 — notification.service.js lines 130-185',
      cmd: `sed -n '130,185p' /var/www/kingdom-wars/dist/modules/notifications/notification.service.js`
    },
    // Step 9: admin_gift / notifService in admin.controller.js
    {
      label: 'STEP 9 — admin.controller.js admin_gift / notifService grep',
      cmd: `grep -n "admin_gift\\|notifService\\|NotificationService\\|sendTelegram" /var/www/kingdom-wars/dist/modules/admin/admin.controller.js | head -20`
    },
    // Step 10: pm2 error log
    {
      label: 'STEP 10 — pm2 error log (last 20 lines)',
      cmd: `tail -20 /root/.pm2/logs/kingdom-wars-error.log`
    },
  ];

  const results = await runCommands(commands);

  for (const r of results) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${r.label}`);
    console.log(`${'='.repeat(60)}`);
    if (r.stdout) {
      console.log('STDOUT:\n' + r.stdout);
    } else {
      console.log('STDOUT: (empty)');
    }
    if (r.stderr) {
      console.log('STDERR:\n' + r.stderr);
    }
    console.log(`Exit code: ${r.code}`);
  }
}

main().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
