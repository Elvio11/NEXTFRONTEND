# [S] Specification: Architecture Alignment (v1.3)
**Task ID:** `arch-alignment-v1.3`
**Project:** Talvix AI Corp (Server 5)

## 1. Objective
Synchronize the current Server 5 implementation with the **Talvix AI Corp Architecture v1.3**. Transition from a pure Python-based agent model to an **OpenFang-native** architecture where the Python FastAPI app acts strictly as the **Master OS Bridge** and webhook listener, delegating all autonomous logic to the OpenFang Rust binary.

## 2. Key Alignment Points
- **Runtime Transition**: Ensure the system is prepared for the single 32MB OpenFang binary.
- **Hand Migration**: Move departmental logic from `src/agents/*.py` to `openfang/hands/*.toml`.
- **LLM Mapping**:
    - **Commander (CEO-OS)**: Set to `Cerebras Qwen3-235B` (Primary).
    - **Engineering Commander**: Set to `Claude 3.5 Sonnet` (Paid).
- **Security Check**: Verify zero direct access to S2/S3/S4. All product data must be pulled via the S1 MCP tools or REST aggregates.
- **Watchdog Integration**: Ensure `main.py` provides the `/health/heartbeat` required by **TalvixGuard** (Server 1 resident).

## 3. Success Criteria
- [ ] Comprehensive `openfang/hands/` directory with `HAND.toml` templates for core departments.
- [ ] Updated `main.py` that successfully triggers `openfang run` commands for Hands.
- [ ] Commander logic in `ceo_agent.py` updated to use `Cerebras` as the primary reasoning engine.
- [ ] All 50 departments represented in the `HandRegistry` with correct Division mappings.

## 4. Constraints (from SOUL.md v1.0)
- ZERO PII processing.
- ALL capital spend > $50 requires Founder HITL via Telegram.
- MANDATORY WASM isolation for all Hands.
