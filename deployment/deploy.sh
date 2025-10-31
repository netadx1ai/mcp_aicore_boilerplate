#!/bin/bash

###############################################################################
# NetADX AI-CORE - Production Deployment Script
# 
# Description: Automated deployment script for MCP API servers
# Author: NetADX AI-CORE Team
# Version: 1.0.0
# 
# Usage:
#   ./deploy.sh [OPTIONS]
#
# Options:
#   --env <env>       Environment (dev|staging|production) [default: production]
#   --server <name>   Server name to deploy (all|v5-aiva-api|etc)
#   --method <type>   Deployment method (pm2|docker|systemd) [default: pm2]
#   --build-only      Only build, don't deploy
#   --restart         Restart existing deployment
#   --rollback        Rollback to previous version
#   --help            Show this help message
#
# Examples:
#   ./deploy.sh --env production --server all --method pm2
#   ./deploy.sh --env staging --server v5-aiva-api --restart
#   ./deploy.sh --build-only
###############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
ENVIRONMENT="production"
SERVER_NAME="all"
DEPLOY_METHOD="pm2"
BUILD_ONLY=false
RESTART_ONLY=false
ROLLBACK=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Deployment paths
DEPLOY_DIR="/opt/netadx-aicore"
BACKUP_DIR="/opt/netadx-aicore/backups"
LOG_DIR="/var/log/netadx-aicore"

# Function: Print colored message
print_message() {
    local color=$1
    shift
    echo -e "${color}[$(date +'%Y-%m-%d %H:%M:%S')] $@${NC}"
}

info() { print_message "$BLUE" "INFO: $@"; }
success() { print_message "$GREEN" "SUCCESS: $@"; }
warning() { print_message "$YELLOW" "WARNING: $@"; }
error() { print_message "$RED" "ERROR: $@"; }

# Function: Show help
show_help() {
    cat << EOF
NetADX AI-CORE Deployment Script

Usage: $0 [OPTIONS]

Options:
  --env <env>       Environment (dev|staging|production) [default: production]
  --server <name>   Server name to deploy (all|v5-aiva-api|etc)
  --method <type>   Deployment method (pm2|docker|systemd) [default: pm2]
  --build-only      Only build, don't deploy
  --restart         Restart existing deployment
  --rollback        Rollback to previous version
  --help            Show this help message

Examples:
  $0 --env production --server all --method pm2
  $0 --env staging --server v5-aiva-api --restart
  $0 --build-only

EOF
    exit 0
}

# Function: Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --env)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --server)
                SERVER_NAME="$2"
                shift 2
                ;;
            --method)
                DEPLOY_METHOD="$2"
                shift 2
                ;;
            --build-only)
                BUILD_ONLY=true
                shift
                ;;
            --restart)
                RESTART_ONLY=true
                shift
                ;;
            --rollback)
                ROLLBACK=true
                shift
                ;;
            --help)
                show_help
                ;;
            *)
                error "Unknown option: $1"
                show_help
                ;;
        esac
    done
}

# Function: Check prerequisites
check_prerequisites() {
    info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js not found. Please install Node.js 18+"
        exit 1
    fi
    
    local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        error "Node.js version must be 18 or higher. Current: $(node -v)"
        exit 1
    fi
    success "Node.js $(node -v) found"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm not found"
        exit 1
    fi
    success "npm $(npm -v) found"
    
    # Check deployment method specific tools
    case $DEPLOY_METHOD in
        pm2)
            if ! command -v pm2 &> /dev/null; then
                warning "PM2 not found. Installing PM2..."
                npm install -g pm2
            fi
            success "PM2 $(pm2 -v) found"
            ;;
        docker)
            if ! command -v docker &> /dev/null; then
                error "Docker not found. Please install Docker"
                exit 1
            fi
            success "Docker $(docker -v | cut -d' ' -f3 | tr -d ',') found"
            ;;
        systemd)
            if ! command -v systemctl &> /dev/null; then
                error "systemd not found"
                exit 1
            fi
            success "systemd found"
            ;;
    esac
}

