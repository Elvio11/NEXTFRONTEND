# [P] Pseudocode: Architecture Alignment (v1.3)
**Task ID:** `arch-alignment-v1.3-plan`
**Derived From:** `alignment-spec.md`

## 1. Core Logic Overview
The current Python `CEOController` acts as a high-level bridge. Instead of executing Python logic directly, it will translate corporate directives into `openfang run --hand <id>` commands. This ensures that we benefit from the **WASM sandbox** and **16 security layers** of the OpenFang binary while maintaining the flexibility of the FastAPI OS bridge.

---

## 2. Hand Execution Loop (Python -> OpenFang)
```python
class CEOController:
    async def run_hand(self, dept_id: int, task: str):
        # 1. Look up HAND.toml path in registry
        hand = self.registry.get(dept_id)
        path = hand.config_path
        
        # 2. Execute via Subprocess (OpenFang Binary)
        # command: openfang run --hand {path} --input "{task}" --output json
        result = await subprocess_call(["openfang", "run", "--hand", path, "--input", task])
        
        # 3. Parse and log the result
        status = parse_json(result)
        hand.status = status.get("state")
        hand.last_action = status.get("action")
        
        # 4. Trigger Founder Notification if CRITICAL
        if status.get("severity") == "CRITICAL":
            await S1_Bridge.notify_founder(status)
```

---

## 3. HAND.toml Structure (Example: CEO-OS)
```toml
[hand]
id = 1
name = "Commander"
llm = "Cerebras-Qwen3-235B"
schedule = "cron: 0 7 * * *" # Morning briefing
system_prompt = "You are the Commander of Talvix AI Corp..."

[abilities]
route = "session_spawn"
audit = "audit_soul"
notify = "telegram_notify"

[tools]
- search_web
- http_get (to S1 /mcp)
- write_file (to logs/)
```

---

## 4. Transition Tasks
1.  **Registry Update**: Populating all 50 departments from `ARCHITECTURE v1 3.md` (Table 8).
2.  **Binary Wrapper**: Implementing a robust `OpenFangRunner` utility class in `src/utils.py`.
3.  **Default Scaling**: Setting `Cerebras` and `Gemini Flash` as the primary LLM drivers in the TOML configs.
4.  **Audit**: Running `openfang skills list` (simulated) to verify `agency-agents` and `antigravityskills.org` libraries.
