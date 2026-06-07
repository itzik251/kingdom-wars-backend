const { Client } = require('ssh2');
const HOST = '187.124.49.18';
const USER = 'root';
const PASS = 'j?UA.&ypMI0,MpbH';

const cmd = `
# Check Railway version first
PGPASSWORD=DmkPLqXYHYKFWJBRYUlrJglBTfLuBeZc psql -h yamanote.proxy.rlwy.net -p 50514 -U postgres -d railway -c "SELECT version();" 2>&1 | head -5

echo "---"
# Dump with ignore version flag and only stdout to file
PGPASSWORD=DmkPLqXYHYKFWJBRYUlrJglBTfLuBeZc pg_dump -h yamanote.proxy.rlwy.net -p 50514 -U postgres -d railway --no-owner --no-acl --no-tablespaces --inserts -f /tmp/railway_backup.sql 2>/tmp/dump_errors.log
DUMP_EXIT=$?
echo "Dump exit code: $DUMP_EXIT"
cat /tmp/dump_errors.log
echo "Dump size: $(wc -l < /tmp/railway_backup.sql) lines"
head -5 /tmp/railway_backup.sql
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
