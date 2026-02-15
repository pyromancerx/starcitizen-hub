#!/bin/bash
# Star Citizen Hub - Update Script
# This script updates the application from GitHub

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Default APP_DIR
APP_DIR="/opt/starcitizen-hub"

# Auto-detect if not in /opt
if [[ ! -d "$APP_DIR" ]]; then
    # Assume we are in the project root or scripts directory
    if [[ -d "./.git" ]]; then
        APP_DIR=$(pwd)
    elif [[ -d "../.git" ]]; then
        APP_DIR=$(cd .. && pwd)
    fi
fi

# Check if installation exists
if [[ ! -d "$APP_DIR/.git" ]]; then
    log_error "Installation not found or not a git repository."
    exit 1
fi

# Parse flags
SKIP_CONFIRM=false
for arg in "$@"; do
    if [[ "$arg" == "--yes" || "$arg" == "-y" ]]; then
        SKIP_CONFIRM=true
    fi
done

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  Star Citizen Hub - Update${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# Get current version
cd "$APP_DIR"
CURRENT_COMMIT=$(git rev-parse --short HEAD)
log_info "Current version: $CURRENT_COMMIT"

# Run pre-flight check
if [[ -f "$APP_DIR/scripts/check_system.sh" ]]; then
    bash "$APP_DIR/scripts/check_system.sh"
fi

# Fetch updates
log_info "Checking for updates..."
git fetch origin

# Check if updates are available
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [[ "$LOCAL" == "$REMOTE" ]]; then
    log_info "Already up to date!"
    exit 0
fi

# Show what will be updated
log_info "Updates available:"
git log --oneline HEAD..origin/main

if [ "$SKIP_CONFIRM" = false ]; then
    echo ""
    read -p "Apply these updates? (Y/n): " CONFIRM
    CONFIRM="${CONFIRM:-Y}"

    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        log_info "Update cancelled"
        exit 0
    fi
fi

# Stop the service (only if it exists and is managed by systemd)
log_info "Stopping service..."
if systemctl list-unit-files | grep -q starcitizen-hub.service; then
    sudo systemctl stop starcitizen-hub || true
fi

# Pull updates
log_info "Pulling updates from GitHub..."
git reset --hard origin/main

NEW_COMMIT=$(git rev-parse --short HEAD)
log_info "Updated to: $NEW_COMMIT"

# Migrate .env if still in old location
if [[ -f "$APP_DIR/backend/.env" ]] && [[ ! -f "$APP_DIR/.env" ]]; then
    log_info "Migrating configuration to root directory..."
    cp "$APP_DIR/backend/.env" "$APP_DIR/.env"
    # Update DATABASE_URL in migrated file for Go backend
    sed -i 's|DATABASE_URL=sqlite+aiosqlite:///./data/hub.db|DATABASE_URL=../data/hub.db|' "$APP_DIR/.env"
    echo "PORT=8000" >> "$APP_DIR/.env"
fi

# Ensure data directory exists in new location
if [[ ! -d "$APP_DIR/data" ]] && [[ -d "$APP_DIR/backend/data" ]]; then
    log_info "Migrating database to new data directory..."
    mv "$APP_DIR/backend/data" "$APP_DIR/data"
fi
mkdir -p "$APP_DIR/data"

# Build Backend
log_info "Downloading Go dependencies..."
cd "$APP_DIR/backend-go"
go mod tidy

log_info "Building Go backend..."
go build -o server ./cmd/server/main.go

# Fix Caddyfile if it uses old handle_path logic
if grep -q "handle_path /api\*" /etc/caddy/Caddyfile 2>/dev/null; then
    log_info "Fixing Caddy API routing..."
    sudo sed -i 's/handle_path \/api\*/handle \/api\*/g' /etc/caddy/Caddyfile
    sudo systemctl reload caddy
fi

# Update Frontend
log_info "Updating frontend..."
cd "$APP_DIR/frontend-next"
npm install
npm run build

# Restart the service
log_info "Starting service..."
sudo systemctl start starcitizen-hub
sudo systemctl restart caddy

# Wait for service to start
sleep 2

# Check service status
if sudo systemctl is-active --quiet starcitizen-hub; then
    log_info "Service is running"
else
    log_error "Service failed to start"
    log_error "Check logs with: journalctl -u starcitizen-hub"
    exit 1
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Update Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Updated from $CURRENT_COMMIT to $NEW_COMMIT"
echo ""
