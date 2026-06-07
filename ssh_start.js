const { Client } = require('ssh2');
const HOST = '187.124.49.18';
const USER = 'root';
const PASS = 'j?UA.&ypMI0,MpbH';

const cmd = `
cd /var/www/kingdom-wars/backend
pm2 delete kingdom-wars 2>/dev/null || true
pm2 start dist/main.js --name kingdom-wars --env production
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1 | bash 2>/dev/null || true
sleep 3
pm2 status
echo "---"
curl -s http://localhost:3000/api/leaderboard?all=true | head -c 100 || echo "App not responding yet"
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
