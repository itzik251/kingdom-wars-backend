const { Client } = require('ssh2');
const HOST = '187.124.49.18';
const USER = 'root';
const PASS = 'j?UA.&ypMI0,MpbH';

const RAILWAY_URL = 'postgresql://postgres:DmkPLqXYHYKFWJBRYUlrJglBTfLuBeZc@yamanote.proxy.rlwy.net:50514/railway';

const cmd = `
echo "Dumping from Railway..."
PGPASSWORD=DmkPLqXYHYKFWJBRYUlrJglBTfLuBeZc pg_dump -h yamanote.proxy.rlwy.net -p 50514 -U postgres -d railway --no-owner --no-acl -F p > /tmp/railway_backup.sql 2>&1
echo "Dump done, size: $(wc -l < /tmp/railway_backup.sql) lines"

echo "Dropping and recreating local DB..."
PGPASSWORD=kw_secure_2026 psql -U kw_user -d postgres -h localhost -c "DROP DATABASE IF EXISTS kingdom_wars;" 2>&1
sudo -u postgres psql -c "DROP DATABASE IF EXISTS kingdom_wars;" 2>&1
sudo -u postgres psql -c "CREATE DATABASE kingdom_wars OWNER kw_user;" 2>&1

echo "Importing to local DB..."
PGPASSWORD=kw_secure_2026 psql -U kw_user -d kingdom_wars -h localhost < /tmp/railway_backup.sql 2>&1 | tail -20

echo "MIGRATION_DONE"
pm2 restart kingdom-wars --update-env
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
