/**
 * deploy.js — סקריפט deploy מלא (backend + frontend)
 * מריץ: npm run deploy
 *
 * שלבים:
 * 1. build backend (TypeScript → dist/)
 * 2. build frontend (Vite → public/)
 * 3. ארז dist/ + public/ ל-tar.gz
 * 4. העלה tar יחיד לשרת
 * 5. חלץ + restart PM2
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const HOST = '187.124.49.18';
const USER = 'root';
const PASS = 'dxV1(ggOb.ch5J3L-Q?7';
const remoteBase = '/var/www/kingdom-wars';
const localTar   = 'kw-deploy.tar.gz'; // נתיב יחסי — run() מריץ מה-__dirname

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
  // 1. Build backend
  console.log('\n═══ 1/5 Build Backend (TypeScript) ═══');
  run('npx tsc -p tsconfig.build.json');
  const adminSrc = path.join(__dirname, 'src/modules/admin/admin-dashboard.html');
  const adminDst = path.join(__dirname, 'dist/src/modules/admin/admin-dashboard.html');
  fs.mkdirSync(path.dirname(adminDst), { recursive: true });
  fs.copyFileSync(adminSrc, adminDst);
  console.log('✅ Copied admin-dashboard.html to dist');

  // 2. Build frontend
  console.log('\n═══ 2/5 Build Frontend (Vite) ═══');
  run('npm run build', { cwd: path.join(__dirname, 'frontend') });

  // 3. version.json + archive
  console.log('\n═══ 3/5 Creating archive ═══');
  fs.writeFileSync(path.join(__dirname, 'public', 'version.json'), JSON.stringify({ v: Date.now() }));
  const tarAbs = path.join(__dirname, localTar);
  if (fs.existsSync(tarAbs)) fs.unlinkSync(tarAbs);
  run(`tar -czf ${localTar} dist/ public/`);
  const mb = (fs.statSync(tarAbs).size / 1024 / 1024).toFixed(1);
  console.log(`Archive: ${mb} MB`);

  // 4. Upload
  console.log('\n═══ 4/5 Uploading to server ═══');
  // המר ל-Unix path לשימוש ב-scp
  const tarUnix = tarAbs.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, d) => `/${d.toLowerCase()}`);
  run(`sshpass -p "${PASS}" scp -o StrictHostKeyChecking=no -o ConnectTimeout=60 "${tarUnix}" ${USER}@${HOST}:/tmp/kw-deploy.tar.gz`);
  console.log('Upload done ✓');

  // 5. Extract + PM2 restart
  console.log('\n═══ 5/5 Extracting & restarting PM2 ═══');
  const out = ssh(`cd ${remoteBase} && tar -xzf /tmp/kw-deploy.tar.gz && rm /tmp/kw-deploy.tar.gz && pm2 restart kingdom-wars && echo OK`);
  console.log('Server:', out);

  console.log('\n✅ Deploy הושלם בהצלחה!');
}

main().catch(e => { console.error('\n❌ Deploy נכשל:', e.message); process.exit(1); });
