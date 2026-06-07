const { Client } = require('ssh2');

const conn = new Client();
const HOST = '187.124.49.18';
const USER = 'root';
const PASS = 'j?UA.&ypMI0,MpbH';

const setupCommands = `
set -e
echo "=== System info ==="
uname -a
free -h
df -h /

echo "=== Updating system ==="
apt-get update -qq && apt-get upgrade -y -qq

echo "=== Installing Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>/dev/null
apt-get install -y nodejs

echo "=== Installing PostgreSQL ==="
apt-get install -y postgresql postgresql-contrib

echo "=== Installing PM2 ==="
npm install -g pm2

echo "=== Installing Nginx ==="
apt-get install -y nginx

echo "=== Starting services ==="
systemctl enable postgresql nginx
systemctl start postgresql nginx

echo "=== Creating DB ==="
sudo -u postgres psql -c "CREATE DATABASE kingdom_wars;" 2>/dev/null || echo "DB may already exist"
sudo -u postgres psql -c "CREATE USER kw_user WITH PASSWORD 'kw_secure_2026';" 2>/dev/null || echo "User may already exist"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE kingdom_wars TO kw_user;" 2>/dev/null

echo "=== Versions ==="
node --version
npm --version
psql --version
nginx -v

echo "=== DONE ==="
`;

conn.on('ready', () => {
  console.log('Connected to VPS!');
  conn.exec(setupCommands, { pty: true }, (err, stream) => {
    if (err) { console.error('Error:', err); conn.end(); return; }
    stream.on('data', (data) => process.stdout.write(data.toString()));
    stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
    stream.on('close', (code) => {
      console.log('\n=== Setup completed with code:', code, '===');
      conn.end();
    });
  });
}).on('error', (err) => {
  console.error('Connection error:', err);
}).connect({
  host: HOST,
  port: 22,
  username: USER,
  password: PASS,
  readyTimeout: 30000,
});
