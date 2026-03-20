# [S] Specification: Dept 1 — Commander (CEO-OS)
**Task ID:** `dept1-ceo-os`
**Project:** Talvix AI Corp (Server 5)

## 1. Objective
The **Commander (CEO-OS)** is the master orchestration layer of Server 5. It is responsible for bridging the external "Master OS" directives with the internal 50-department swarm. It enforces the **SOUL.md** governance and ensures that all autonomous actions are aligned with the founder's high-level goals.

## 2. Core Functional Requirements
- **Master Routing**: Centralized endpoint for receiving `directives` from Server 1 or the Founder (Telegram/Dashboard).
- **Corporate Pulse**: A real-time monitoring system that tracks the health and "Work-in-Progress" (WIP) status of all active departments.
- **SOUL Enforcement**: Gates every cross-departmental action against the security and budget limits defined in `SOUL.md`.
- **Founder Liaison**: Automatically tunnels critical alerts (Incident Response) back to the Founder via the OS Bridge.
- **Morning Briefing Orchestration**: A recurring workflow that triggers status reports from Finance, Marketing, and Engineering to compile a daily summary.

## 3. Technical Integration
- **Platform**: Python 3.11 / FastAPI.
- **Access Level**: `Level 0 (Root/System)` – Highest authority in the Dept mesh.
- **Dependencies**: 
    - Internal: `SOUL.md`, `AGENTS.md`.
    - External: Server 1 (Gateway), Supabase (Persistent State).

## 4. Input/Output Data Models
### Input: `CorporateDirective`
```json
{
  "priority": "HIGH",
  "target_depts": ["Marketing", "Finance"],
  "instruction": "Scale job-fit scoring for India-remote market",
  "budget_limit": 50.00
}
```

### Output: `PulseStatus`
```json
{
  "system_health": "OPTIMAL",
  "active_agents": 12,
  "daily_burn": 1.45,
  "last_milestone": "Marketing Hand activated"
}
```

## 5. Success Criteria
- [ ] Successful initialization of the `Commander` class within `main.py`.
- [ ] Implementation of a heartbeat mechanism for at least 3 dummy departments.
- [ ] Integration with the `/health/heartbeat` endpoint as specified in `server5_todo.md`.
- [ ] Command-line interface availability via `ruflo` (simulated).
