#!/bin/bash
# Start Star Citizen Hub Backend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/start_backend_go.sh" "$@"