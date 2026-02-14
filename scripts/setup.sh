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
    echo "  --silent                  Non-interactive setup"
    echo "  --help                    Show this help message"
    echo ""
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --domain) ARG_DOMAIN="$2"; shift 2 ;;
        --admin-email) ARG_ADMIN_EMAIL="$2"; shift 2 ;;
        --admin-password) ARG_ADMIN_PASSWORD="$2"; shift 2 ;;
        --admin-name) ARG_ADMIN_NAME="$2"; shift 2 ;;
        --admin-handle) ARG_ADMIN_HANDLE="$2"; shift 2 ;;
        --instance-name) ARG_INSTANCE_NAME="$2"; shift 2 ;;
        --allow-reg) ARG_ALLOW_REG="$2"; shift 2 ;;
        --require-approval) ARG_REQUIRE_APPROVAL="$2"; shift 2 ;;
        --smtp-host) ARG_SMTP_HOST="$2"; shift 2 ;;
        --smtp-port) ARG_SMTP_PORT="$2"; shift 2 ;;
        --smtp-user) ARG_SMTP_USER="$2"; shift 2 ;;
        --smtp-pass) ARG_SMTP_PASS="$2"; shift 2 ;;
        --smtp-from) ARG_SMTP_FROM="$2"; shift 2 ;;
        --silent) SILENT=true; shift ;;
        --help) usage ;;
        *) log_error "Unknown option: $1"; usage ;;
    esac
done

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
if [[ -n "$ARG_DOMAIN" ]]; then
    DOMAIN_NAME="$ARG_DOMAIN"
elif [[ "$SILENT" == "true" ]]; then
    log_error "Domain name is required in silent mode. Use --domain"
    exit 1
else
    read -p "Enter your fully qualified domain name (e.g., hub.example.com): " DOMAIN_NAME
fi

if [[ -z "$DOMAIN_NAME" ]]; then
    log_error "Domain name cannot be empty"
    exit 1
fi

# Validate domain format (basic check)
if [[ ! "$DOMAIN_NAME" =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$ ]]; then
    log_warn "Domain name format may be invalid: $DOMAIN_NAME"
    if [[ "$SILENT" != "true" ]]; then
        read -p "Continue anyway? (y/N): " CONTINUE
        if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Load existing .env if it exists to preserve settings
if [[ -f "$APP_DIR/.env" ]]; then
    log_info "Found existing .env file. Loading current settings..."
    # Use grep to get values without exporting them to shell permanently
    EXISTING_SECRET=$(grep "^SECRET_KEY=" "$APP_DIR/.env" | cut -d'=' -f2-)
    EXISTING_INSTANCE=$(grep "^INSTANCE_NAME=" "$APP_DIR/.env" | cut -d'=' -f2-)
    EXISTING_REG=$(grep "^ALLOW_REGISTRATION=" "$APP_DIR/.env" | cut -d'=' -f2-)
    EXISTING_APPROVE=$(grep "^REQUIRE_APPROVAL=" "$APP_DIR/.env" | cut -d'=' -f2-)
    EXISTING_SMTP_HOST=$(grep "^SMTP_HOST=" "$APP_DIR/.env" | cut -d'=' -f2-)
    EXISTING_SMTP_PORT=$(grep "^SMTP_PORT=" "$APP_DIR/.env" | cut -d'=' -f2-)
    EXISTING_SMTP_USER=$(grep "^SMTP_USER=" "$APP_DIR/.env" | cut -d'=' -f2-)
    EXISTING_SMTP_PASS=$(grep "^SMTP_PASS=" "$APP_DIR/.env" | cut -d'=' -f2-)
    EXISTING_SMTP_FROM=$(grep "^SMTP_FROM=" "$APP_DIR/.env" | cut -d'=' -f2-)
fi

# Ask for instance name
if [[ -n "$ARG_INSTANCE_NAME" ]]; then
    INSTANCE_NAME="$ARG_INSTANCE_NAME"
