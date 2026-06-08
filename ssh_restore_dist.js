/**
 * RESTORE SCRIPT — Kingdom Wars dist
 *
 * Run this if something breaks on the server after accidental tsc run:
 *   node ssh_restore_dist.js
 *
 * This will restore the working dist from the backup and restart pm2.
 */
const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');

const HOST = '187.124.49.18', USER = 'root', PASS = 'j?UA.&ypMI0,MpbH';
const LOCAL_BACKUP = path.join(__dirname, 'kingdom-wars-dist-backup-20260607.tar.gz');
const REMOTE_BACKUP = '/root/kingdom-wars-dist-backup-restore.tar.gz';

console.log('🔄 Starting restore...');

const conn = new Client();
conn.on('ready', () => {
  conn.sftp(async (err, sftp) => {
    // Upload backup to server
    console.log('📤 Uploading backup...');
    await new Promise((res, rej) => sftp.fastPut(LOCAL_BACKUP, REMOTE_BACKUP, e => e ? rej(e) : res()));
    console.log('✅ Backup uploaded');

    // Restore and restart
    conn.exec(`
cd /var/www/kingdom-wars &&
tar -xzf ${REMOTE_BACKUP} &&
pm2 restart all 2>&1 | tail -5 &&
echo "✅ Restored successfully!"
`, (err, stream) => {
      stream.on('data', d => process.stdout.write(d.toString()));
      stream.stderr.on('data', d => process.stderr.write(d.toString()));
      stream.on('close', () => {
        console.log('\n✅ Restore complete! Server is running with the backed-up dist.');
        conn.end();
      });
    });
  });
}).connect({ host: HOST, port: 22, username: USER, password: PASS, readyTimeout: 60000 });
