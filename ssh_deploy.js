const { Client } = require('ssh2');
const HOST = '187.124.49.18';
const USER = 'root';
const PASS = 'j?UA.&ypMI0,MpbH';

// Get env vars from backend
const fs = require('fs');
const envContent = fs.existsSync('/tmp/env_content') ? fs.readFileSync('/tmp/env_content','utf8') : '';

const cmd = `
cd /var/www
rm -rf kingdom-wars
git clone https://github.com/itzik251/kingdom-wars-backend.git kingdom-wars
cd /var/www/kingdom-wars
npm install
cd backend
npm install
npm run build
echo BUILD_DONE
`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(cmd, (err, stream) => {
    if (err) { console.error('Error:', err); conn.end(); return; }
    stream.on('data', (data) => process.stdout.write(data.toString()));
    stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
    stream.on('close', () => { console.log('\nDone!'); conn.end(); });
  });
}).connect({ host: HOST, port: 22, username: USER, password: PASS, readyTimeout: 15000 });
