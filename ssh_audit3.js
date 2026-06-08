const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('Connected');

  const commands = [
    // Check if server admin.controller has takeResource, wallet-balance endpoints
    'echo "=== ADMIN: takeResource / wallet ===" && grep -n "takeResource\\|walletBalance\\|wallet-balance\\|wallet_balance\\|take-resource\\|takeReso" /var/www/kingdom-wars/dist/src/modules/admin/admin.controller.js',
    // Check local (source) admin.controller vs server - look for what methods exist in source
    'echo "=== ADMIN CONTROLLER FULL METHOD LIST ===" && grep -n "async\\|Get(\\|Post(\\|Put(\\|Delete(" /var/www/kingdom-wars/dist/src/modules/admin/admin.controller.js',
    // Check the vip.service for purchaseWithUsdt - already saw it but double check
    'echo "=== VIP: checkVip methods ===" && grep -n "async\\|isVip\\|checkVip\\|getVipStatus" /var/www/kingdom-wars/dist/src/modules/vip/vip.service.js',
    // Check if there is a double dist/src vs dist issue - list both
    'echo "=== CHECK DUPLICATE DIST ===" && ls /var/www/kingdom-wars/dist/modules/ 2>/dev/null && echo "---src---" && ls /var/www/kingdom-wars/dist/src/modules/',
    // Check kingdom service for missing methods from local changes
    'echo "=== KINGDOM: full grep ===" && grep -n "async " /var/www/kingdom-wars/dist/src/modules/kingdom/kingdom.service.js',
    // Check vip.service - does server version match local (which has been modified)?
    'echo "=== VIP SERVICE full ===" && grep -n "async " /var/www/kingdom-wars/dist/src/modules/vip/vip.service.js',
    // Check combat service for USDT loot section
    'echo "=== COMBAT: usdtLoot/gameLoot ===" && grep -n "usdt\\|game[Bb]alance\\|loot\\|20\\|percent" /var/www/kingdom-wars/dist/src/modules/combat/combat.service.js | head -30',
    // server process state
    'echo "=== PM2 STATUS ===" && pm2 list 2>/dev/null || echo "pm2 not available"',
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
