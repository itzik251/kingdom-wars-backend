const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('Connected');

  const commands = [
    // leaderboard service - check what's in it
    'echo "=== LEADERBOARD SERVICE ===" && cat /var/www/kingdom-wars/dist/src/modules/leaderboard/leaderboard.service.js',
    // vip service - check what's in it
    'echo "=== VIP SERVICE ===" && cat /var/www/kingdom-wars/dist/src/modules/vip/vip.service.js',
    // admin controller - check what's in it
    'echo "=== ADMIN CONTROLLER ===" && cat /var/www/kingdom-wars/dist/src/modules/admin/admin.controller.js',
    // auth service - check key methods
    'echo "=== AUTH SERVICE grep ===" && grep -n "async " /var/www/kingdom-wars/dist/src/modules/auth/auth.service.js',
    // kingdom service - check key methods
    'echo "=== KINGDOM SERVICE grep ===" && grep -n "async " /var/www/kingdom-wars/dist/src/modules/kingdom/kingdom.service.js',
    // notification service - full grep of async methods
    'echo "=== NOTIFICATION SERVICE grep ===" && grep -n "async " /var/www/kingdom-wars/dist/src/modules/notifications/notification.service.js',
    // economy service - grep async methods
    'echo "=== ECONOMY SERVICE grep ===" && grep -n "async " /var/www/kingdom-wars/dist/src/modules/economy/economy.service.js',
    // combat service - grep async methods
    'echo "=== COMBAT SERVICE grep ===" && grep -n "async " /var/www/kingdom-wars/dist/src/modules/combat/combat.service.js',
    // Check if there are any other dist dirs (maybe dist/modules vs dist/src/modules)
    'echo "=== DIST STRUCTURE ===" && ls /var/www/kingdom-wars/dist/ && ls /var/www/kingdom-wars/dist/src/ 2>/dev/null || echo "no dist/src"',
    // Check main.js and app.module
    'echo "=== MAIN FILES ===" && wc -l /var/www/kingdom-wars/dist/src/main.js /var/www/kingdom-wars/dist/src/app.module.js 2>/dev/null',
  ];

  let i = 0;
  function next() {
    if (i >= commands.length) { conn.end(); return; }
    const cmd = commands[i++];
    conn.exec(cmd, (err, stream) => {
      if (err) { console.error('exec err:', err); next(); return; }
      let out = '';
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => out += d);
      stream.on('close', () => { console.log(out); next(); });
    });
  }
  next();

}).connect({
  host: '187.124.49.18', port: 22, username: 'root', password: 'j?UA.&ypMI0,MpbH', readyTimeout: 30000
});
conn.on('error', e => console.error('conn error:', e.message));
