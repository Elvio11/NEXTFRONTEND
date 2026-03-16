#!/bin/sh
# start.sh — Server 2 (Intelligence Layer) container entrypoint
# Using a shell script entrypoint prevents Flux Cloud's empty command overrides
# from appending an empty string argument to uvicorn, which causes the crash:
# "Error: Got unexpected extra argument ()"

set -e

echo "[start.sh] Starting uvicorn on port ${PORT:-8080}..."
exec python -m uvicorn main:app --host 0.0.0.0 --port "${PORT:-8080}"
