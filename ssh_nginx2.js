const { Client } = require('ssh2');
const HOST = '187.124.49.18';
const USER = 'root';
const PASS = 'j?UA.&ypMI0,MpbH';

const nginxConfig = `server {
    listen 80;
    server_name kingdomwars.cloud www.kingdomwars.cloud;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name kingdomwars.cloud www.kingdomwars.cloud;

    ssl_certificate /etc/letsencrypt/live/kingdomwars.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kingdomwars.cloud/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}`;

const cmd = `cat > /etc/nginx/sites-available/kingdom-wars << 'NGINXEOF'
${nginxConfig}
NGINXEOF
nginx -t && systemctl reload nginx && echo NGINX_SSL_OK`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(cmd, (err, stream) => {
    if (err) { console.error('Error:', err); conn.end(); return; }
    stream.on('data', (data) => process.stdout.write(data.toString()));
    stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
    stream.on('close', () => { conn.end(); });
  });
}).connect({ host: HOST, port: 22, username: USER, password: PASS, readyTimeout: 15000 });