# Function: Create backup
create_backup() {
    if [ -d "$DEPLOY_DIR" ]; then
        info "Creating backup..."
        
        mkdir -p "$BACKUP_DIR"
        local timestamp=$(date +'%Y%m%d_%H%M%S')
        local backup_path="$BACKUP_DIR/backup_$timestamp.tar.gz"
        
        tar -czf "$backup_path" -C "$DEPLOY_DIR" . 2>/dev/null || true
        success "Backup created: $backup_path"
        
        # Keep only last 5 backups
        ls -t "$BACKUP_DIR"/backup_*.tar.gz | tail -n +6 | xargs rm -f 2>/dev/null || true
    fi
}

# Function: Rollback to previous version
rollback_deployment() {
    info "Rolling back to previous version..."
    
    local latest_backup=$(ls -t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | head -n 1)
    
    if [ -z "$latest_backup" ]; then
        error "No backup found for rollback"
        exit 1
    fi
    
    info "Restoring from: $latest_backup"
    
    # Stop current deployment
    case $DEPLOY_METHOD in
        pm2)
            pm2 stop all 2>/dev/null || true
            ;;
        docker)
            docker-compose down 2>/dev/null || true
            ;;
        systemd)
            systemctl stop netadx-aicore-* 2>/dev/null || true
            ;;
    esac
    
    # Restore backup
    rm -rf "$DEPLOY_DIR"
    mkdir -p "$DEPLOY_DIR"
    tar -xzf "$latest_backup" -C "$DEPLOY_DIR"
    
    # Restart
    case $DEPLOY_METHOD in
        pm2)
            pm2 start all
            ;;
        docker)
            docker-compose up -d
            ;;
        systemd)
            systemctl start netadx-aicore-*
            ;;
    esac
    
    success "Rollback completed successfully"
    exit 0
}

# Function: Install dependencies
install_dependencies() {
    info "Installing dependencies..."
    
    cd "$PROJECT_ROOT"
    npm ci --production=false
    
    success "Dependencies installed"
}

# Function: Build project (skipped - using tsx for direct TS execution)
build_project() {
    info "Skipping build step - using tsx for direct TypeScript execution"
    
    cd "$PROJECT_ROOT"
    
    # Just ensure tsx is available
    if ! npm list tsx &> /dev/null; then
        warning "tsx not found in dependencies, installing..."
        npm install tsx
    fi
    
    success "TypeScript runtime (tsx) verified"
}

# Function: Run tests
run_tests() {
    info "Running tests..."
    
    cd "$PROJECT_ROOT"
    npm test || {
        error "Tests failed"
        exit 1
    }
    
    success "All tests passed"
}

# Function: Deploy with PM2
deploy_pm2() {
    info "Deploying with PM2..."
    
    local ecosystem_file="$SCRIPT_DIR/pm2/ecosystem.config.js"
    
    if [ ! -f "$ecosystem_file" ]; then
        error "PM2 ecosystem file not found: $ecosystem_file"
        exit 1
    fi
    
    # Copy files to deployment directory
    info "Copying files to $DEPLOY_DIR..."
    mkdir -p "$DEPLOY_DIR"
    rsync -av --delete \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude 'tests' \
        --exclude 'examples' \
        --exclude 'dist' \
        --exclude 'coverage' \
        "$PROJECT_ROOT/" "$DEPLOY_DIR/"
    
    cd "$DEPLOY_DIR"
    
    # Install ALL dependencies (including tsx for running TypeScript)
    npm ci
    
    # Load environment-specific configuration
    if [ -f ".env.$ENVIRONMENT" ]; then
        cp ".env.$ENVIRONMENT" .env
    fi
    
    # Start/Restart with PM2
    if $RESTART_ONLY; then
        pm2 restart "$ecosystem_file" --env $ENVIRONMENT
    else
        pm2 delete all 2>/dev/null || true
        pm2 start "$ecosystem_file" --env $ENVIRONMENT
    fi
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup script
    pm2 startup systemd -u $USER --hp $HOME 2>/dev/null || true
    
    success "PM2 deployment completed"
}

