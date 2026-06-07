const { Client } = require('ssh2');
const HOST = '187.124.49.18';
const USER = 'root';
const PASS = 'j?UA.&ypMI0,MpbH';

const cmd = `sudo -u postgres psql -d kingdom_wars -c "GRANT ALL ON SCHEMA public TO kw_user;" && sudo -u postgres psql -d kingdom_wars -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kw_user;" && sudo -u postgres psql -d kingdom_wars -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO kw_user;" && sudo -u postgres psql -d kingdom_wars -c "ALTER DATABASE kingdom_wars OWNER TO kw_user;" && echo DB_PERMISSIONS_FIXED && pm2 restart kingdom-wars --update-env && sleep 5 && pm2 status`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(cmd, (err, stream) => {
    if (err) { console.error('Error:', err); conn.end(); return; }
    stream.on('data', (data) => process.stdout.write(data.toString()));
    stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
    stream.on('close', () => { conn.end(); });
  });
}).connect({ host: HOST, port: 22, username: USER, password: PASS, readyTimeout: 15000 });
