#!/bin/bash
# Start Star Citizen Hub Backend (Go)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$BASE_DIR/backend-go"
PID_FILE="$BACKEND_DIR/backend.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null; then
        echo "Backend is already running (PID: $PID)"
        exit 0
    else
        echo "Found stale PID file. Removing..."
        rm "$PID_FILE"
    fi
fi

echo "Building and starting Go backend..."
cd "$BACKEND_DIR"

go mod tidy
go build -o server ./cmd/server/main.go

export MIGRATIONS_PATH=./migrations
nohup ./server > backend.log 2>&1 &
echo $! > "$PID_FILE"

echo "Backend started successfully (PID: $(cat "$PID_FILE"))"
echo "Logs are being written to $BACKEND_DIR/backend.log"
