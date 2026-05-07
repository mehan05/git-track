module.exports = {
  apps: [
    {
      name: 'gittrack',
      script: 'dist/index.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      merge_logs: true,
    },
  ],
};
