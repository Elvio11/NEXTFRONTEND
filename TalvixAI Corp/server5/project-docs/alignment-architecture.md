# [A] Architecture: Global Hand Registry (v1.3)
**Task ID:** `arch-alignment-v1.3-architecture`
**Derived From:** `alignment-plan.md`

## 1. Corporate Hierarchy (50 Departments)
We are implementing the full 50-department structure as defined in Section 8 of the Architecture Document.

### Executive Division (Depts 1-3)
- **1: Commander / CEO-OS**: Cerebras Qwen3-235B (Always on).
- **2: Chief of Staff**: Cerebras (Daily 8AM).
- **3: Strategy & Intelligence**: Cerebras (Monthly).

### Engineering Division (Depts 39-46, 48, 50)
- **39: Engineering Commander**: Claude Sonnet 4.6 (Hand ID: 39).
- **40: Backend Engineer**: Qwen3-Coder-480B (Hand ID: 40).
- **41: AI/ML Engineer**: Claude Sonnet 4.6 (Hand ID: 41).
- **50: TalvixGuard Watchdog**: Node.js resident (Hand ID: 50).

### Marketing Division (Depts 4-12)
- **4: Marketing Director**: Cerebras (Monday 8AM).
- **5: Content Writer**: Gemini 2.5 Flash (Daily 9AM).
- **12: Distribution Manager**: Groq Llama 3.3 (Per calendar).

---

## 2. Directory Structure
```
server5/
├── main.py (FastAPI Master OS Bridge)
├── src/
│   ├── agents/
│   │   ├── ceo_agent.py (The Commander Logic)
│   │   └── engineering_commander.py (The Ruflo Swarm Bridge)
│   └── utils/
│       └── openfang_runner.py (Subprocess wrapper for Rust binary)
└── openfang/
    ├── hands/ (50 HAND.toml files)
    │   ├── 01_ceo_os.toml
    │   ├── 04_marketing_director.toml
    │   └── ...
    ├── skills/ (agency-agents, antigravityskills.org)
    └── SOUL.md (Master Governance)
```

---

## 3. Communication Pattern
 모든 communication flows through the **Commander/CEO-OS**.

- **External -> S5**: `POST /api/ceo/directive` with `AGENT_SECRET`.
- **S5 Internal**: `CEOController` picks a `Hand` and calls `OpenFangRunner.execute(hand_id)`.
- **Hand -> S1**: Hand uses native OpenFang `http_get` tool to call `S1 /mcp` tools.
- **S5 -> Founder**: Results are tunneled back to Telegram via `notify` tool in OpenFang.

---

## 4. Security Enforcement (v1.3 Alignment)
- **WASM Isolation**: Every Hand's `config.toml` must explicitly declare `isolation_mode = "wasm"`.
- **Budget Tracking**: The `openfang-kernel` metrics will be periodically checked by the `Finance & Operations` (Dept 33) Hand.
- **Zero S2-S4 Overlap**: All skills must be audited for unauthorized direct API calls to IP addresses in the S2-S4 ranges.
