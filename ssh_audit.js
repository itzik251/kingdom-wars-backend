const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('Connected to server');

  // Step 1: Get line counts of all dist module JS files
  conn.exec('find /var/www/kingdom-wars/dist/src/modules -name "*.js" ! -name "*.map" | sort | xargs wc -l 2>/dev/null', (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('data', (data) => { output += data; });
    stream.stderr.on('data', (data) => { process.stderr.write(data); });
    stream.on('close', () => {
      console.log('\n=== LINE COUNTS ===');
      console.log(output);

      // Step 2: Check specific files for key methods
      const checks = [
        {
          file: '/var/www/kingdom-wars/dist/src/modules/notifications/notification.service.js',
          methods: ['sendTelegram', 'create', 'getUnread', 'markRead', 'fetch.*telegram']
        },
        {
          file: '/var/www/kingdom-wars/dist/src/modules/auth/auth.service.js',
          methods: ['validateUser', 'login', 'register', 'validateToken']
        },
        {
          file: '/var/www/kingdom-wars/dist/src/modules/economy/economy.service.js',
          methods: ['tickKingdom', 'tickAllKingdoms', 'getProductionRates']
        },
        {
          file: '/var/www/kingdom-wars/dist/src/modules/combat/combat.service.js',
          methods: ['attack', 'resolveCombat', 'calculateStrength']
        },
        {
          file: '/var/www/kingdom-wars/dist/src/modules/building/building.service.js',
          methods: ['upgrade', 'build', 'getBuildings']
        },
        {
          file: '/var/www/kingdom-wars/dist/src/modules/leaderboard/leaderboard.service.js',
          methods: ['getLeaderboard', 'updateScore', 'getRank']
        },
        {
          file: '/var/www/kingdom-wars/dist/src/modules/telegram/telegram.service.js',
          methods: ['sendMessage', 'sendNotification', 'handleWebhook']
        },
        {
          file: '/var/www/kingdom-wars/dist/src/modules/kingdom/kingdom.service.js',
          methods: ['createKingdom', 'getKingdom', 'updateResources']
        },
        {
          file: '/var/www/kingdom-wars/dist/src/modules/vip/vip.service.js',
          methods: ['getVipStatus', 'upgradeVip', 'checkVip']
        },
        {
          file: '/var/www/kingdom-wars/dist/src/modules/admin/admin.controller.js',
          methods: ['getUsers', 'getDashboard', 'takeResource']
        }
      ];

      let checkIndex = 0;

      function runNextCheck() {
        if (checkIndex >= checks.length) {
          conn.end();
          return;
        }

        const check = checks[checkIndex++];
        const grepPattern = check.methods.join('\\|');
        const cmd = `echo "=== ${check.file} ===" && wc -l ${check.file} 2>/dev/null && grep -n "${grepPattern}" ${check.file} 2>/dev/null || echo "FILE NOT FOUND OR NO MATCHES"`;

        conn.exec(cmd, (err2, stream2) => {
          if (err2) { runNextCheck(); return; }
          let out = '';
          stream2.on('data', (d) => { out += d; });
          stream2.stderr.on('data', (d) => { out += d; });
          stream2.on('close', () => {
            console.log('\n' + out);
            runNextCheck();
          });
        });
      }

      runNextCheck();
    });
  });
}).connect({
  host: '187.124.49.18',
  port: 22,
  username: 'root',
  password: 'j?UA.&ypMI0,MpbH',
  readyTimeout: 30000
});

conn.on('error', (err) => {
  console.error('Connection error:', err.message);
});
