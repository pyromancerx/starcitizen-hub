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

usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --domain DOMAIN           Fully qualified domain name"
    echo "  --admin-email EMAIL       Initial admin user email"
    echo "  --admin-password PASS     Initial admin user password"
    echo "  --admin-name NAME         Initial admin display name"
    echo "  --admin-handle HANDLE     Initial admin RSI handle"
    echo "  --instance-name NAME      Name of this hub instance"
    echo "  --allow-reg true|false    Allow public registration"
    echo "  --require-approval t|f    Require admin approval for new users"
    echo "  --smtp-host HOST          SMTP server host"
    echo "  --smtp-port PORT          SMTP server port"
    echo "  --smtp-user USER          SMTP username"
    echo "  --smtp-pass PASS          SMTP password"
    echo "  --smtp-from ADDR          SMTP from address"
    echo "  --silent                  Non-interactive installation"
    echo "  --force-local             Force use of local source instead of GitHub"
    echo "  --help                    Show this help message"
    echo ""
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --domain) DOMAIN="$2"; shift 2 ;;
        --admin-email) ADMIN_EMAIL="$2"; shift 2 ;;
        --admin-password) ADMIN_PASSWORD="$2"; shift 2 ;;
        --admin-name) ADMIN_NAME="$2"; shift 2 ;;
        --admin-handle) ADMIN_HANDLE="$2"; shift 2 ;;
        --instance-name) INSTANCE_NAME="$2"; shift 2 ;;
        --allow-reg) ALLOW_REG="$2"; shift 2 ;;
        --require-approval) REQUIRE_APPROVAL="$2"; shift 2 ;;
        --smtp-host) SMTP_HOST="$2"; shift 2 ;;
        --smtp-port) SMTP_PORT="$2"; shift 2 ;;
        --smtp-user) SMTP_USER="$2"; shift 2 ;;
        --smtp-pass) SMTP_PASS="$2"; shift 2 ;;
        --smtp-from) SMTP_FROM="$2"; shift 2 ;;
        --silent) SILENT=true; shift ;;
        --force-local) FORCE_LOCAL=true; shift ;;
        --help) usage ;;
        *) log_error "Unknown option: $1"; usage ;;
    esac
done

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

# Run pre-flight check
if [[ -f "$SCRIPT_DIR/check_system.sh" ]]; then
    bash "$SCRIPT_DIR/check_system.sh"
fi

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
    if [[ "$FORCE_LOCAL" == "true" ]]; then
        USE_LOCAL=true
    elif [[ "$SILENT" == "true" ]]; then
        USE_LOCAL=false # Default to GitHub in silent mode unless forced local
    else
        log_info "Detected local repository at $BASE_DIR. Use local source? (y/N)"
        read -p "Selection: " SHOULD_USE_LOCAL
        if [[ "$SHOULD_USE_LOCAL" =~ ^[Yy]$ ]]; then
            USE_LOCAL=true
        fi
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

mkdir -p "$APP_DIR/data"
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
Environment=MIGRATIONS_PATH=./migrations
ExecStart=/opt/starcitizen-hub/backend-go/server
Restart=always
RestartSec=5

# Security hardening
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/opt/starcitizen-hub/data /opt/starcitizen-hub/logs /opt/starcitizen-hub/.env

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

# Build and tidy backend dependencies
log_info "Synchronizing Go dependencies..."
cd "$APP_DIR/backend-go"
go mod tidy

# Set ownership again after tidy
chown -R starcitizen-hub:starcitizen-hub "$APP_DIR"

log_info "Installation complete!"

# Prepare setup arguments
SETUP_ARGS=""
[[ -n "$DOMAIN" ]] && SETUP_ARGS="$SETUP_ARGS --domain $DOMAIN"
[[ -n "$ADMIN_EMAIL" ]] && SETUP_ARGS="$SETUP_ARGS --admin-email $ADMIN_EMAIL"
[[ -n "$ADMIN_PASSWORD" ]] && SETUP_ARGS="$SETUP_ARGS --admin-password $ADMIN_PASSWORD"
[[ -n "$ADMIN_NAME" ]] && SETUP_ARGS="$SETUP_ARGS --admin-name \"$ADMIN_NAME\""
[[ -n "$ADMIN_HANDLE" ]] && SETUP_ARGS="$SETUP_ARGS --admin-handle $ADMIN_HANDLE"
[[ -n "$INSTANCE_NAME" ]] && SETUP_ARGS="$SETUP_ARGS --instance-name \"$INSTANCE_NAME\""
[[ -n "$ALLOW_REG" ]] && SETUP_ARGS="$SETUP_ARGS --allow-reg $ALLOW_REG"
[[ -n "$REQUIRE_APPROVAL" ]] && SETUP_ARGS="$SETUP_ARGS --require-approval $REQUIRE_APPROVAL"
[[ -n "$SMTP_HOST" ]] && SETUP_ARGS="$SETUP_ARGS --smtp-host $SMTP_HOST"
[[ -n "$SMTP_PORT" ]] && SETUP_ARGS="$SETUP_ARGS --smtp-port $SMTP_PORT"
[[ -n "$SMTP_USER" ]] && SETUP_ARGS="$SETUP_ARGS --smtp-user $SMTP_USER"
[[ -n "$SMTP_PASS" ]] && SETUP_ARGS="$SETUP_ARGS --smtp-pass $SMTP_PASS"
[[ -n "$SMTP_FROM" ]] && SETUP_ARGS="$SETUP_ARGS --smtp-from $SMTP_FROM"
[[ "$SILENT" == "true" ]] && SETUP_ARGS="$SETUP_ARGS --silent"

log_info "Launching configuration wizard..."
bash "$APP_DIR/scripts/setup.sh" $SETUP_ARGS
