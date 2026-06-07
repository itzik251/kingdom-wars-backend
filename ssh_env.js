const { Client } = require('ssh2');
const HOST = '187.124.49.18';
const USER = 'root';
const PASS = 'j?UA.&ypMI0,MpbH';

// Get Railway env vars from the project
const JWT_SECRET = 'kw_jwt_secret_hostinger_2026_very_long_and_secure_key';
const TELEGRAM_BOT_TOKEN = '8848286918:AAFToWCC4ZNb0N45opEkTNaiqhF0X3EmlQk';
const TELEGRAM_BOT_USERNAME = 'Kingdomw_bot';
const SERVER_IP = '187.124.49.18';

const envFile = `NODE_ENV=production
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=kw_user
DB_PASSWORD=kw_secure_2026
DB_DATABASE=kingdom_wars

TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
TELEGRAM_BOT_USERNAME=${TELEGRAM_BOT_USERNAME}

JWT_SECRET=${JWT_SECRET}

FRONTEND_URL=http://${SERVER_IP}
MINI_APP_URL=http://${SERVER_IP}
CRYPTO_BOT_TOKEN=
`;

const cmd = `cat > /var/www/kingdom-wars/backend/.env << 'ENVEOF'
${envFile}
ENVEOF
echo ENV_CREATED
cat /var/www/kingdom-wars/backend/.env`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(cmd, (err, stream) => {
    if (err) { console.error('Error:', err); conn.end(); return; }
    stream.on('data', (data) => process.stdout.write(data.toString()));
    stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
    stream.on('close', () => { conn.end(); });
  });
}).connect({ host: HOST, port: 22, username: USER, password: PASS, readyTimeout: 15000 });
