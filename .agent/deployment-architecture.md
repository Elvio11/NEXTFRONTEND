# Deployment Architecture

## Server Cluster (FluxCloud — 6-month contract, ~₹870/month total)

| Server | Spec | Monthly | Role |
|---|---|---|---|
| Server 1 (Gateway) | 2vCPU / 8GB RAM / 100GB SSD | ~₹191 | Public-facing API + Baileys + Nginx |
| Server 2 (Intelligence) | 8vCPU / 32GB RAM / 100GB SSD | ~₹339 | Agents 3, 4, 5, 6, 7, 8, 10, 11 |
| Server 3 (Execution) | 8vCPU / 32GB RAM / 100GB SSD | ~₹339 | Agents 9, 12, 13, 14, 15 + Selenium |

All 3 servers have static IPs. This is essential — Server 3's static IP is the apply identity.

## Network Rules
- Server 1: public-facing. Ports 80, 443 open. Nginx reverse proxy to Node.js on :3000.
- Server 2: UFW firewall — only Server 1's static IP whitelisted on port 8000 (FastAPI).
- Server 3: UFW firewall — only Server 1's static IP whitelisted on port 8001 (FastAPI).
- Server 2 ↔ Server 3: direct HTTP on internal network. No public exposure.
- Supabase DB: Server 1, 2, 3 IPs all whitelisted in Supabase Dashboard → Network Restrictions.

## Process Management
- Server 1: PM2 (Node.js process manager). Auto-restart on crash.
- Server 2: Supervisor or systemd for FastAPI + CrewAI workers.
- Server 3: Supervisor for FastAPI + Selenium workers. Xvfb virtual display for headless Chrome.

## Shared Storage (FluxShare)
- Mounted at /storage/ on all 3 servers simultaneously
- NOT Supabase Storage — FluxShare shared disk, zero egress fees
- Paths: /storage/parsed-resumes/, /storage/jds/, /storage/tailored/, /storage/cover-letters/, /storage/screenshots/, /storage/calibration/

## Secrets
- Doppler only. Project: careeros. Configs: dev + prod.
- 73 secrets total. Never use .env files anywhere.
- Run all processes via: doppler run -- <command>
- Key secret groups: Supabase keys, Google OAuth, AES-256 encryption key, Razorpay, Sarvam API, Gemini API, Webshare proxy credentials, WhatsApp phone, FluxShare mount credentials.

## CI/CD
- GitHub repo: https://github.com/Elvio11/CareerOS (to be renamed Talvix)
- Branch: main
- Structure: phase-1/, phase-2/, phase-3/ etc.
- Deploy: manual SSH + git pull for now. Phase 12 adds proper CI pipeline.

## Phase Status
| Phase | Status |
|---|---|
| 1 — Database Foundation | ✅ COMPLETE |
| 2 — Server 1 Node.js | Pending |
| 3 — Agent Service Core | Pending |
| 4 — Career Intelligence | Pending |
| 5 — React Frontend | Pending |
| 6 — Job Pool | Pending |
| 7 — Auto-Apply System | Pending |
| 8 — Resume & Cover Letter | Pending |
| 9 — WhatsApp System | Pending |
| 10 — Follow-Up & Interview | Pending |
| 11 — Self-Learning | Pending |
| 12 — Production Hardening | Pending |

## Pending Configuration (fill when services ready)
- Domain (talvix.in) → update Supabase auth redirect URLs + Google OAuth allowed origins + Doppler prod SERVER_URL
- FluxCloud static IPs → whitelist in Supabase Dashboard → Database → Network Restrictions
- Razorpay live keys → swap test keys in Doppler prod config
- Jio SIM phone number → update WA_BOT_PHONE in Doppler prod
- Webshare credentials → update PROXY_HOST, PROXY_USER, PROXY_PASS in Doppler prod
