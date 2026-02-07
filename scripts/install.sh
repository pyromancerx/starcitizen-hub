#!/bin/bash
# Star Citizen Hub - Installation Script for Debian 13
# This script installs all dependencies and prepares the system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

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
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    libffi-dev \
    libssl-dev \
    curl \
    debian-keyring \
    debian-archive-keyring \
    apt-transport-https \
    gnupg

# Check Python version
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
log_info "Python version: $PYTHON_VERSION"

if [[ $(echo "$PYTHON_VERSION < 3.12" | bc -l) -eq 1 ]]; then
    log_error "Python 3.12 or higher is required. Found: $PYTHON_VERSION"
    exit 1
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
mkdir -p "$APP_DIR"
mkdir -p "$APP_DIR/data"
mkdir -p "$APP_DIR/logs"

# Copy application files
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

log_info "Copying application files..."
cp -r "$PROJECT_DIR/backend/"* "$APP_DIR/"

# Create Python virtual environment
log_info "Creating Python virtual environment..."
python3 -m venv "$APP_DIR/venv"

# Install Python dependencies
log_info "Installing Python dependencies..."
"$APP_DIR/venv/bin/pip" install --upgrade pip
"$APP_DIR/venv/bin/pip" install -r "$APP_DIR/requirements.txt"

# Set ownership
chown -R starcitizen-hub:starcitizen-hub "$APP_DIR"

# Create systemd service file
log_info "Creating systemd service..."
cat > /etc/systemd/system/starcitizen-hub.service << 'EOF'
[Unit]
Description=Star Citizen Hub API Server
After=network.target

[Service]
Type=exec
User=starcitizen-hub
Group=starcitizen-hub
WorkingDirectory=/opt/starcitizen-hub
Environment="PATH=/opt/starcitizen-hub/venv/bin"
ExecStart=/opt/starcitizen-hub/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
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
echo "     sudo $SCRIPT_DIR/setup.sh"
echo ""
echo "  2. The setup script will:"
echo "     - Ask for your domain name"
echo "     - Generate a secure secret key"
echo "     - Configure Caddy reverse proxy"
echo "     - Run database migrations"
echo "     - Start the services"
echo ""
