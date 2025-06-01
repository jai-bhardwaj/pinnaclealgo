module.exports = {
  apps: [
    {
      name: 'trading-frontend-prod',
      script: 'npm',
      args: 'start',
      cwd: '/root/trading-frontend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_TELEMETRY_DISABLED: 1
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_TELEMETRY_DISABLED: 1
      },
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Process management
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Advanced options
      kill_timeout: 5000,
      listen_timeout: 8000,
      shutdown_with_message: true,
      
      // Source map support for better error reporting
      source_map_support: true,
      
      // Time zone
      time: true
    },
    {
      name: 'trading-frontend-staging',
      script: 'npm',
      args: 'start',
      cwd: '/root/trading-frontend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'staging',
        PORT: 3001,
        NEXT_TELEMETRY_DISABLED: 1
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001,
        NEXT_TELEMETRY_DISABLED: 1
      },
      // Logging
      log_file: './logs/staging-combined.log',
      out_file: './logs/staging-out.log',
      error_file: './logs/staging-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Process management
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 5,
      min_uptime: '10s',
      
      // Advanced options
      kill_timeout: 5000,
      listen_timeout: 8000,
      source_map_support: true,
      time: true
    },
    {
      name: 'trading-frontend-dev',
      script: 'npm',
      args: 'run dev',
      cwd: '/root/trading-frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3002,
        NEXT_TELEMETRY_DISABLED: 1
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3002,
        NEXT_TELEMETRY_DISABLED: 1
      },
      // Logging
      log_file: './logs/dev-combined.log',
      out_file: './logs/dev-out.log',
      error_file: './logs/dev-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Process management
      autorestart: true,
      watch: ['./app', './components', './lib', './hooks', './contexts'],
      watch_delay: 1000,
      ignore_watch: ['node_modules', '.next', 'logs', '.git'],
      max_memory_restart: '512M',
      restart_delay: 2000,
      
      // Development specific
      kill_timeout: 5000,
      source_map_support: true,
      time: true
    }
  ],

  deploy: {
    production: {
      user: 'root',
      host: ['your-production-server.com'],
      ref: 'origin/main',
      repo: 'https://github.com/yourusername/trading-frontend.git',
      path: '/root/trading-frontend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'ForwardAgent=yes'
    },
    staging: {
      user: 'root',
      host: ['your-staging-server.com'],
      ref: 'origin/develop',
      repo: 'https://github.com/yourusername/trading-frontend.git',
      path: '/root/trading-frontend-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': '',
      'ssh_options': 'ForwardAgent=yes'
    }
  }
}; 