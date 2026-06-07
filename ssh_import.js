const { Client } = require('ssh2');
const HOST = '187.124.49.18';
const USER = 'root';
const PASS = 'j?UA.&ypMI0,MpbH';

const cmd = `
echo "Recreating DB..."
sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='kingdom_wars' AND pid <> pg_backend_pid();" 2>/dev/null
sudo -u postgres psql -c "DROP DATABASE IF EXISTS kingdom_wars;"
sudo -u postgres psql -c "CREATE DATABASE kingdom_wars OWNER kw_user;"
sudo -u postgres psql -d kingdom_wars -c "GRANT ALL ON SCHEMA public TO kw_user;"

echo "Importing data..."
PGPASSWORD=kw_secure_2026 psql -U kw_user -d kingdom_wars -h localhost -f /tmp/railway_backup.sql 2>&1 | grep -E "ERROR|error|DONE|done" | head -20

echo "Verifying..."
PGPASSWORD=kw_secure_2026 psql -U kw_user -d kingdom_wars -h localhost -c "\dt" 2>&1
PGPASSWORD=kw_secure_2026 psql -U kw_user -d kingdom_wars -h localhost -c "SELECT COUNT(*) as kingdoms FROM kingdoms;" 2>&1
PGPASSWORD=kw_secure_2026 psql -U kw_user -d kingdom_wars -h localhost -c "SELECT COUNT(*) as users FROM users;" 2>&1
echo "IMPORT_DONE"

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
