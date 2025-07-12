module.exports = {
  apps: [{
    name: 'pinnacle-frontend',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/pinnacle-frontend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/pinnacle-frontend-error.log',
    out_file: '/var/log/pm2/pinnacle-frontend-out.log',
    log_file: '/var/log/pm2/pinnacle-frontend-combined.log',
    time: true
  }]
} 