elif [[ "$SILENT" == "true" ]]; then
    INSTANCE_NAME="${EXISTING_INSTANCE:-Star Citizen Hub}"
else
    read -p "Enter your hub instance name [${EXISTING_INSTANCE:-Star Citizen Hub}]: " INSTANCE_NAME
    INSTANCE_NAME="${INSTANCE_NAME:-${EXISTING_INSTANCE:-Star Citizen Hub}}"
fi

# Ask about registration settings
if [[ -n "$ARG_ALLOW_REG" ]]; then
    ALLOW_REGISTRATION="$ARG_ALLOW_REG"
elif [[ "$SILENT" == "true" ]]; then
    if [[ "${EXISTING_REG:-Y}" =~ ^[Yy]$ || "${EXISTING_REG}" == "true" ]]; then
        ALLOW_REGISTRATION="true"
    else
        ALLOW_REGISTRATION="false"
    fi
else
    read -p "Allow public registration? (Y/n) [Current: ${EXISTING_REG:-Y}]: " ALLOW_REG
    ALLOW_REG="${ALLOW_REG:-${EXISTING_REG:-Y}}"
    if [[ "$ALLOW_REG" =~ ^[Yy]$ || "$ALLOW_REG" == "true" ]]; then
        ALLOW_REGISTRATION="true"
    else
        ALLOW_REGISTRATION="false"
    fi
fi

if [[ -n "$ARG_REQUIRE_APPROVAL" ]]; then
    REQUIRE_APPROVAL="$ARG_REQUIRE_APPROVAL"
elif [[ "$SILENT" == "true" ]]; then
    if [[ "${EXISTING_APPROVE:-Y}" =~ ^[Yy]$ || "${EXISTING_APPROVE}" == "true" ]]; then
        REQUIRE_APPROVAL="true"
    else
        REQUIRE_APPROVAL="false"
    fi
else
    read -p "Require admin approval for new users? (Y/n) [Current: ${EXISTING_APPROVE:-Y}]: " REQUIRE_APPROVAL_INPUT
    REQUIRE_APPROVAL_INPUT="${REQUIRE_APPROVAL_INPUT:-${EXISTING_APPROVE:-Y}}"
    if [[ "$REQUIRE_APPROVAL_INPUT" =~ ^[Yy]$ || "$REQUIRE_APPROVAL_INPUT" == "true" ]]; then
        REQUIRE_APPROVAL="true"
    else
        REQUIRE_APPROVAL="false"
    fi
fi

# SMTP Configuration
if [[ -n "$ARG_SMTP_HOST" ]]; then
    SMTP_HOST="$ARG_SMTP_HOST"
elif [[ "$SILENT" == "true" ]]; then
    SMTP_HOST="${EXISTING_SMTP_HOST:-}"
else
    read -p "SMTP Server Host [${EXISTING_SMTP_HOST:-}]: " SMTP_HOST
    SMTP_HOST="${SMTP_HOST:-${EXISTING_SMTP_HOST:-}}"
fi

if [[ -n "$ARG_SMTP_PORT" ]]; then
    SMTP_PORT="$ARG_SMTP_PORT"
elif [[ "$SILENT" == "true" ]]; then
    SMTP_PORT="${EXISTING_SMTP_PORT:-587}"
else
    read -p "SMTP Server Port [${EXISTING_SMTP_PORT:-587}]: " SMTP_PORT
    SMTP_PORT="${SMTP_PORT:-${EXISTING_SMTP_PORT:-587}}"
fi

if [[ -n "$ARG_SMTP_USER" ]]; then
    SMTP_USER="$ARG_SMTP_USER"
elif [[ "$SILENT" == "true" ]]; then
    SMTP_USER="${EXISTING_SMTP_USER:-}"
else
    read -p "SMTP Username [${EXISTING_SMTP_USER:-}]: " SMTP_USER
    SMTP_USER="${SMTP_USER:-${EXISTING_SMTP_USER:-}}"
