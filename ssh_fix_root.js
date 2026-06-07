const { Client } = require('ssh2');
const HOST = '187.124.49.18';
const USER = 'root';
const PASS = 'j?UA.&ypMI0,MpbH';

const cmd = `
echo "=== Checking root dist/ ==="
ls /var/www/kingdom-wars/dist/ 2>/dev/null | head -5 || echo "No root dist/"

echo "=== Installing root deps ==="
cd /var/www/kingdom-wars
npm install 2>&1 | tail -3

echo "=== Restarting PM2 from ROOT ==="
pm2 delete kingdom-wars 2>/dev/null || true
cd /var/www/kingdom-wars
pm2 start dist/main.js --name kingdom-wars --env production
pm2 save
sleep 4
pm2 status
echo "---"
echo "Static files path check:"
ls /var/www/kingdom-wars/public/index.html
`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(cmd, (err, stream) => {
    if (err) { console.error('Error:', err); conn.end(); return; }
    stream.on('data', (data) => process.stdout.write(data.toString()));
    stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
    stream.on('close', () => { conn.end(); });
  });
}).connect({ host: HOST, port: 22, username: USER, password: PASS, readyTimeout: 15000 });