# Function: Deploy with Docker
deploy_docker() {
    info "Deploying with Docker..."
    
    local compose_file="$SCRIPT_DIR/docker/docker-compose.yml"
    
    if [ ! -f "$compose_file" ]; then
        error "Docker Compose file not found: $compose_file"
        exit 1
    fi
    
    cd "$SCRIPT_DIR/docker"
    
    # Build Docker images
    docker-compose build
    
    # Stop existing containers
    docker-compose down
    
    # Start containers
    docker-compose up -d
    
    success "Docker deployment completed"
}

# Function: Deploy with systemd
deploy_systemd() {
    info "Deploying with systemd..."
    
    # Copy files to deployment directory
    mkdir -p "$DEPLOY_DIR"
    rsync -av --delete \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude 'dist' \
        --exclude 'coverage' \
        "$PROJECT_ROOT/" "$DEPLOY_DIR/"
    
    cd "$DEPLOY_DIR"
    npm ci
    
    # Create systemd service files
    local service_dir="/etc/systemd/system"
    local service_file="$service_dir/netadx-aicore.service"
    
    sudo tee "$service_file" > /dev/null << EOF
[Unit]
Description=NetADX AI-CORE MCP API Server
After=network.target mongodb.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$DEPLOY_DIR
Environment="NODE_ENV=$ENVIRONMENT"
EnvironmentFile=$DEPLOY_DIR/.env
ExecStart=$(which npx) tsx src/index.ts
Restart=always
RestartSec=10
StandardOutput=append:$LOG_DIR/aicore.log
StandardError=append:$LOG_DIR/aicore-error.log

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd
    sudo systemctl daemon-reload
    
    # Enable and start service
    sudo systemctl enable netadx-aicore.service
    sudo systemctl restart netadx-aicore.service
    
    success "systemd deployment completed"
}

# Function: Deploy server
deploy_server() {
    info "Starting deployment process..."
    info "Environment: $ENVIRONMENT"
    info "Server: $SERVER_NAME"
    info "Method: $DEPLOY_METHOD"
    
    # Create backup before deployment
    create_backup
    
    # Install dependencies and build
    install_dependencies
    build_project
    
    if $BUILD_ONLY; then
        success "Build-only mode: Deployment skipped"
        exit 0
    fi
    
    # Run tests in non-production environments
    if [ "$ENVIRONMENT" != "production" ]; then
        run_tests
    fi
    
    # Deploy based on method
    case $DEPLOY_METHOD in
        pm2)
            deploy_pm2
            ;;
        docker)
            deploy_docker
            ;;
        systemd)
            deploy_systemd
            ;;
        *)
            error "Unknown deployment method: $DEPLOY_METHOD"
            exit 1
            ;;
    esac
    
    success "Deployment completed successfully!"
}

# Function: Show deployment status
show_status() {
    info "Deployment Status:"
    
    case $DEPLOY_METHOD in
        pm2)
            pm2 status
            pm2 logs --lines 20
            ;;
        docker)
            docker-compose ps
            docker-compose logs --tail=20
            ;;
        systemd)
            systemctl status netadx-aicore.service
            sudo journalctl -u netadx-aicore.service -n 20
            ;;
    esac
}

# Main execution
main() {
    parse_args "$@"
    
    info "=== NetADX AI-CORE Deployment Script ==="
    
    # Handle rollback
    if $ROLLBACK; then
        rollback_deployment
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Create necessary directories
    sudo mkdir -p "$DEPLOY_DIR" "$BACKUP_DIR" "$LOG_DIR"
    sudo chown -R $USER:$USER "$DEPLOY_DIR" "$BACKUP_DIR" "$LOG_DIR"
    
    # Deploy
    deploy_server
    
    # Show status
    show_status
    
    success "All done! 🚀"
}

# Run main function
main "$@"
