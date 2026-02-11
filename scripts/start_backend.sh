#!/bin/bash
# Start Star Citizen Hub Backend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$BASE_DIR/backend"
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

echo "Starting backend..."
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Please run scripts/setup.sh first or create a venv in backend/."
    exit 1
fi

source venv/bin/activate
# Ensure data directory exists for SQLite
mkdir -p data

nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
echo $! > "$PID_FILE"

echo "Backend started successfully (PID: $(cat "$PID_FILE"))"
echo "Logs are being written to $BACKEND_DIR/backend.log"
