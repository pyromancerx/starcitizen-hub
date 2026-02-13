#!/bin/bash
# Star Citizen Hub - Uninstall Script
# This script removes the application from the system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

echo ""
echo -e "${RED}============================================${NC}"
echo -e "${RED}  Star Citizen Hub - Uninstall${NC}"
echo -e "${RED}============================================${NC}"
echo ""
echo "This will remove:"
echo "  - Star Citizen Hub application"
echo "  - Systemd service"
echo "  - Application user"
echo ""
echo -e "${YELLOW}WARNING: This will NOT remove:${NC}"
echo "  - Caddy web server"
echo "  - Database backups (if any)"
echo ""

read -p "Are you sure you want to uninstall? (y/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    log_info "Uninstall cancelled"
    exit 0
fi

# Ask about data preservation
read -p "Do you want to preserve the database? (Y/n): " PRESERVE_DB
PRESERVE_DB="${PRESERVE_DB:-Y}"

log_info "Stopping services..."
systemctl stop starcitizen-hub 2>/dev/null || true
systemctl disable starcitizen-hub 2>/dev/null || true

log_info "Removing systemd service..."
rm -f /etc/systemd/system/starcitizen-hub.service
systemctl daemon-reload

if [[ "$PRESERVE_DB" =~ ^[Yy]$ ]]; then
    log_info "Preserving database..."
    BACKUP_DIR="/root/starcitizen-hub-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp -r "$APP_DIR/backend/data" "$BACKUP_DIR/" 2>/dev/null || true
    cp "$APP_DIR/.env" "$BACKUP_DIR/" 2>/dev/null || true
    log_info "Database backed up to: $BACKUP_DIR"
fi

log_info "Removing application directory..."
rm -rf "$APP_DIR"

log_info "Removing application user..."
userdel starcitizen-hub 2>/dev/null || true

log_info "Removing Caddy configuration..."
rm -f /etc/caddy/Caddyfile
rm -rf /var/log/caddy
systemctl restart caddy 2>/dev/null || true

echo ""
log_info "Uninstall complete!"
echo ""
if [[ "$PRESERVE_DB" =~ ^[Yy]$ ]]; then
    echo "Database backup location: $BACKUP_DIR"
fi
echo ""