fi

if [[ -n "$ARG_SMTP_PASS" ]]; then
    SMTP_PASS="$ARG_SMTP_PASS"
elif [[ "$SILENT" == "true" ]]; then
    SMTP_PASS="${EXISTING_SMTP_PASS:-}"
else
    read -p "SMTP Password [${EXISTING_SMTP_PASS:-}]: " SMTP_PASS
    SMTP_PASS="${SMTP_PASS:-${EXISTING_SMTP_PASS:-}}"
fi

if [[ -n "$ARG_SMTP_FROM" ]]; then
    SMTP_FROM="$ARG_SMTP_FROM"
elif [[ "$SILENT" == "true" ]]; then
    SMTP_FROM="${EXISTING_SMTP_FROM:-noreply@hub.org}"
else
    read -p "SMTP From Address [${EXISTING_SMTP_FROM:-noreply@hub.org}]: " SMTP_FROM
    SMTP_FROM="${SMTP_FROM:-${EXISTING_SMTP_FROM:-noreply@hub.org}}"
fi

log_info "Preparing environment configuration..."
SECRET_KEY="${EXISTING_SECRET:-$(openssl rand -hex 32)}"

cat > "$APP_DIR/.env" << EOF
# Star Citizen Hub Configuration
# Generated on $(date)

# Database
DATABASE_URL=../data/hub.db
MIGRATIONS_PATH=./migrations

# Security - DO NOT SHARE THIS KEY
SECRET_KEY=$SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Instance Settings
INSTANCE_NAME=$INSTANCE_NAME
ALLOW_REGISTRATION=$ALLOW_REGISTRATION
REQUIRE_APPROVAL=$REQUIRE_APPROVAL
PORT=8000

# Email Integration
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS
SMTP_FROM=$SMTP_FROM
EOF

chown starcitizen-hub:starcitizen-hub "$APP_DIR/.env"
chmod 600 "$APP_DIR/.env"

log_info "Building backend..."
cd "$APP_DIR/backend-go"
go mod tidy
go build -o server ./cmd/server/main.go

# Create initial admin user
echo ""
echo -e "${CYAN}Creating Initial Admin User${NC}"

if [[ -n "$ARG_ADMIN_EMAIL" ]]; then
    ADMIN_EMAIL="$ARG_ADMIN_EMAIL"
    ADMIN_PASS="$ARG_ADMIN_PASSWORD"
    ADMIN_NAME="${ARG_ADMIN_NAME:-Administrator}"
    ADMIN_HANDLE="${ARG_ADMIN_HANDLE:-Admin}"
elif [[ "$SILENT" == "true" ]]; then
    log_warn "Admin credentials not provided in silent mode. Skipping admin creation."
    ADMIN_EMAIL=""
else
    read -p "Admin Email: " ADMIN_EMAIL
    read -s -p "Admin Password: " ADMIN_PASS
    echo ""
    read -p "Admin Display Name [Administrator]: " ADMIN_NAME
    ADMIN_NAME="${ADMIN_NAME:-Administrator}"
    read -p "Admin RSI Handle [Admin]: " ADMIN_HANDLE
    ADMIN_HANDLE="${ADMIN_HANDLE:-Admin}"
fi

if [[ -n "$ADMIN_EMAIL" ]] && [[ -n "$ADMIN_PASS" ]]; then
    log_info "Creating admin user: $ADMIN_EMAIL"
    ./server -create-admin -email "$ADMIN_EMAIL" -password "$ADMIN_PASS" -name "$ADMIN_NAME" -handle "$ADMIN_HANDLE"
else
    log_warn "Admin email or password empty. Skipping admin creation."
fi

log_info "Building frontend..."
cd "$APP_DIR/frontend-next"
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
    root * $APP_DIR/frontend-next/out
    file_server

    # Reverse proxy API requests to the Go backend
    handle /api* {
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
echo "Configuration file: $APP_DIR/.env"
echo ""
