/**
 * deploy-frontend.js — deploy מהיר לפרונטאנד בלבד
 * npm run deploy:fe
 *
 * זמן: ~1-2 דקות
 * מתי להשתמש: כל שינוי ב-frontend/ (TSX, CSS, תרגומים, תמונות)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const HOST = '187.124.49.18';
const USER = 'root';
const PASS = 'dxV1(ggOb.ch5J3L-Q?7';
const localPublic  = path.join(__dirname, 'public');
const remotePublic = '/var/www/kingdom-wars/public';
const localTar     = path.join(__dirname, 'kw-public.tar.gz');

function run(cmd, opts = {}) {
  console.log(`\n▶ ${cmd.replace(PASS, '***')}`);
  execSync(cmd, { stdio: 'inherit', ...opts });
}

function ssh(remoteCmd) {
  return execSync(
    `sshpass -p "${PASS}" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 ${USER}@${HOST} "${remoteCmd}"`,
    { encoding: 'utf8' }
  ).trim();
}

async function main() {
  console.log('\n═══ 1/3 Build Frontend (Vite) ═══');
  run('npm run build', { cwd: path.join(__dirname, 'frontend') });

  console.log('\n═══ 2/3 Archive public/ ═══');
  fs.writeFileSync(path.join(localPublic, 'version.json'), JSON.stringify({ v: Date.now() }));
  if (fs.existsSync(localTar)) fs.unlinkSync(localTar);
  run(`tar -czf "${localTar}" -C "${localPublic}" .`);
  const mb = (fs.statSync(localTar).size / 1024 / 1024).toFixed(2);
  console.log(`Archive: ${mb} MB`);

  console.log('\n═══ 3/3 Upload & extract on server ═══');
  run(`sshpass -p "${PASS}" scp -o StrictHostKeyChecking=no -o ConnectTimeout=30 "${localTar}" ${USER}@${HOST}:/tmp/kw-public.tar.gz`);
  console.log('Upload done, extracting...');
  const out = ssh(`mkdir -p ${remotePublic} && tar -xzf /tmp/kw-public.tar.gz -C ${remotePublic} && rm /tmp/kw-public.tar.gz && echo OK`);
  console.log('Server:', out);

  console.log('\n✅ Frontend עלה בהצלחה! (אין צורך ב-PM2 restart)');
}

main().catch(e => { console.error('\n❌ Deploy נכשל:', e.message); process.exit(1); });
