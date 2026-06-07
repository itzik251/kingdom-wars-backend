const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const HOST = '187.124.49.18';
const USER = 'root';
const PASS = 'j?UA.&ypMI0,MpbH';
const localDist = path.join(__dirname, 'frontend', 'dist');
const remotePublic = '/var/www/kingdom-wars/public';

function uploadFile(sftp, localPath, remotePath) {
  return new Promise((res, rej) => {
    sftp.fastPut(localPath, remotePath, (err) => err ? rej(err) : res());
  });
}

function mkdirRemote(sftp, dir) {
  return new Promise((res) => sftp.mkdir(dir, () => res()));
}

async function uploadDir(sftp, localDir, remoteDir) {
  await mkdirRemote(sftp, remoteDir);
  const entries = fs.readdirSync(localDir, { withFileTypes: true });
  for (const e of entries) {
    const lp = path.join(localDir, e.name);
    const rp = remoteDir + '/' + e.name;
    if (e.isDirectory()) await uploadDir(sftp, lp, rp);
    else { await uploadFile(sftp, lp, rp); console.log('uploaded', e.name); }
  }
}

const conn = new Client();
conn.on('ready', () => {
  conn.sftp(async (err, sftp) => {
    if (err) { console.error(err); conn.end(); return; }
    await uploadDir(sftp, localDist, remotePublic);
    console.log('DONE');
    conn.end();
  });
}).connect({ host: HOST, port: 22, username: USER, password: PASS, readyTimeout: 30000 });
