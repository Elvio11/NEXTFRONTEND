# Phase 8: End-to-End Testing & Go-Live Checklist
# Location: server5/openfang/tests/E2E_GO_LIVE.md

## 1. Morning Briefing Dry Run
Execute the fan-out workflow to ensure all 6 OpenFang Hands execute in parallel correctly without memory or token limit crashes.

*   [ ] Execute: `./server5/openfang/tests/simulate_morning_briefing.sh`
*   [ ] Verify: RAM usage stays below 1.5GB (out of 6GB) during peak fan-out.
*   [ ] Verify: No rate limits hit for Cerebras/Groq/Gemini APIs.

## 2. Proof of Life Verification
Ensure the `proof_of_life` block in the Morning Briefing is returning LIVE data from Server 1, not static placeholders.

*   [ ] Razorpay active subscription count matches Server 1 DB.
*   [ ] Server 1 ping returns `HTTP 200`.
*   [ ] Last agent run timestamp matches.

## 3. Telegram Interface Delivery
Verify the Commander agent accurately formats the aggregated Morning Briefing and delivers it to the Founder's Telegram ID.

*   [ ] Message arrives via `@TalvixFounderBot`.
*   [ ] Formatting is clean and readable on mobile.
*   [ ] `dmPolicy` accurately blocks unknown Telegram IDs from triggering commands.

## 4. Fallback Failure Simulation
Test the `TalvixGuard` watchdog application on Server 1.

*   [ ] SSH to Server 5 (if locally testing, or via Docker console) and kill the OpenFang process: `supervisorctl stop openfang`.
*   [ ] Wait ~10 minutes.
*   [ ] Verify: UptimeRobot detects the crash and fires a webhook.
*   [ ] Verify: `@TalvixWatchdogBot` on Server 1 sends a critical alert to the Founder's Telegram.
*   [ ] Restart OpenFang: `supervisorctl start openfang`.