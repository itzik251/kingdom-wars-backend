const { Client } = require('ssh2');
const HOST = '187.124.49.18';
const USER = 'root';
const PASS = 'j?UA.&ypMI0,MpbH';

const cmd = `npm install -g pm2 2>&1 | tail -3
sudo -u postgres psql -c "CREATE DATABASE kingdom_wars;" 2>&1
sudo -u postgres psql -c "CREATE USER kw_user WITH PASSWORD 'kw_secure_2026';" 2>&1
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE kingdom_wars TO kw_user;" 2>&1
echo DB_DONE`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(cmd, (err, stream) => {
    if (err) { console.error('Error:', err); conn.end(); return; }
    stream.on('data', (data) => process.stdout.write(data.toString()));
    stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
    stream.on('close', () => { conn.end(); });
  });
}).connect({ host: HOST, port: 22, username: USER, password: PASS, readyTimeout: 15000 });
