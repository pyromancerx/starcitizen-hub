#!/bin/bash
# Star Citizen Hub - User Administration Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Detect script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$BASE_DIR/backend-go"
SERVER_BIN="$BACKEND_DIR/server"

# Check if binary exists, build if not
if [[ ! -f "$SERVER_BIN" ]]; then
    echo "Backend binary not found. Building..."
    cd "$BACKEND_DIR"
    go build -o server ./cmd/server/main.go
    cd "$BASE_DIR"
fi

show_help() {
    echo -e "${CYAN}Star Citizen Hub - User Administration${NC}"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  list                List all users"
    echo "  add                 Add a new user"
    echo "  delete [email]      Delete a user by email"
    echo "  approve [email]     Approve a user by email"
    echo "  help                Show this help"
    echo ""
}

case "$1" in
    list)
        cd "$BACKEND_DIR" && ./server -action list-users
        ;;
    add)
        read -p "Email: " EMAIL
        read -s -p "Password: " PASSWORD
        echo ""
        read -p "Display Name: " NAME
        read -p "RSI Handle: " HANDLE
        read -p "Is Admin? (y/N): " IS_ADMIN
        
        ADMIN_FLAG=""
        if [[ "$IS_ADMIN" =~ ^[Yy]$ ]]; then
            ADMIN_FLAG="-admin"
        fi
        
        cd "$BACKEND_DIR" && ./server -action create-user -email "$EMAIL" -password "$PASSWORD" -name "$NAME" -handle "$HANDLE" $ADMIN_FLAG
        ;;
    delete)
        EMAIL="$2"
        if [[ -z "$EMAIL" ]]; then
            read -p "Enter email of user to delete: " EMAIL
        fi
        if [[ -z "$EMAIL" ]]; then
            echo -e "${RED}Error: Email required${NC}"
            exit 1
        fi
        read -p "Are you sure you want to delete $EMAIL? (y/N): " CONFIRM
        if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
            cd "$BACKEND_DIR" && ./server -action delete-user -email "$EMAIL"
        else
            echo "Cancelled."
        fi
        ;;
    approve)
        EMAIL="$2"
        if [[ -z "$EMAIL" ]]; then
            read -p "Enter email of user to approve: " EMAIL
        fi
        if [[ -z "$EMAIL" ]]; then
            echo -e "${RED}Error: Email required${NC}"
            exit 1
        fi
        cd "$BACKEND_DIR" && ./server -action approve-user -email "$EMAIL"
        ;;
    help|*)
        show_help
        ;;
esac
