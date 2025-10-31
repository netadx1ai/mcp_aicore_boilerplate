/**
 * PM2 Ecosystem Configuration for NetADX AI-CORE
 * Uses tsx to run TypeScript directly without compilation
 * 
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 start ecosystem.config.js --env staging
 *   pm2 start ecosystem.config.js --env development
 * 
 * Commands:
 *   pm2 status
 *   pm2 logs netadx-aicore
 *   pm2 monit
 *   pm2 restart netadx-aicore
 *   pm2 stop netadx-aicore
 *   pm2 delete netadx-aicore
 */

module.exports = {
  apps: [
    {
      name: 'netadx-aicore',
      
      // Use tsx to run TypeScript directly
      script: 'npx',
      args: 'tsx src/index.ts',
      
      // Alternative: use tsx globally if installed
      // script: 'tsx',
      // args: 'src/index.ts',
      
      // Process management
      instances: 1,  // Can be 'max' for cluster mode with compatible apps
      exec_mode: 'fork',  // Use 'cluster' for scaling
      
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
      
      // Watch mode (useful for development)
      watch: false,
      watch_delay: 1000,
      ignore_watch: [
        'node_modules',
        'logs',
        'dist',
        '.git',
        '*.log',
      ],
      
      // Restart policy
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      max_memory_restart: '1G',
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Advanced features
      instance_var: 'INSTANCE_ID',
      exp_backoff_restart_delay: 100,
      
      // Interpreter options (for tsx)
      interpreter: 'node',
      interpreter_args: '',
      
      // Source map support
      source_map_support: true,
      
      // Time zone
      time: true,
    },
  ],

  /**
   * Deployment configuration
   * Use with: pm2 deploy <environment> <command>
   * 
   * Example:
   *   pm2 deploy production setup
   *   pm2 deploy production update
   */
  deploy: {
    production: {
      user: 'deploy',
      host: 'api.netadx.ai',
      ref: 'origin/main',
      repo: 'git@github.com:netadx1ai/netadx-workspace.git',
      path: '/opt/apps/netadx-aicore',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no',
    },
    staging: {
      user: 'deploy',
      host: 'staging.netadx.ai',
      ref: 'origin/develop',
      repo: 'git@github.com:netadx1ai/netadx-workspace.git',
      path: '/opt/apps/netadx-aicore-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no',
    },
    development: {
      user: 'deploy',
      host: 'dev.netadx.ai',
      ref: 'origin/develop',
      repo: 'git@github.com:netadx1ai/netadx-workspace.git',
      path: '/opt/apps/netadx-aicore-dev',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci && pm2 reload ecosystem.config.js --env development',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no',
    },
  },
};
