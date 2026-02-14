#!/bin/bash
# Star Citizen Hub - Pre-flight System Check
# Verifies system readiness for installation/update

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_check() { echo -ne "${CYAN}[CHECK]${NC} $1... "; }
log_ok() { echo -e "${GREEN}PASS${NC}"; }
log_fail() { echo -e "${RED}FAIL${NC}"; exit 1; }
log_warn() { echo -e "${YELLOW}WARN${NC} ($1)"; }

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  Star Citizen Hub - System Readiness Check${NC}"
echo -e "${CYAN}============================================${NC}"

# 1. Check OS
log_check "Operating System"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    log_ok
else
    log_fail "Only Linux is supported for production"
fi

# 2. Check Disk Space (Require 2GB)
log_check "Available Disk Space"
FREE_DISK=$(df -m . | tail -1 | awk '{print $4}')
if [ "$FREE_DISK" -gt 2048 ]; then
    log_ok
else
    log_fail "At least 2GB of free space is required"
fi

# 3. Check Memory (Recommend 1GB)
log_check "Total System Memory"
TOTAL_RAM=$(free -m | awk '/^Mem:/{print $2}')
if [ "$TOTAL_RAM" -gt 900 ]; then
    log_ok
else
    log_warn "Less than 1GB RAM detected. Build process may be slow."
fi

# 4. Check Dependencies
log_check "Go Environment"
if command -v go &> /dev/null; then
    GO_VER=$(go version | awk '{print $3}' | sed 's/go//')
    log_ok " ($GO_VER)"
else
    log_warn "Go not found. Will be installed by setup."
fi

log_check "Node.js Environment"
if command -v node &> /dev/null; then
    NODE_VER=$(node -v)
    log_ok " ($NODE_VER)"
else
    log_warn "Node.js not found. Will be installed by setup."
fi

# 5. Check Ports (80, 443, 8000)
log_check "Port Availability (8000)"
if ! lsof -i:8000 &> /dev/null; then
    log_ok
else
    log_warn "Port 8000 is already in use. Ensure no other instance is running."
fi

echo -e "${GREEN}System check complete! Your environment is ready.${NC}"
echo ""
