const { Client } = require('ssh2');
const HOST = '187.124.49.18';
const USER = 'root';
const PASS = 'j?UA.&ypMI0,MpbH';

const envFile = `NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://kw_user:kw_secure_2026@localhost:5432/kingdom_wars
TELEGRAM_BOT_TOKEN=8848286918:AAFToWCC4ZNb0N45opEkTNaiqhF0X3EmlQk
TELEGRAM_BOT_USERNAME=Kingdomw_bot
JWT_SECRET=kw_prod_secret_kingdom_wars_2026_very_secure_key_min32
FRONTEND_URL=https://kingdomwars.cloud
MINI_APP_URL=https://kingdomwars.cloud
CRYPTO_BOT_TOKEN=591503:AAoiPoOcql1WkUGRNN5h7d4v1UmRKzaQqYF
`;

const cmd = `
# Copy .env to root level where the app now runs from
printf '%s' '${envFile.replace(/'/g, "'\\''")}' > /var/www/kingdom-wars/.env
echo "Root .env created"
pm2 restart kingdom-wars --update-env
sleep 5
pm2 status
echo "---"
curl -s http://localhost:3000/ | grep "DOCTYPE" | head -1 && echo "APP OK"
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
