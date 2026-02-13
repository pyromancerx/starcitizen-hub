#!/bin/bash
# Stop Star Citizen Hub Backend (Go)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$BASE_DIR/backend-go"
PID_FILE="$BACKEND_DIR/backend.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "Backend PID file not found. Is it running?"
    exit 0
fi

PID=$(cat "$PID_FILE")
echo "Stopping backend (PID: $PID)..."

if kill $PID > /dev/null 2>&1; then
    # Wait for process to actually exit
    for i in {1..5}; do
        if ! ps -p $PID > /dev/null; then
            break
        fi
        sleep 1
    done
    
    # If still running, force kill
    if ps -p $PID > /dev/null; then
        echo "Force killing backend..."
        kill -9 $PID
    fi
    
    rm "$PID_FILE"
    echo "Backend stopped successfully."
else
    echo "Failed to stop backend. Process may have already exited."
    rm "$PID_FILE"
fi
