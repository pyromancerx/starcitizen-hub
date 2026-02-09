#!/bin/bash
# Star Citizen Hub - Setup Script
# This script configures the application after installation

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

# Check if installation was completed
if [[ ! -d "$APP_DIR/venv" ]]; then
    log_error "Installation not found. Please run install.sh first."
    exit 1
fi

echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  Star Citizen Hub - Setup Configuration${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# Ask for domain name
read -p "Enter your fully qualified domain name (e.g., hub.example.com): " DOMAIN_NAME

if [[ -z "$DOMAIN_NAME" ]]; then
    log_error "Domain name cannot be empty"
    exit 1
fi

# Validate domain format (basic check)
if [[ ! "$DOMAIN_NAME" =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$ ]]; then
    log_warn "Domain name format may be invalid: $DOMAIN_NAME"
    read -p "Continue anyway? (y/N): " CONTINUE
    if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Ask for instance name
read -p "Enter your hub instance name [Star Citizen Hub]: " INSTANCE_NAME
INSTANCE_NAME="${INSTANCE_NAME:-Star Citizen Hub}"

# Ask about registration settings
read -p "Allow public registration? (Y/n): " ALLOW_REG
ALLOW_REG="${ALLOW_REG:-Y}"
if [[ "$ALLOW_REG" =~ ^[Yy]$ ]]; then
    ALLOW_REGISTRATION="true"
else
    ALLOW_REGISTRATION="false"
fi

read -p "Require admin approval for new users? (Y/n): " REQUIRE_APPROVAL_INPUT
REQUIRE_APPROVAL_INPUT="${REQUIRE_APPROVAL_INPUT:-Y}"
if [[ "$REQUIRE_APPROVAL_INPUT" =~ ^[Yy]$ ]]; then
    REQUIRE_APPROVAL="true"
else
    REQUIRE_APPROVAL="false"
fi

log_info "Generating secure secret key..."
SECRET_KEY=$(openssl rand -hex 32)

log_info "Creating environment configuration..."
cat > "$APP_DIR/backend/.env" << EOF
# Star Citizen Hub Configuration
# Generated on $(date)

# Database
DATABASE_URL=sqlite+aiosqlite:///./data/hub.db

# Security - DO NOT SHARE THIS KEY
SECRET_KEY=$SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Instance Settings
INSTANCE_NAME=$INSTANCE_NAME
ALLOW_REGISTRATION=$ALLOW_REGISTRATION
REQUIRE_APPROVAL=$REQUIRE_APPROVAL
EOF

chown starcitizen-hub:starcitizen-hub "$APP_DIR/backend/.env"
chmod 600 "$APP_DIR/backend/.env"

log_info "Running database migrations..."
cd "$APP_DIR/backend"
sudo -u starcitizen-hub "$APP_DIR/venv/bin/alembic" upgrade head

log_info "Seeding initial data..."
sudo -u starcitizen-hub "$APP_DIR/venv/bin/python" -m app.tasks.seed

log_info "Building frontend..."
cd "$APP_DIR/frontend"
npm install
npm run build

# Ensure correct ownership after build
chown -R starcitizen-hub:starcitizen-hub "$APP_DIR"

log_info "Configuring Caddy reverse proxy..."
cat > /etc/caddy/Caddyfile << EOF
# Star Citizen Hub - Caddy Configuration
# Domain: $DOMAIN_NAME

$DOMAIN_NAME {
    # Serve frontend static files
    root * $APP_DIR/frontend/dist
    file_server

    # Reverse proxy API requests to the FastAPI backend
    handle_path /api* {
        reverse_proxy 127.0.0.1:8000
    }

    # Fallback to index.html for SPA routing
    handle {
        try_files {path} /index.html
    }

    # Enable compression
    encode gzip zstd

    # Security headers
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        X-XSS-Protection "1; mode=block"
        Referrer-Policy strict-origin-when-cross-origin
        -Server
    }

    # Logging
    log {
        output file /var/log/caddy/starcitizen-hub.log {
            roll_size 10mb
            roll_keep 5
        }
    }
}
EOF

# Create Caddy log directory
mkdir -p /var/log/caddy
chown caddy:caddy /var/log/caddy

log_info "Enabling and starting services..."

# Enable and start the application service
systemctl enable starcitizen-hub
systemctl restart starcitizen-hub

# Reload and restart Caddy
systemctl enable caddy
systemctl restart caddy

# Wait a moment for services to start
sleep 2

# Check service status
if systemctl is-active --quiet starcitizen-hub; then
    log_info "Star Citizen Hub service is running"
else
    log_error "Star Citizen Hub service failed to start"
    log_error "Check logs with: journalctl -u starcitizen-hub"
fi

if systemctl is-active --quiet caddy; then
    log_info "Caddy service is running"
else
    log_error "Caddy service failed to start"
    log_error "Check logs with: journalctl -u caddy"
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Star Citizen Hub - Setup Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Your Star Citizen Hub is now available at:"
echo -e "  ${CYAN}https://$DOMAIN_NAME${NC}"
echo ""
echo "Caddy will automatically obtain an SSL certificate from Let's Encrypt."
echo "This may take a moment on first access."
echo ""
echo "Useful commands:"
echo "  View app logs:     journalctl -u starcitizen-hub -f"
echo "  View Caddy logs:   journalctl -u caddy -f"
echo "  Restart app:       systemctl restart starcitizen-hub"
echo "  Restart Caddy:     systemctl restart caddy"
echo "  Check status:      systemctl status starcitizen-hub"
echo ""
echo "Configuration file: $APP_DIR/backend/.env"
echo ""
