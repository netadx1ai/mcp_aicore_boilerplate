/**
 * PM2 Ecosystem Configuration
 * NetADX AI-CORE MCP API Server
 * 
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 start ecosystem.config.js --env staging
 *   pm2 start ecosystem.config.js --env development
 * 
 * Commands:
 *   pm2 status
 *   pm2 logs
 *   pm2 monit
 *   pm2 restart all
 *   pm2 stop all
 *   pm2 delete all
 */

module.exports = {
  apps: [
    {
      name: 'netadx-aicore-api',
      
      // Use tsx to run TypeScript directly
      script: 'npx',
      args: 'tsx src/index.ts',
      
      // Process management
      instances: 1,  // Can increase for cluster mode
      exec_mode: 'fork',  // Use 'cluster' for scaling if app supports it
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 8005,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 8005,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 8005,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8005,
      },
      
      // Logging
      error_file: '/var/log/netadx-aicore/error.log',
      out_file: '/var/log/netadx-aicore/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      combine_logs: true,
      merge_logs: true,
      
      // Process management
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist'],
      max_memory_restart: '1G',
      
      // Restart policy
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Advanced features
      source_map_support: true,
      instance_var: 'INSTANCE_ID',
      
      // Health monitoring
      exp_backoff_restart_delay: 100,
    },
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'production-server.netadx.ai',
      ref: 'origin/main',
      repo: 'git@github.com:netadx1ai/netadx-workspace.git',
      path: '/opt/netadx-aicore',
      'post-deploy': 'npm ci && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
    staging: {
      user: 'deploy',
      host: 'staging-server.netadx.ai',
      ref: 'origin/develop',
      repo: 'git@github.com:netadx1ai/netadx-workspace.git',
      path: '/opt/netadx-aicore-staging',
      'post-deploy': 'npm ci && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': '',
    },
  },
};
