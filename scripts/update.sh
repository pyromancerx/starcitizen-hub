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

APP_DIR="/opt/starcitizen-hub"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    log_error "This script must be run as root (use sudo)"
    exit 1
fi

# Check if installation exists
if [[ ! -d "$APP_DIR/.git" ]]; then
    log_error "Installation not found or not a git repository."
    log_error "Please run install.sh first."
    exit 1
fi

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  Star Citizen Hub - Update${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# Get current version
cd "$APP_DIR"
CURRENT_COMMIT=$(git rev-parse --short HEAD)
log_info "Current version: $CURRENT_COMMIT"

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

echo ""
read -p "Apply these updates? (Y/n): " CONFIRM
CONFIRM="${CONFIRM:-Y}"

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    log_info "Update cancelled"
    exit 0
fi

# Stop the service
log_info "Stopping service..."
systemctl stop starcitizen-hub

# Pull updates
log_info "Pulling updates from GitHub..."
git reset --hard origin/main

NEW_COMMIT=$(git rev-parse --short HEAD)
log_info "Updated to: $NEW_COMMIT"

# Build Backend
log_info "Building Go backend..."
cd "$APP_DIR/backend-go"
go build -o server ./cmd/server/main.go

# Update Frontend
log_info "Updating frontend..."
cd "$APP_DIR/frontend"
npm install
npm run build

# Restart the service
log_info "Starting service..."
systemctl start starcitizen-hub
systemctl restart caddy

# Wait for service to start
sleep 2

# Check service status
if systemctl is-active --quiet starcitizen-hub; then
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
