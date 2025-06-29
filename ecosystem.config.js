module.exports = {
  apps: [{
    name: 'checklive',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: "YYYY-MM-DD HH:mm:ss"
  }]
};
