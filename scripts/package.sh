#!/bin/bash
# Star Citizen Hub - Packaging Script
# This script bundles the application into a redistributable release

set -e

VERSION=${1:-"1.0.0"}
PACKAGE_NAME="starcitizen-hub-${VERSION}"
BUILD_DIR="build/${PACKAGE_NAME}"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}Packaging Star Citizen Hub v${VERSION}...${NC}"

# Clean build directory
rm -rf build/
mkdir -p "${BUILD_DIR}"

# 1. Build Backend
echo "Building Go backend..."
cd backend-go
go mod tidy
go build -ldflags="-X 'github.com/pyromancerx/starcitizen-hub/backend-go/internal/handlers.AppVersion=${VERSION}'" -o ../"${BUILD_DIR}"/server ./cmd/server/main.go
cd ..

# 2. Build Frontend
echo "Building Next.js frontend..."
cd frontend-next
npm install
npm run build
cd ..
cp -r frontend-next/out "${BUILD_DIR}/frontend"

# 3. Copy Migrations & Scripts
echo "Copying assets..."
cp -r backend-go/migrations "${BUILD_DIR}/"
cp scripts/install.sh "${BUILD_DIR}/"
cp scripts/setup.sh "${BUILD_DIR}/"
cp scripts/update.sh "${BUILD_DIR}/"
cp README.md "${BUILD_DIR}/"

# 4. Create Release Tarball
echo "Creating release tarball..."
cd build
tar -czf "${PACKAGE_NAME}.tar.gz" "${PACKAGE_NAME}"
cd ..

echo -e "${GREEN}Release package created: build/${PACKAGE_NAME}.tar.gz${NC}"
