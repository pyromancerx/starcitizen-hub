#!/bin/bash
# Star Citizen Hub - Installation Script for Debian 13
# This script installs all dependencies and prepares the system

set -e

# Repository URL
REPO_URL="https://github.com/pyromancerx/starcitizen-hub.git"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Detect script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    log_error "This script must be run as root (use sudo)"
    exit 1
fi

# Check if running on Debian
if ! grep -q "Debian" /etc/os-release 2>/dev/null; then
    log_warn "This script is designed for Debian 13. Proceeding anyway..."
fi

log_info "Starting Star Citizen Hub installation..."

# Update system packages
log_info "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install system dependencies
log_info "Installing system dependencies..."
apt-get install -y \
    build-essential \
    curl \
    git \
    bc \
    debian-keyring \
    debian-archive-keyring \
    apt-transport-https \
    gnupg \
    wget

# Install Go
log_info "Installing Go..."
if ! command -v go &> /dev/null; then
    GO_VERSION="1.24.4"
    wget "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz"
    rm -rf /usr/local/go && tar -C /usr/local -xzf "go${GO_VERSION}.linux-amd64.tar.gz"
    ln -sf /usr/local/go/bin/go /usr/bin/go
    rm "go${GO_VERSION}.linux-amd64.tar.gz"
    log_info "Go ${GO_VERSION} installed successfully"
else
    log_info "Go is already installed: $(go version)"
fi

# Install Caddy
log_info "Installing Caddy web server..."
if ! command -v caddy &> /dev/null; then
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt-get update
    apt-get install -y caddy
    log_info "Caddy installed successfully"
else
    log_info "Caddy is already installed"
fi

# Install Node.js
log_info "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    log_info "Node.js installed successfully"
else
    log_info "Node.js is already installed"
fi

# Create application user
log_info "Creating application user..."
if ! id "starcitizen-hub" &>/dev/null; then
    useradd --system --home /opt/starcitizen-hub --shell /bin/false starcitizen-hub
    log_info "User 'starcitizen-hub' created"
else
    log_info "User 'starcitizen-hub' already exists"
fi

# Create application directory
APP_DIR="/opt/starcitizen-hub"
log_info "Setting up application directory at $APP_DIR..."

# Check if we should use local source (if running from a clone)
USE_LOCAL=false
if [[ -d "$BASE_DIR/.git" ]] && [[ "$BASE_DIR" != "$APP_DIR" ]]; then
    log_info "Detected local repository at $BASE_DIR. Use local source? (y/N)"
    # Non-interactive check for CI/automated scripts
    if [[ "$FORCE_LOCAL" == "true" ]]; then
        USE_LOCAL=true
    fi
fi

if [[ "$USE_LOCAL" == "true" ]]; then
    log_info "Installing from local source: $BASE_DIR"
    mkdir -p "$APP_DIR"
    cp -r "$BASE_DIR/." "$APP_DIR/"
else
    # Clone or update repository from GitHub
    if [[ -d "$APP_DIR/.git" ]]; then
        log_info "Updating existing installation from git..."
        cd "$APP_DIR"
        git fetch origin
        git reset --hard origin/main
    else
        log_info "Cloning repository from GitHub..."
        rm -rf "$APP_DIR"
        git clone "$REPO_URL" "$APP_DIR"
    fi
fi

mkdir -p "$APP_DIR/backend/data"
mkdir -p "$APP_DIR/logs"

# Set ownership
chown -R starcitizen-hub:starcitizen-hub "$APP_DIR"

# Create systemd service file
log_info "Creating systemd service..."
cat > /etc/systemd/system/starcitizen-hub.service << 'EOF'
[Unit]
Description=Star Citizen Hub API Server (Go)
After=network.target

[Service]
Type=exec
User=starcitizen-hub
Group=starcitizen-hub
WorkingDirectory=/opt/starcitizen-hub/backend-go
ExecStart=/opt/starcitizen-hub/backend-go/server
Restart=always
RestartSec=5

# Security hardening
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/opt/starcitizen-hub/data /opt/starcitizen-hub/logs

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

log_info "Installation complete!"
echo ""
echo "============================================"
echo "  Star Citizen Hub - Installation Complete"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Run the setup script to configure your instance:"
echo "     sudo $APP_DIR/scripts/setup.sh"
echo ""
echo "  2. The setup script will:"
echo "     - Ask for your domain name"
echo "     - Generate a secure secret key"
echo "     - Configure Caddy reverse proxy"
echo "     - Run database migrations"
echo "     - Start the services"
echo ""
