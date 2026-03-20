# [P] Pseudocode: Dept 1 — Commander (CEO-OS)
**Task ID:** `dept1-ceo-os-plan`
**Derived From:** `dept1-ceo-os-spec.md`

## 1. Core Logic Overview
The CEO-OS must operate as an event-driven router that interprets incoming "Corporate Directives" and maps them to specialized "Hands" (Department scripts). It maintains its own status loop, pulling data from various sources (Stripe, WhatsApp, Scrapers) and pushing alerts to the Founder when necessary.

---

## 2. Heartbeat Monitoring Logic
```python
async def morning_briefing_loop():
    # 1. Fetch current status from Finance (Dept 48) - Budget check
    budget = await FinanceHand.get_burn_rate()
    
    # 2. Fetch current status from Marketing (Dept 4) - Growth metrics
    leads = await MarketingHand.get_engagement()
    
    # 3. Fetch current status from Engineering (Dept 39) - Swarm health
    health = await EngHand.get_swarm_status()
    
    # 4. Generate AI summary (Gemini Flash)
    summary = generate_summary(budget, leads, health)
    
    # 5. Push to Founder (Telegram/S1)
    await S1Bridge.notify_founder(summary)
```

---

## 3. Directive Routing Logic
```python
class CEOCommander:
    def execute_directive(self, directive_json):
        # 1. Validate against SOUL.md - Security/Budget
        if not soul.validate(directive_json):
            return "ACCESS_DENIED"
            
        # 2. Target specific "Hands" (TOML scripts)
        targets = directive_json.get("target_depts")
        for dept in targets:
            hand = HandLoader.get(dept)
            # 3. Spawn a task for the specific implementation
            asyncio.create_task(hand.run(directive_json.get("instruction")))
            
        return "COMMAND_ROUTED"
```

---

## 4. Master OS Bridge Integration
- **Endpoint**: `POST /api/ceo/directive`
- **Logic**: 
    1. Authenticate with `AGENT_SECRET`.
    2. Payload check: Ensure `priority` and `instruction` fields exist.
    3. Return `task_id` for tracking.

- **Endpoint**: `GET /health/heartbeat`
    1. Check all active sub-processes.
    2. Return `HTTP 200` with JSON status report.

---

## 5. Implementation Roadmap
1.  **Skeleton**: Create `CEOController` class in `src/agents/ceo_agent.py`.
2.  **Routing**: Connect `main.py` FastAPI app to the `CEOController`.
3.  **Governance**: Implement a `Governance` skill that parses `SOUL.md`.
4.  **Hands**: Ensure `CEO-OS` can trigger `marketing_director.toml`.
