# Connectivity Report

## SECTION 1: COMMUNICATION MAP

### Expected vs Actual Map
1. **Frontend → Server 2**
   - **Method/URL:** POST `/api/agents/resume-intelligence`, `/api/agents/coach`, etc.
   - **Auth:** `Bearer JWT` (via `injectBearer` in `src/lib/axios.ts`).
   - **Status:** ❌ BUG (Class C). Server 2 expects `X-Agent-Secret`, but Frontend sends `Bearer JWT`. Server 2 will reject this with 403.
   
2. **Frontend → Server 1** (Unexpected)
   - **Method/URL:** Configured in [axios.ts](file:///c:/Users/DELL/Antigravity/Talvix/frontend_worktree/frontend/src/lib/axios.ts) via `apiS1` base client.
   - **Auth:** `Bearer JWT`.
   - **Status:** ❌ BUG (Class G). Frontend contains a direct reference to Server 1 (`process.env.NEXT_PUBLIC_SERVER1_URL`).

3. **Frontend → Supabase**
   - **Method/URL:** Supabase client calls.
   - **Auth:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - **Status:** ✅ CORRECT.

4. **Server 2 → Server 1**
   - **Method/URL:** POST `/internal/wa-send` (triggered by [whatsapp_push.py](file:///c:/Users/DELL/Antigravity/Talvix/skills/whatsapp_push.py)).
   - **Auth:** `X-Agent-Secret`.
   - **Status:** ❌ BUG (Class C). The `/internal/wa-send` endpoint does **not exist** on Server 1, and Server 1 never mounts `verifyAgentSecret` on any route.

5. **Server 2 → Server 3**
   - **Method/URL:** Trigger scraping.
   - **Auth:** `X-Agent-Secret`.
   - **Status:** ❌ BUG. This call is completely absent from the Server 2 codebase. `SERVER3_URL` is not used anywhere outside of tests.

6. **Server 3 → Server 1** (Unexpected, but needed per Agent 12 logic)
   - **Method/URL:** POST `/internal/wa-send` (triggered by [agent12_applier.py](file:///c:/Users/DELL/Antigravity/Talvix/server3_worktree/agents/agent12_applier.py)).
   - **Auth:** `X-Agent-Secret`.
   - **Status:** ❌ BUG. Same issue as above: the Server 1 receiving endpoint doesn't exist.

7. **Server 2 / Server 3 → Supabase**
   - **Method/URL:** Directly to DB.
   - **Auth:** `SUPABASE_SERVICE_KEY`.
   - **Status:** ✅ CORRECT.

---

## SECTION 2: ENV VAR MASTER CHECKLIST

### Server 1
- `FRONTEND_URL` (✅ Used in code, missing from .env.example)
- `JWT_SECRET` (✅ Used in code, missing from .env.example)
- `SUPABASE_URL` (✅ Used in code, present in .env.example)
- `SUPABASE_ANON_KEY` (✅ Used in code, missing from .env.example)
- `AGENT_SECRET` (✅ Used in code, present in .env.example)
- `AES_SESSION_KEY` (✅ Used in code, present in .env.example)
- `SERVER2_URL` (✅ Used in code, present in .env.example)
- `RAZORPAY_WEBHOOK_SECRET` (✅ Used in code, missing from .env.example)

### Server 2
- `SUPABASE_URL` (✅ Used)
- `SUPABASE_SERVICE_KEY` (✅ Used)
- `AGENT_SECRET` (✅ Used)
- `SERVER1_URL` (✅ Used by [whatsapp_push.py](file:///c:/Users/DELL/Antigravity/Talvix/skills/whatsapp_push.py))
- `SARVAM_API_KEY` (✅ Used via [llm/sarvam.py](file:///c:/Users/DELL/Antigravity/Talvix/llm/sarvam.py))
- `GEMINI_API_KEY` (✅ Used via [llm/gemini.py](file:///c:/Users/DELL/Antigravity/Talvix/llm/gemini.py))
- `SERVER2_URL` (✅ Used by [agent7_jd.py](file:///c:/Users/DELL/Antigravity/Talvix/agents/agent7_jd.py) to call itself)
- `SERVER3_URL` (❌ Missing from code. Server 2 never actually calls Server 3)

### Server 3
- `SUPABASE_URL` (✅ Used)
- `SUPABASE_SERVICE_KEY` (✅ Used)
- `AGENT_SECRET` (✅ Used)
- `SERVER3_URL` (✅ Used by [agent12_applier.py](file:///c:/Users/DELL/Antigravity/Talvix/server3_worktree/agents/agent12_applier.py) to call itself)
- `SERVER1_URL` (✅ Used by [agent12_applier.py](file:///c:/Users/DELL/Antigravity/Talvix/server3_worktree/agents/agent12_applier.py) for WhatsApp push)
- `SESSION_KEY` (✅ Used by `skills/session_manager.py`)
- `SARVAM_API_KEY` (✅ Used)
- `GEMINI_API_KEY` (✅ Used)

### Frontend
- `NEXT_PUBLIC_SUPABASE_URL` (✅ Used)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (✅ Used)
- `NEXT_PUBLIC_SERVER2_URL` (✅ Used)
- `NEXT_PUBLIC_SERVER1_URL` (❌ BUG CLASS G - Used in code to call Server 1 directly)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` (✅ Used)

---

## SECTION 3: BUGS FOUND (ranked by severity)

### CRITICAL
1. **BUG CLASS C - Conflicting Auth Models & 403 Forbidden**
   - **Issue:** Frontend sends `Bearer JWT` to Server 2, but Server 2's [main.py](file:///c:/Users/DELL/Antigravity/Talvix/main.py) uses [verify_agent_secret](file:///c:/Users/DELL/Antigravity/Talvix/middleware/auth.py#16-23) (expecting `X-Agent-Secret`) on all its routes. This will block all Frontend-to-Server 2 communication.
2. **BUG CLASS G - Frontend Calling Server 1**
   - **Issue:** `src/lib/axios.ts` defines `apiS1` with `baseURL: process.env.NEXT_PUBLIC_SERVER1_URL`, violating the architecture rule that Frontend only calls Server 2.
3. **Missing Internal Route on Server 1**
   - **Issue:** Server 2 and Server 3 attempt to POST to `/internal/wa-send` on Server 1 for WhatsApp notifications, but Server 1 has NO such router nor endpoint.
4. **BUG CLASS C - Missing Inbound Auth on Server 1**
   - **Issue:** Server 1 defines `verifyAgentSecret` but never mounts it on any route.
5. **Missing Communication Server 2 -> Server 3**
   - **Issue:** The expected call from Server 2 -> Server 3 to trigger scraping does not exist in Server 2 (`SERVER3_URL` is never used).

### HIGH
1. **BUG CLASS A - Hardcoded Localhost Defaults**
   - **Issue:** `http://localhost:8003` is hardcoded as an env var default in production code: `agent12_applier.py:159`.
   - **Issue:** `http://localhost:8080` is hardcoded as an env var default in production code: `agent7_jd.py:102`.
2. **BUG CLASS D - CORS Misconfiguration**
   - **Issue:** Server 2 and Server 3 both allow `["*"]` cross-origin. Security risk for internal services.

### MEDIUM/LOW
1. **BUG CLASS E - Module-Level Env Reads** (Resolved)
   - **Status:** **Fixed**. Previously resolved in Server 2 ([db/client.py](file:///c:/Users/DELL/Antigravity/Talvix/db/client.py)) and verified absent from Server 3. No instances found.

---

## SECTION 4: COMPLETE .env.example FILES

**SERVER 1 (.env.example):**
```env
# ── Supabase ──────────────────────────────────────
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── Inter-server auth (same value on S1, S2, S3) ──
AGENT_SECRET=generate-with-openssl-rand-hex-32
JWT_SECRET=generate-minimum-64-chars-for-jwt

# ── Server URLs (production — no port suffix) ─────
SERVER2_URL=https://talvixserver2.app.runonflux.io
FRONTEND_URL=https://talvix.app

# ── WhatsApp session encryption ───────────────────
AES_SESSION_KEY=64-char-hex-string-for-AES256

# ── External Webhooks ─────────────────────────────
RAZORPAY_WEBHOOK_SECRET=rzp_live_secret_...

# ── Node Env ──────────────────────────────────────
PORT=8080
NODE_ENV=production
```

**SERVER 2 (.env.example):**
```env
# ── Supabase ──────────────────────────────────────
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── Inter-server auth (same value on S1, S2, S3) ──
AGENT_SECRET=generate-with-openssl-rand-hex-32

# ── Server URLs (production — no port suffix) ─────
SERVER1_URL=https://your-server1.onrender.com
SERVER2_URL=https://talvixserver2.app.runonflux.io
SERVER3_URL=https://your-server3.hf.space

# ── LLM ───────────────────────────────────────────
OPENAI_API_KEY=sk-...
SARVAM_API_KEY=...
GEMINI_API_KEY=...
```

**SERVER 3 (.env.example):**
```env
# ── Supabase ──────────────────────────────────────
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── Inter-server auth (same value on S1, S2, S3) ──
AGENT_SECRET=generate-with-openssl-rand-hex-32

# ── Server URLs (production — no port suffix) ─────
SERVER1_URL=https://your-server1.onrender.com
SERVER3_URL=https://your-server3.hf.space

# ── WhatsApp session encryption ───────────────────
SESSION_KEY=64-char-hex-string-for-AES256

# ── LLM ───────────────────────────────────────────
SARVAM_API_KEY=...
GEMINI_API_KEY=...
```

**FRONTEND (.env.local.example):**
```env
# ── Supabase (public — NEXT_PUBLIC_ prefix required)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── Server URLs ───────────────────────────────────
NEXT_PUBLIC_SERVER2_URL=https://talvixserver2.app.runonflux.io
NEXT_PUBLIC_SERVER1_URL=https://your-server1.onrender.com # REMOVE ME (Bug Class G)

# ── Razorpay public key only — never the secret ───
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
```

---

## SECTION 5: ORDERED FIX CHECKLIST

- [ ] S2: [main.py](file:///c:/Users/DELL/Antigravity/Talvix/main.py) — Update auth logic (either JWT validation for Frontend traffic or move agent auth to a separate sub-router).
- [ ] FE: `src/lib/axios.ts` — Remove `apiS1` and `NEXT_PUBLIC_SERVER1_URL`. Route all dashboard/WA traffic through S2.
- [ ] S1: `src/routes/internal.js` — Create the `/internal/wa-send` route to handle WhatsApp pushes from S2 and S3.
- [ ] S1: [src/server.js](file:///c:/Users/DELL/Antigravity/Talvix/server1_worktree/src/server.js) — Mount `verifyAgentSecret` middleware over the new `/internal` routes.
- [ ] S2: Implement missing call to S3 (to trigger scraping or check scraper status), using `SERVER3_URL` and `X-Agent-Secret`.
- [ ] S2: [agents/agent7_jd.py](file:///c:/Users/DELL/Antigravity/Talvix/agents/agent7_jd.py) — Remove hardcoded `"http://localhost:8080"` string default in `os.environ.get`.
- [ ] S3: [agents/agent12_applier.py](file:///c:/Users/DELL/Antigravity/Talvix/server3_worktree/agents/agent12_applier.py) — Remove hardcoded `"http://localhost:8003"` string default in `os.environ.get`.
- [ ] S2: [main.py](file:///c:/Users/DELL/Antigravity/Talvix/main.py) — Refine CORS configuration from `allow_origins=["*"]` to restrict or document adequately.
- [ ] S3: [main.py](file:///c:/Users/DELL/Antigravity/Talvix/main.py) — Refine CORS configuration from `allow_origins=["*"]` to restrict or document adequately.
