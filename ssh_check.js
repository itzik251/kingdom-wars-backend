const { Client } = require('ssh2');
const HOST = '187.124.49.18';
const USER = 'root';
const PASS = 'j?UA.&ypMI0,MpbH';

const cmd = `
echo "=== index.html ==="
cat /var/www/kingdom-wars/public/index.html

echo "=== PM2 logs last 20 ==="
pm2 logs kingdom-wars --lines 20 --nostream 2>&1 | tail -25

echo "=== API test ==="
curl -s http://localhost:3000/api/leaderboard?all=true | head -c 200
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
