# NetADX AI-CORE Deployment Guide

## Overview

NetADX AI-CORE uses **direct TypeScript execution** with `tsx` - no compilation step required. This approach provides:

- **Faster deployments** - No build time
- **Easier debugging** - Direct source code execution
- **Live updates** - Change TypeScript files and restart
- **Simpler CI/CD** - Just sync files and restart

## Quick Deployment

### Using deploy-quick.sh (Recommended)

The fastest way to deploy changes:

```bash
# Deploy all source files
./deploy-quick.sh

# Deploy specific file
./deploy-quick.sh src/tools/currency-consumption.ts

# Deploy specific directory
./deploy-quick.sh src/tools/

# Deploy without restart
./deploy-quick.sh src/ true
```

**Configuration:**

1. Copy the deployment configuration template:
```bash
cp .env.deploy.example .env.deploy
```

2. Edit `.env.deploy` with your server details:
```bash
DEPLOY_HOST=your-server.netadx.ai
DEPLOY_USER=deploy
DEPLOY_PATH=/opt/apps/netadx-aicore
SSH_KEY_PATH=$HOME/.ssh/id_rsa
SERVICE_NAME=netadx-aicore
```

3. Deploy:
```bash
./deploy-quick.sh
```

## Deployment Methods

### 1. PM2 (Recommended for Production)

**Local PM2:**
```bash
# Start with PM2
pm2 start ecosystem.config.js --env production

# Manage
pm2 status
pm2 logs netadx-aicore
pm2 restart netadx-aicore
pm2 stop netadx-aicore
```

**Remote PM2 Deployment:**
```bash
# Setup
pm2 deploy production setup

# Deploy
pm2 deploy production update

# Revert
pm2 deploy production revert 1
```

**PM2 Ecosystem Config:**
- Located at `ecosystem.config.js` (root) or `deployment/pm2/ecosystem.config.js`
- Uses `npx tsx src/index.ts` to run TypeScript directly
- No build step required

### 2. Docker

**Build and run:**
```bash
cd deployment/docker

# Build image
docker build -t netadx-aicore:latest .

# Run container
docker run -d \
  --name netadx-aicore \
  -p 8005:8005 \
  --env-file .env \
  netadx-aicore:latest

# View logs
docker logs -f netadx-aicore

# Stop
docker stop netadx-aicore
```

**Docker Compose:**
```bash
# Start
docker-compose up -d

# Logs
docker-compose logs -f

# Stop
docker-compose down
```

### 3. Systemd

**Using deploy.sh:**
```bash
cd deployment

# Deploy with systemd
./deploy.sh --env production --method systemd

# Manual systemd commands
sudo systemctl status netadx-aicore
sudo systemctl restart netadx-aicore
sudo systemctl logs -u netadx-aicore
```

## Full Deployment Script

The `deployment/deploy.sh` script provides comprehensive deployment automation:

```bash
cd deployment

# Deploy to production with PM2
./deploy.sh --env production --method pm2

# Deploy to staging
./deploy.sh --env staging --method pm2

# Build only (verify before deploy)
./deploy.sh --build-only

# Restart existing deployment
./deploy.sh --restart

# Rollback to previous version
./deploy.sh --rollback

# Deploy with Docker
./deploy.sh --env production --method docker

# Deploy with systemd
./deploy.sh --env production --method systemd
```

**Features:**
- ✅ Automatic backup before deployment
- ✅ Dependency installation
- ✅ Health checks
- ✅ Rollback capability
- ✅ Multiple deployment methods
- ✅ Environment-specific configurations

## No Build Step Required

Unlike traditional Node.js deployments, NetADX AI-CORE runs TypeScript directly:

**Traditional Approach (NOT used):**
```bash
npm run build          # Compile TS → JS
node dist/index.js     # Run compiled JS
```

**NetADX AI-CORE Approach:**
```bash
npx tsx src/index.ts   # Run TypeScript directly
```

**Why Direct TypeScript Execution?**

| Advantage | Description |
|-----------|-------------|
| **Faster Deployments** | Skip compilation, deploy instantly |
| **Source Maps Not Needed** | Errors point to actual TypeScript code |
| **Easier Debugging** | Debug TypeScript directly, not transpiled JS |
| **Simpler CI/CD** | No build artifact management |
| **Live Development** | Change .ts files, restart, done |

## Server Setup

### Prerequisites

```bash
# Node.js 18+ required
node -v

# Install PM2 globally (for PM2 deployment)
npm install -g pm2

# Verify tsx is in dependencies (should be installed with npm ci)
npm list tsx
```

### Initial Server Setup

