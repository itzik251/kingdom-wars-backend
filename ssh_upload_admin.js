const { Client } = require('ssh2');
const path = require('path');

const HOST = '187.124.49.18';
const USER = 'root';
const PASS = 'j?UA.&ypMI0,MpbH';

const LOCAL  = path.join(__dirname, 'src/modules/admin/admin-dashboard.html');
const REMOTE = '/var/www/kingdom-wars/dist/modules/admin/admin-dashboard.html';

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) { console.error('SFTP error:', err); conn.end(); return; }
    sftp.fastPut(LOCAL, REMOTE, (err) => {
      if (err) { console.error('Upload error:', err); conn.end(); return; }
      console.log('✅ Uploaded admin-dashboard.html');
      // rebuild & restart
      conn.exec('cd /var/www/kingdom-wars && npm run build 2>&1 | tail -5 && pm2 restart all 2>&1 | tail -3', (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { console.log('\n✅ Done!'); conn.end(); });
      });
    });
  });
}).connect({ host: HOST, port: 22, username: USER, password: PASS, readyTimeout: 30000 });
