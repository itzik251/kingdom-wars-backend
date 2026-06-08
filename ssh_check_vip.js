const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');
const HOST = '187.124.49.18', USER = 'root', PASS = 'j?UA.&ypMI0,MpbH';

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    conn.exec(`
cd /var/www/kingdom-wars
BACKUP=kingdom-wars-dist-backup-$(date +%Y%m%d-%H%M%S).tar.gz
tar -czf /root/$BACKUP dist/ public/
echo "BACKUP:/root/$BACKUP"
ls -lh /root/$BACKUP
`, (err, stream) => {
      let out = '';
      stream.on('data', d => { out += d.toString(); process.stdout.write(d.toString()); });
      stream.on('close', () => {
        const match = out.match(/BACKUP:(.+)/);
        if (!match) { conn.end(); return; }
        const remotePath = match[1].trim();
        const localPath = path.join(__dirname, 'kingdom-wars-dist-backup-LATEST.tar.gz');
        console.log('\nDownloading backup...');
        sftp.fastGet(remotePath, localPath, (err) => {
          if (err) { console.error(err); conn.end(); return; }
          const size = (fs.statSync(localPath).size / 1024).toFixed(0);
          console.log(`✅ Backup saved locally: ${size}KB → ${localPath}`);
          conn.end();
        });
      });
    });
  });
}).connect({ host: HOST, port: 22, username: USER, password: PASS, readyTimeout: 60000 });
