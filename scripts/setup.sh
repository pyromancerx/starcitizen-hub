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

# Detect script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Use local directory if we are running from the source tree
if [[ -d "$BASE_DIR/.git" ]] && [[ -d "$BASE_DIR/backend" ]]; then
    APP_DIR="$BASE_DIR"
    log_info "Running setup from local source tree: $APP_DIR"
else
    APP_DIR="/opt/starcitizen-hub"
fi

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    log_error "This script must be run as root (use sudo)"
    exit 1
fi

# Failure handler
on_failure() {
    echo ""
    log_error "Setup failed! An error occurred during configuration."
    echo ""
    # Ensure SCRIPT_DIR is used to find uninstall.sh regardless of APP_DIR
    if [[ -f "$SCRIPT_DIR/uninstall.sh" ]]; then
        echo -e "${YELLOW}Setup incomplete. You can run the uninstall script to clean up partial changes.${NC}"
        read -p "Run uninstallation script now? (y/N): " SHOULD_UNINSTALL
        if [[ "$SHOULD_UNINSTALL" =~ ^[Yy]$ ]]; then
            log_info "Launching uninstallation script..."
            # Run without set -e context to avoid recursive failure if uninstall has issues
            bash "$SCRIPT_DIR/uninstall.sh"
        else
            log_warn "Installation left in partial state. Check logs above for details."
        fi
    else
        log_warn "Uninstallation script not found. Manual cleanup may be required."
    fi
    exit 1
}

# Trap errors
trap on_failure ERR

# Check if installation was completed

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
cd "$APP_DIR/backend-go"
# GORM handles auto-migration in main.go for now, but we could add a flag
go build -o server ./cmd/server/main.go
./server --migrate-only || true # Placeholder for future migration logic

log_info "Seeding initial data..."
# Seeding logic needs to be ported to Go or run via Python if still available
# For now, let's assume Go backend will handle basic seeding if DB empty

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

# Build the server before starting
cd "$APP_DIR/backend-go"
go build -o server ./cmd/server/main.go

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
