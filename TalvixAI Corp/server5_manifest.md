# 🛡️ Server 5 (Talvix AI Corp) — Session Reference Manifest
> **Source Session ID:** `50766ab3-2b00-4714-8fdd-66b73816a525`
> **Retrieved On:** 2026-03-19

---

## 📋 Phase 5 SPARC Plan: Frontend Integration

### 1. [S] Specification
**Goal**: Complete the end-to-end flow from User Onboarding to Dashboard readiness.

**Core Integration Points:**
- **Resume Upload**: Ensure `ResumeUpload.tsx` hits `Server 1: /api/resume/upload` and polls Supabase for `parse_status`.
- **Persona Selection**: `PersonaDisplay.tsx` fetches and displays AI-detected persona and confirms selection to `Server 1: /api/auth/persona`.
- **WhatsApp Integration**: `WhatsAppConnect.tsx` triggers Server 1 Baileys QR generation and monitors status.
- **Dashboard Synchronization**: `DashboardHome.tsx` reflects updates from `Agent 6 (Fit Scorer)` and `Agent 5 (Career Intel)`.

### 2. [P] Pseudocode (Real-time Sync)
```typescript
function useRealtime(userId) {
  useEffect(() => {
    // 1. Subscribe to 'resumes' table for 'parse_status' changes
    // 2. Subscribe to 'fit_scores' table for 'calculated' events
    // 3. Update Zustand stores (useDashboardStore) on every change
    // 4. Trigger local notifications (Toasts) when agents complete tasks
  }, [userId])
}
```

### 3. [A] Architecture
- **State**: `Zustand` for global UI state.
- **API**: Axios instance in `src/lib/axios.ts` (JWT/AES enabled).
- **Real-time**: Supabase Real-time client for subscriptions.
- **UI**: Framer Motion for step transitions.

### 4. [C] Pending Coding Tasks
- [ ] Implement `PersonaDisplay` confirmation logic.
- [ ] Finish `useRealtime` hook implementation.
- [ ] Verify `WhatsAppConnect` QR polling logic.
- [ ] Audit `DashboardHome` for data binding completeness.

---

## 🚀 RuFlo v3 — Engineering Swarm Guide

### 1. The SPARC Workflow Commands

| Mode | Command | Purpose |
| :--- | :--- | :--- |
| **S** | `ruflo spec "desc"` | Formalize requirements. |
| **P** | `ruflo plan --spec path` | Logic and Pseudocode. |
| **A** | `ruflo arch --plan path` | Component & Data Architecture. |
| **R** | `ruflo review --code path` | Quality Gate / Audit. |
| **C** | `ruflo coder --task "X"` | Implementation. |

### 2. Swarm Status & Memory
- `ruflo swarm status`: Check agent health.
- `ruflo swarm monitor`: Task progression dashboard.
- `ruflo memory search --query "X"`: Find existing patterns in the codebase.

---

## 🛠️ Project Status (Server 5)
You are currently working on the **Marketing Agent** and **Hands** implementation for the autonomous corporate structure of Server 5.

**Key Files:**
- `server5/openfang/SOUL.md`: Internal logic of the Corp.
- `server5/src/agents/marketing_agent.py`: Initial departmental agent.
- `server5/openfang/hands/marketing_director.toml`: Skill definitions for the director.
