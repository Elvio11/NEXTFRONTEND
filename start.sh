#!/bin/sh
# start.sh — Server 3 (Automation Layer) container entrypoint
# Starts Xvfb (required for headless-less Chrome/Selenium), then uvicorn.
# Using ENTRYPOINT ["/app/start.sh"] keeps the same pattern as Server 2,
# which uses ENTRYPOINT ["python", "-m", "uvicorn", ...].

set -e

echo "[start.sh] Starting Xvfb on display :99..."
Xvfb :99 -screen 0 1280x720x24 &
XVFB_PID=$!
echo "[start.sh] Xvfb PID: $XVFB_PID"

echo "[start.sh] Starting uvicorn on port ${PORT:-8080}..."
exec python -m uvicorn main:app --host 0.0.0.0 --port "${PORT:-8080}"
