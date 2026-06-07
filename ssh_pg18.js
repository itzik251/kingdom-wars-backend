const { Client } = require('ssh2');
const HOST = '187.124.49.18';
const USER = 'root';
const PASS = 'j?UA.&ypMI0,MpbH';

const cmd = `
# Install PostgreSQL 18 client
echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg 2>/dev/null
apt-get update -qq
apt-get install -y postgresql-client-18 2>&1 | tail -5
echo "pg_dump version: $(/usr/lib/postgresql/18/bin/pg_dump --version)"

# Now dump from Railway using pg_dump 18
PGPASSWORD=DmkPLqXYHYKFWJBRYUlrJglBTfLuBeZc /usr/lib/postgresql/18/bin/pg_dump \
  -h yamanote.proxy.rlwy.net -p 50514 -U postgres -d railway \
  --no-owner --no-acl --no-tablespaces -f /tmp/railway_backup.sql 2>/tmp/dump_err.log

echo "Exit: $?"
cat /tmp/dump_err.log
echo "Dump lines: $(wc -l < /tmp/railway_backup.sql)"
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
