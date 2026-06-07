const { Client } = require('ssh2');
const HOST = '187.124.49.18';
const USER = 'root';
const PASS = 'j?UA.&ypMI0,MpbH';

const envFile = `NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://kw_user:kw_secure_2026@localhost:5432/kingdom_wars
TELEGRAM_BOT_TOKEN=8848286918:AAFToWCC4ZNb0N45opEkTNaiqhF0X3EmlQk
TELEGRAM_BOT_USERNAME=Kingdomw_bot
JWT_SECRET=kw_jwt_secret_hostinger_2026_very_long_and_secure_key
FRONTEND_URL=https://kingdomwars.cloud
MINI_APP_URL=https://kingdomwars.cloud
CRYPTO_BOT_TOKEN=
`;

const cmd = `printf '%s' '${envFile.replace(/'/g, "'\\''")}' > /var/www/kingdom-wars/backend/.env && pm2 restart kingdom-wars --update-env && sleep 4 && pm2 status && echo FINAL_DONE`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(cmd, (err, stream) => {
    if (err) { console.error('Error:', err); conn.end(); return; }
    stream.on('data', (data) => process.stdout.write(data.toString()));
    stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
    stream.on('close', () => { conn.end(); });
  });
}).connect({ host: HOST, port: 22, username: USER, password: PASS, readyTimeout: 15000 });
