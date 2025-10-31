#!/bin/bash

# Quick TypeScript Deployment for NetADX AI-CORE
# Syncs TypeScript source files directly (no build needed - tsx handles it)

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
SERVER_HOST="${DEPLOY_HOST:-localhost}"
SERVER_USER="${DEPLOY_USER:-$(whoami)}"
SSH_KEY_PATH="${SSH_KEY_PATH:-$HOME/.ssh/id_rsa}"
DEPLOYMENT_PATH="${DEPLOY_PATH:-/opt/apps/netadx-aicore}"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_NAME="${SERVICE_NAME:-netadx-aicore}"

# Check for .env.deploy file
if [ -f "$SOURCE_DIR/.env.deploy" ]; then
    source "$SOURCE_DIR/.env.deploy"
fi

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Quick TypeScript Deployment - NetADX AI-CORE ║${NC}"
echo -e "${BLUE}║  No compilation - tsx runs .ts directly       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Parse arguments
FILE_PATTERN="${1:-src/}"
SKIP_RESTART="${2:-false}"

echo -e "${YELLOW}→ Source:${NC} $SOURCE_DIR"
echo -e "${YELLOW}→ Target:${NC} $SERVER_USER@$SERVER_HOST:$DEPLOYMENT_PATH"
echo -e "${YELLOW}→ Syncing:${NC} $FILE_PATTERN"
echo -e "${YELLOW}→ Service:${NC} $SERVICE_NAME"
echo ""

# Validate SSH connection
echo -e "${BLUE}[0/4]${NC} Validating SSH connection..."
if ! ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=5 "$SERVER_USER@$SERVER_HOST" "echo 'SSH OK'" &> /dev/null; then
    echo -e "${RED}✗${NC} SSH connection failed"
    echo -e "${YELLOW}→${NC} Check SSH_KEY_PATH: $SSH_KEY_PATH"
    echo -e "${YELLOW}→${NC} Check SERVER_HOST: $SERVER_HOST"
    echo -e "${YELLOW}→${NC} Check SERVER_USER: $SERVER_USER"
    exit 1
fi
echo -e "${GREEN}✓${NC} SSH connection validated"
echo ""

# Check if specific file or directory
if [ -f "$SOURCE_DIR/$FILE_PATTERN" ]; then
    echo -e "${BLUE}[1/4]${NC} Deploying single file: $FILE_PATTERN"
    # Upload to temp location first, then sudo move
    TEMP_PATH="/tmp/netadx_aicore_deploy_$(date +%s)"
    scp -i "$SSH_KEY_PATH" "$SOURCE_DIR/$FILE_PATTERN" \
        "$SERVER_USER@$SERVER_HOST:$TEMP_PATH"
    ssh -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_HOST" "sudo mv $TEMP_PATH $DEPLOYMENT_PATH/$FILE_PATTERN"
else
    echo -e "${BLUE}[1/4]${NC} Syncing directory: $FILE_PATTERN"
    # Upload to temp location first, then sudo rsync
    TEMP_PATH="/tmp/netadx_aicore_deploy_$(date +%s)"
    rsync -avz --delete \
        -e "ssh -i $SSH_KEY_PATH" \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude 'dist' \
        --exclude 'coverage' \
        --exclude '*.log' \
        --exclude '.DS_Store' \
        --exclude '.env' \
        --exclude '.env.local' \
        "$SOURCE_DIR/$FILE_PATTERN" \
        "$SERVER_USER@$SERVER_HOST:$TEMP_PATH/"
    
    ssh -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_HOST" << REMOTE
        sudo mkdir -p $DEPLOYMENT_PATH
        sudo rsync -a --delete $TEMP_PATH/ $DEPLOYMENT_PATH/$FILE_PATTERN
        sudo rm -rf $TEMP_PATH
REMOTE
fi

echo -e "${GREEN}✓${NC} Files deployed"
echo ""

# Install/update dependencies if package.json changed
if [ "$FILE_PATTERN" == "package.json" ] || [ "$FILE_PATTERN" == "package-lock.json" ]; then
    echo -e "${BLUE}[2/4]${NC} Installing dependencies..."
    ssh -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_HOST" << REMOTE
        cd $DEPLOYMENT_PATH
        sudo npm ci --production
REMOTE
    echo -e "${GREEN}✓${NC} Dependencies installed"
    echo ""
else
    echo -e "${BLUE}[2/4]${NC} Skipping dependency installation"
    echo ""
fi

# Restart service
if [ "$SKIP_RESTART" != "true" ]; then
    echo -e "${BLUE}[3/4]${NC} Restarting PM2 service..."
    ssh -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_HOST" << REMOTE
        cd $DEPLOYMENT_PATH
        sudo pm2 restart $SERVICE_NAME || sudo pm2 start ecosystem.config.js --name $SERVICE_NAME
        echo "Service restarted"
REMOTE
    echo -e "${GREEN}✓${NC} Service restarted"
    echo ""
else
    echo -e "${BLUE}[3/4]${NC} Skipping service restart (--skip-restart)"
    echo ""
fi

# Health check
echo -e "${BLUE}[4/4]${NC} Health check..."
sleep 3

HEALTH_URL="${HEALTH_CHECK_URL:-http://$SERVER_HOST:8005/health}"
if curl -s --connect-timeout 5 "$HEALTH_URL" | grep -q "healthy"; then
    echo -e "${GREEN}✓${NC} API is healthy"
else
    echo -e "${YELLOW}⚠${NC}  API health check inconclusive (URL: $HEALTH_URL)"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Deployment Complete                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Service: ${BLUE}$SERVICE_NAME${NC}"
echo -e "Path: ${BLUE}$DEPLOYMENT_PATH${NC}"
echo -e "Logs: ${YELLOW}ssh -i $SSH_KEY_PATH $SERVER_USER@$SERVER_HOST 'sudo pm2 logs $SERVICE_NAME'${NC}"
echo -e "Status: ${YELLOW}ssh -i $SSH_KEY_PATH $SERVER_USER@$SERVER_HOST 'sudo pm2 status $SERVICE_NAME'${NC}"
echo ""
