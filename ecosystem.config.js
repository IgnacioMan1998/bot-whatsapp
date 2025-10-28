module.exports = {
  apps: [
    {
      name: 'whatsapp-assistant',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        DB_TYPE: 'sqlite',
        DB_PATH: './data/whatsapp.db'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DB_TYPE: 'postgresql',
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_NAME: 'whatsapp_assistant',
        DB_USER: 'assistant_user',
        DB_PASSWORD: 'your_password_here'
      },
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 4000,
      
      // Health monitoring
      min_uptime: '10s',
      max_restarts: 10,
      
      // Advanced features
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Environment specific settings
      node_args: '--max-old-space-size=1024'
    }
  ],
  
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/whatsapp-personal-assistant.git',
      path: '/var/www/whatsapp-assistant',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};