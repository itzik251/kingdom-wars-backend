const { Client } = require('ssh2');
const path = require('path');

const HOST = '187.124.49.18';
const USER = 'root';
const PASS = 'j?UA.&ypMI0,MpbH';

const FILES = [
  ['src/modules/kingdom/kingdom.entity.ts', '/var/www/kingdom-wars/src/modules/kingdom/kingdom.entity.ts'],
  ['src/modules/units/units.service.ts',    '/var/www/kingdom-wars/src/modules/units/units.service.ts'],
];

function uploadFile(sftp, localPath, remotePath) {
  return new Promise((res, rej) => {
    sftp.fastPut(path.join(__dirname, localPath), remotePath, (err) => err ? rej(err) : res());
  });
}

const conn = new Client();
conn.on('ready', () => {
  conn.sftp(async (err, sftp) => {
    if (err) { console.error(err); conn.end(); return; }
    for (const [local, remote] of FILES) {
      await uploadFile(sftp, local, remote);
      console.log('uploaded', local);
    }
    console.log('ALL DONE');
    conn.end();
  });
}).connect({ host: HOST, port: 22, username: USER, password: PASS, readyTimeout: 30000 });
