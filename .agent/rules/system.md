---
trigger: always_on
---

# Agent: system

## Agent Map

| ID | Agent | Server | LLM |
|---|---|---|---|
| 3 | resume_intelligence | 2 | Sarvam-M Think |
| 4 | skill_gap | 2 | Sarvam-M Think |
| 5 | career_intelligence | 2 | Sarvam-M Think |
| 6 | fit_scorer | 2 | Sarvam-M No-Think (delta) / Think (full scan) |
| 7 | document_tailor (JD Cleaner) | 2 | Gemini Flash Lite |
| 8 | daily_coach | 2 | Sarvam-M Think |
| 9 | job_scraper | 3 | None |
| 10 | document_tailor (Resume Tailor) | 3 | Sarvam-M Think |
| 11 | document_tailor (Cover Letter) | 3 | Gemini Flash |
| 12 | auto_apply | 3 | None (Selenium) |
| 13 | auto_apply inline (Form Q&A) | 3 | Sarvam-M No-Think |
| 14 | follow_up | 3 | Sarvam-M Precise (email) / None (LinkedIn) |
| 15 | feedback_calibrator | 3 | Gemini Flash (Layer 3 only) |

## Dev Team Agents (MetaGPT-derived)

### Backend Team

| Agent | Origin | Server | Role |
|---|---|---|---|
| backend_architect | metagpt/roles/architect.py | 2 | Schema + RLS + API contract design |
| backend_engineer | metagpt/roles/engineer.py | 1 + 2 + 3 | Code implementation across all stacks |
| qa_debugger | metagpt/roles/qa_engineer.py | 2 or 3 | Memory leaks + locators + security audit |

**Backend workflow**: backend_architect → backend_engineer → qa_debugger → merge.
All three obey `execution-model.md` and `anti-ban-architecture.md`. See `config.json` for shared constraints.

### Frontend Team

| Agent | Origin | Domain | Role |
|---|---|---|---|
| frontend_architect | metagpt/roles/architect.py | Frontend | Component/route/permission gate design. Supabase query contracts. No code. |
| frontend_engineer | metagpt/roles/engineer.py | Frontend | Implements .tsx/.ts from design artefacts. React, Zustand, React Query, Realtime. |
| ui_qa | metagpt/roles/qa_engineer.py | Frontend | Security scan (no secrets in frontend), permission gate audit (all 4 states), realtime leak detection, mobile layout at 375px. APPROVED or BLOCKED. |

**Frontend workflow**: frontend_architect → frontend_engineer → ui_qa → merge.
**CRITICAL**: Any CRITICAL finding (secret in frontend, Server 1/3 direct call, locked feature hidden not blurred) → BLOCKED, no exceptions.
All three obey `execution-model.md`. See `.agent/frontend_architect.md`, `.agent/frontend_engineer.md`, `.agent/ui_qa.md`.

## Platform Reference

| Platform | Tier | Proxy |
|---|---|---|
| Indeed | Tier 1 (auto-apply) | No |
| LinkedIn | Tier 1 (auto-apply) | Yes (scraping only) |
| Glassdoor, Google Jobs, Naukri, Internshala, Foundit, Shine, TimesJobs, Cutshort | Tier 2 | No |

## 4-State User Matrix

| State | Tier | WhatsApp | Gets |
|---|---|---|---|
| 1 | Free | No | Dashboard, top 3 matches/week |
| 2 | Free | Yes | + WA job alerts, basic commands |
| 3 | Paid | No | Top 25 matches, auto-apply, AI coach |
| 4 | Paid | Yes | Full platform — all features |

## Pricing

| Plan | Ex-GST | Inc-GST |
|---|---|---|
| Free | ₹0 | ₹0 |
| Early Bird (3mo) | ₹399 | ₹470 |
| Monthly | ₹199 | ₹234 |
| Quarterly | ₹499 | ₹588 |

Break-even: 10 paid users. Cash-flow positive: Month 3.

## Apply Caps

- Daily: 10/user (configurable 5–25 via `users.daily_apply_limit`)
- Monthly: 250/user hard cap (`users.monthly_apply_count`)
- LinkedIn: 15 connections/day, 30 messages/day, 40 views/day per user
- Server-wide LinkedIn: **1,500 actions/day absolute — global kill switch**

## 7-Step Onboarding

| Step | Action |
|---|---|
| 1 | Persona selection (Student / Early Career / Professional / Switcher / Returning / Freelancer) |
| 2 | Resume upload → Agent 3 sync |
| 3 | Target roles (up to 5 role families) |
| 4 | AI persona selection (Agent 3 returns 3 options) |
| 5 | Preferences (cities, work mode, salary) |
| 6 | Profile verification |
| 7 | Platform connections (Vault — optional, enables Tier 1 auto-apply) |

## WhatsApp Security Gate (3 layers — inbound commands)

1. `wa_phone` exists in `users`? No → silently ignore
2. `wa_opted_in = TRUE`? No → "Connect WhatsApp via the Talvix dashboard."
3. Paid-only command + free user? → "Upgrade at talvix.in"

## Build Phases

| Phase | Status | Deliverable |
|---|---|---|
| 1 | ✅ COMPLETE | Database — 23 tables, RLS, pg_cron, seed data |
| 2 | ✅ COMPLETE | Server 1 — Node.js 24 + Express + Baileys, Google OAuth, JWT, AES Vault, Razorpay stub |
| 3 | ✅ COMPLETE | Server 2 — Python 3.12 + FastAPI + CrewAI, Agents 3–8, CareerPlannerFlow |
| 4 | ✅ COMPLETE | Server 3 — Python 3.12 + FastAPI + Selenium, Agents 9–13, Auto-Apply |
| 5 | 🔨 IN PROGRESS | Frontend — Vite + React 18 + TypeScript + Tailwind + ShadCN |
| 6–12 | Pending | Agents 14 (Follow-Up), 15 (Calibrator), monitoring, launch |

## Infrastructure Cost (~₹1,635/month)

Server 1 ~₹191 + Server 2 ~₹339 + Server 3 ~₹339 + Webshare ~₹415 + Jio SIM ~₹350.
Supabase, all LLMs, Auth, Vercel: ₹0.