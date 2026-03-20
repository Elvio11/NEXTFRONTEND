# Talvix Master Environment Template (.env)

Below is a consolidated list of environment variables required for all four major components of the Talvix application. Copy the relevant sections into the `.env` files in each project root.

---

## 🏗️ Server 1 (Gateway / Node.js)
**Location**: `c:\Users\DELL\Antigravity\Talvix\branch-server1\.env`
```bash
PORT=8080
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
FRONTEND_URL=http://localhost:3000

# Inter-server security
AGENT_SECRET=<your-agent-secret>
JWT_SECRET=<your-jwt-secret-min-64-chars>
AES_SESSION_KEY=<your-32-byte-hex-aes-key>

# Backends
SERVER2_URL=http://localhost:8081
SERVER3_URL=http://localhost:8082

# Optional
TELEGRAM_BOT_TOKEN=<your-tg-token>
TELEGRAM_WEBHOOK_SECRET=<your-tg-secret>
```

---

## 🧠 Server 2 (Intelligence / FastAPI)
**Location**: `c:\Users\DELL\Antigravity\Talvix\branch-server2\.env`
```bash
APP_PORT=8081
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
AGENT_SECRET=<your-agent-secret>

# LLM Keys
SARVAM_API_KEY=<your-sarvam-key>
GEMINI_API_KEY=<your-gemini-key>

# Other servers
SERVER1_URL=http://localhost:8080
SERVER2_URL=http://localhost:8081
SERVER3_URL=http://localhost:8082
```

---

## 🚀 Server 3 (Execution / FastAPI)
**Location**: `c:\Users\DELL\Antigravity\Talvix\branch-server3\.env`
```bash
PORT=8082
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
AGENT_SECRET=<your-agent-secret>
SESSION_KEY=<your-aes-key-for-decryption>

# LLM Keys (Firecrawl & Resume Tailor)
SARVAM_API_KEY=<your-sarvam-key>
GEMINI_API_KEY=<your-gemini-key>

# Other servers
SERVER1_URL=http://localhost:8080
SERVER2_URL=http://localhost:8081
SERVER3_URL=http://localhost:8082
```

---

## 💻 Frontend (Next.js)
**Location**: `c:\Users\DELL\Antigravity\Talvix\frontend\.env.local`
```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

---

### Instructions:
1. Fill in the values for each server.
2. Save each to its respective `.env` file.
3. Restart the servers to verify the "MISSING" flags in health checks are cleared.
