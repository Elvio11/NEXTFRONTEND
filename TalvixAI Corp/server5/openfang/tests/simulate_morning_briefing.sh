#!/bin/bash
# server5/openfang/tests/simulate_morning_briefing.sh
# Manually triggers the Morning Briefing workflow to test parallel fan-out execution.

set -e

echo "[+] Initiating Phase 8 End-to-End Test: Morning Briefing Dry Run"

# Simulate the cron trigger via OpenFang CLI
# (In production, this is handled autonomously by the OpenFang kernel scheduler)

echo "[*] Triggering workflow: morning_briefing.toml"
openfang trigger --workflow /app/openfang/workflows/morning_briefing.toml

echo "[+] Fan-out execution initiated. 6 Hands are now processing in parallel."
echo "[*] Monitor Telegram @TalvixFounderBot for the final aggregated brief."
echo "[*] Monitor Docker logs for API token usage and memory spikes."