```bash
# 1. Create deployment directory
sudo mkdir -p /opt/apps/netadx-aicore
sudo chown $USER:$USER /opt/apps/netadx-aicore

# 2. Clone or sync code
cd /opt/apps/netadx-aicore
# (use deploy-quick.sh or rsync)

# 3. Install dependencies
npm ci

# 4. Configure environment
cp .env.example .env
nano .env

# 5. Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Log Management

```bash
# Create log directory
sudo mkdir -p /var/log/netadx-aicore
sudo chown $USER:$USER /var/log/netadx-aicore

# PM2 logs
pm2 logs netadx-aicore
pm2 logs netadx-aicore --lines 100
pm2 flush  # Clear logs

# Application logs
tail -f /var/log/netadx-aicore/out.log
tail -f /var/log/netadx-aicore/error.log
```

## Environment Configuration

Each environment has its own configuration file:

```
.env.development     # Local development
.env.staging         # Staging server
.env.production      # Production server
```

**Load environment-specific config:**
```bash
# PM2 automatically loads based on --env flag
pm2 start ecosystem.config.js --env production

# Manual loading
export NODE_ENV=production
cp .env.production .env
```

## Monitoring & Health Checks

**Health Check Endpoint:**
```bash
curl http://localhost:8005/health

# Response:
# {"status":"healthy","uptime":12345}
```

**PM2 Monitoring:**
```bash
pm2 status
pm2 monit           # Real-time monitoring
pm2 logs            # Stream logs
pm2 describe netadx-aicore  # Detailed info
```

**System Resources:**
```bash
# Memory usage
pm2 list | grep netadx-aicore

# Restart if memory exceeds 1GB (configured in ecosystem.config.js)
# max_memory_restart: '1G'
```

## Troubleshooting

### TypeScript Execution Errors

**Issue:** `tsx: command not found`

**Solution:**
```bash
# Ensure tsx is installed
npm list tsx

# If missing, install
npm install tsx

# Or install globally
npm install -g tsx
```

### PM2 Not Starting

**Issue:** Service fails to start

**Check:**
```bash
# View PM2 logs
pm2 logs netadx-aicore --lines 50

# Check environment
pm2 describe netadx-aicore

# Restart with verbose logging
pm2 delete netadx-aicore
pm2 start ecosystem.config.js --env production --log-date-format 'YYYY-MM-DD HH:mm:ss'
```

### Deploy Script Errors

**Issue:** Permission denied

**Solution:**
```bash
# Ensure deploy scripts are executable
chmod +x deploy-quick.sh
chmod +x deployment/deploy.sh

# Ensure deployment directory permissions
sudo chown -R $USER:$USER /opt/apps/netadx-aicore
```

## Security Best Practices

1. **SSH Keys**: Use SSH keys instead of passwords
2. **Environment Variables**: Never commit `.env` files
3. **Non-root User**: Run PM2 as non-root user
4. **Firewall**: Only expose necessary ports (8005)
5. **HTTPS**: Use nginx/Apache as reverse proxy with SSL
6. **Log Rotation**: Configure log rotation to prevent disk fill

## CI/CD Integration

**GitHub Actions Example:**

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Server
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
        run: |
          echo "$SSH_PRIVATE_KEY" > /tmp/deploy_key
          chmod 600 /tmp/deploy_key
          export SSH_KEY_PATH=/tmp/deploy_key
          ./deploy-quick.sh
```

## Performance Tuning

### PM2 Cluster Mode

For high-concurrency scenarios, use cluster mode:

```javascript
// ecosystem.config.js
{
  instances: 'max',  // Use all CPU cores
  exec_mode: 'cluster'
}
```

**Note:** Ensure your application is cluster-compatible (stateless, no shared memory).

### Memory Optimization

```javascript
// ecosystem.config.js
{
  max_memory_restart: '1G',  // Restart if exceeds 1GB
  node_args: '--max-old-space-size=2048'  // Increase heap size
}
```

## Backup & Recovery

**Automatic Backups:**
```bash
# deploy.sh creates backups automatically
ls -lh /opt/netadx-aicore/backups/

# Manual backup
tar -czf backup_$(date +%Y%m%d_%H%M%S).tar.gz \
  --exclude 'node_modules' \
  --exclude '.git' \
  /opt/apps/netadx-aicore
```

**Rollback:**
```bash
# Using deploy.sh
cd deployment
./deploy.sh --rollback

# Manual rollback
cd /opt/netadx-aicore/backups
tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz -C /opt/apps/netadx-aicore
pm2 restart netadx-aicore
```

## Support

For deployment issues or questions:

- **Documentation**: Check this README and code comments
- **Issues**: https://github.com/netadx1ai/netadx-workspace/issues
- **Email**: NetADX AI-CORE Team

---

**Last Updated:** 2025-10-31  
**Version:** 1.0.0  
**Maintained by:** NetADX AI-CORE Team
