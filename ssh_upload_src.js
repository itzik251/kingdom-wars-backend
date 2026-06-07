const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const HOST = '187.124.49.18';
const USER = 'root';
const PASS = 'j?UA.&ypMI0,MpbH';

const FILES = [
  ['src/modules/user/user.entity.ts',                   '/var/www/kingdom-wars/src/modules/user/user.entity.ts'],
  ['src/modules/auth/auth.service.ts',                   '/var/www/kingdom-wars/src/modules/auth/auth.service.ts'],
  ['src/modules/auth/auth.controller.ts',                '/var/www/kingdom-wars/src/modules/auth/auth.controller.ts'],
  ['src/modules/notifications/notification.service.ts',  '/var/www/kingdom-wars/src/modules/notifications/notification.service.ts'],
  ['src/modules/notifications/notification.module.ts',   '/var/www/kingdom-wars/src/modules/notifications/notification.module.ts'],
  ['src/modules/kingdom/kingdom.service.ts',             '/var/www/kingdom-wars/src/modules/kingdom/kingdom.service.ts'],
  ['src/modules/kingdom/kingdom.module.ts',              '/var/www/kingdom-wars/src/modules/kingdom/kingdom.module.ts'],
  ['src/modules/telegram/telegram.service.ts',           '/var/www/kingdom-wars/src/modules/telegram/telegram.service.ts'],
  ['src/modules/telegram/telegram.module.ts',            '/var/www/kingdom-wars/src/modules/telegram/telegram.module.ts'],
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
