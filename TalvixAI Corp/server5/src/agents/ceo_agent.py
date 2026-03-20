import os
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
import logging
from asyncio import Task

# Assuming this exists based on the original framework imports
from src.utils.openfang_runner import OpenFangRunner

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - CEO-OS - %(levelname)s - %(message)s")
logger = logging.getLogger("CEO-OS")

class HandDefinition:
    def __init__(self, dept_id: int, name: str, division: str, config_path: str):
        self.dept_id = dept_id
        self.name = name
        self.division = division
        self.config_path = config_path
        self.status = "IDLE"
        self.last_action = "N/A"
        self.last_updated = datetime.now()

class CEOController:
    """
    Commander (CEO-OS) (Dept 1) - v1.3 Architecture Alignment
    Master orchestration layer for the 50-department swarm.
    """
    def __init__(self, agent_secret: Optional[str] = None):
        # Strict constraints: No Supabase direct keys, No service_role
        self.agent_secret = agent_secret or os.getenv("AGENT_SECRET", "DEV_SECRET_ONLY")
        self.telegram_founder_id = os.getenv("FOUNDER_TELEGRAM_ID", "ELVIO_ID_PLACEHOLDER")
        
        self.registry: Dict[int, HandDefinition] = {}
        self.pulse_history: List[Dict[str, Any]] = []
        self._initialize_full_registry()
        logger.info("Commander (CEO-OS) initialized with 50 Departments.")

    def _initialize_full_registry(self):
        """Register all 50 departments as defined in Section 8 of v1.3 docs."""
        depts = [
            (1, "Commander/CEO-OS", "Executive"), (2, "Chief of Staff", "Executive"), (3, "Strategy & Intel", "Executive"),
            (4, "Marketing Director", "Marketing"), (5, "Content Writer", "Marketing"), (6, "SEO Specialist", "Marketing"),
            (7, "Visual Designer", "Marketing"), (8, "Video & Reels", "Marketing"), (9, "Paid Ads Manager", "Marketing"),
            (10, "Community Manager", "Marketing"), (11, "PR & Comms", "Marketing"), (12, "Distribution Manager", "Marketing"),
            (13, "Conversion Specialist", "Revenue"), (14, "Retention Manager", "Revenue"), (15, "BD & Partnerships", "Revenue"),
            (16, "Enterprise Sales", "Revenue"), (17, "Affiliate & Influencer", "Revenue"), (18, "Pricing & Monetization", "Revenue"),
            (19, "Product Manager", "Prod & Eng Ops"), (20, "QA Monitor", "Prod & Eng Ops"), (21, "DevOps / Infra", "Prod & Eng Ops"),
            (22, "Security Officer (Prod)", "Prod & Eng Ops"), (23, "AI Agent QA", "Prod & Eng Ops"), (24, "Data Analyst", "Analytics"),
            (25, "Growth Researcher", "Analytics"), (26, "BI & Reporting", "Analytics"), (27, "User Behavior Analyst", "Analytics"),
            (28, "Customer Support L1", "Customer Success"), (29, "Customer Support L2", "Customer Success"), (30, "Onboarding Specialist", "Customer Success"),
            (31, "Success Manager", "Customer Success"), (32, "Voice of Customer", "Customer Success"), (33, "Finance & Operations", "Finance & Legal"),
            (34, "Legal & Compliance", "Finance & Legal"), (35, "Fundraising Prep", "Finance & Legal"), (36, "Founder OS", "Founder Layer"),
            (37, "Knowledge Manager", "Founder Layer"), (38, "Hiring Intelligence", "Founder Layer"), (39, "Engineering Commander", "Engineering"),
            (40, "Backend Engineer", "Engineering"), (41, "AI/ML Engineer", "Engineering"), (42, "Scraper Engineer", "Engineering"),
            (43, "Frontend Engineer", "Engineering"), (44, "Database Engineer", "Engineering"), (45, "Security Engineer", "Engineering"),
            (46, "Test & Release", "Engineering"), (47, "Localization Manager", "New Divisions"), (48, "PRE (Reliability)", "New Divisions"),
            (49, "Comp Intelligence", "New Divisions"), (50, "TalvixGuard Watchdog", "Reliability Infra")
        ]
        
        for dept_id, name, div in depts:
            toml_name = name.lower().replace(" ", "_").replace("&", "and").replace("/", "_").replace("-", "_")
            path = f"openfang/hands/{dept_id:02d}_{toml_name}.toml"
            self.registry[dept_id] = HandDefinition(dept_id, name, div, path)

    # ==========================
    # LAYER 1: TELEGRAM BINDINGS
    # ==========================
    async def process_telegram_message(self, message: str, sender_id: str) -> Dict[str, Any]:
        """
        Layer 1 & 2 Binding: ONLY Elvio interacts. 
        Routes natural language using Qwen3-235B Commander logic.
        """
        if sender_id != self.telegram_founder_id:
            logger.warning(f"UNAUTHORIZED MSG DELETED. Expected {self.telegram_founder_id}, got {sender_id}")
            return {"status": "BLOCKED", "message": "unauthorized"}

        logger.info(f"Received Founder Directive: {message}")
        return await self.route_intelligent(message)

    # ==========================
    # LAYER 2: ROUTING ENGINE (AI)
    # ==========================
    async def route_intelligent(self, instruction: str) -> Dict[str, Any]:
        """
        Simulate LLM rule-based routing to sequential or parallel fan-outs.
        As defined in Section 9 of the Architecture.
        """
        ins = instruction.lower()

        # Simulated routing rules for Qwen3-235B logic 
        if "instagram post" in ins:
            return await self.run_parallel_fanout([5, 7], "Draft Instagram post and visuals")
        
        elif "ad campaign" in ins:
            # Sequential: Marketing Director (4) -> Then Parallel (5,7)
            return await self.run_sequential([4, 5, 7, 12], "Ad campaign execution")

        elif "mrr" in ins or "metrics" in ins:
            return await self.run_parallel_fanout([24, 33], "Fetch MRR and financial metrics")

        elif "server is down" in ins or "alert" in ins:
            return await self.run_parallel_fanout([21, 20], "Urgent sever down response")

        elif "user complaint" in ins:
            return await self.run_sequential([28, 29], "Analyze and escalate user complaint")

        elif "partnership" in ins:
            return await self.run_sequential([15], "Review partnership opportunity and draft response for Elvio")

        elif "blog" in ins:
            return await self.run_sequential([6, 5, 12], "Draft and distribute blog post")

        else:
            # Fallback to Chief of Staff
            return await self.run_sequential([2], instruction)

    # ==========================
    # EVENT HANDLERS
    # ==========================
    async def handle_server1_webhook(self, event_type: str, severity: str, details: dict):
        """
        Connection B - S1 pushes events (e.g. signup, cancel, failure)
        Routes to specific departments without any PII.
        """
        logger.info(f"Server 1 Webhook: {event_type} | Severity: {severity}")
        
        if event_type == "payment_captured":
            await self.run_sequential([33], "Log payment captured")
        elif event_type == "new_paid_signup":
            await self.run_sequential([30], "Commence day 1 onboarding sequence")
        elif event_type == "subscription_cancelled":
            await self.run_sequential([14, 32], "Process cancellation and voice of customer")
        elif event_type in ["server_error", "agent_failure"]:
            await self.run_sequential([21, 39], f"Investigate system degradation: {details}")

        return {"status": "ACK", "handled": True}

    async def trigger_morning_briefing(self) -> Dict[str, Any]:
        """Runs daily at 7:00 AM IST. Parallel Fan-out of 6 core analytical hands."""
        logger.info("Executing 7:00 AM Morning Briefing Fan-Out (6 Departments)")
        dept_ids = [24, 33, 21, 14, 12, 25] # Analytst, Finance, DevOps, Retention, Distrubution, Growth Researcher
        return await self.run_parallel_fanout(dept_ids, "Generate Morning Briefing Data Blocks")

    # ==========================
    # EXECUTION TOPOLOGIES
    # ==========================
    async def run_parallel_fanout(self, dept_ids: List[int], task: str) -> Dict[str, Any]:
        """Fire multiple sessions concurrently. Always non-blocking."""
        logger.info(f"Initiating PARALLEL FAN-OUT for Depts: {dept_ids}")
        tasks: List[Task] = []
        
        for dept_id in dept_ids:
            if dept_id in self.registry:
                tasks.append(asyncio.create_task(self._trigger_hand(self.registry[dept_id], task)))

        results = await asyncio.gather(*tasks, return_exceptions=True)
        return {"mode": "parallel", "task": task, "triggered_depts": dept_ids, "results": [str(r) for r in results]}

    async def run_sequential(self, dept_ids: List[int], task: str) -> Dict[str, Any]:
        """Execute one hand, wait for response, pass to next."""
        logger.info(f"Initiating SEQUENTIAL PIPELINE for Depts: {dept_ids}")
        sequential_results = []
        
        for dept_id in dept_ids:
            if dept_id in self.registry:
                hand = self.registry[dept_id]
                # In real scenario, output of hand N is input to hand N+1
                logger.info(f"Sequential Mode: Triggering {hand.name}")
                res = await self._trigger_hand(hand, task)
                sequential_results.append({dept_id: res})
                
        return {"mode": "sequential", "task": task, "triggered_depts": dept_ids, "log": sequential_results}

    async def _trigger_hand(self, hand: HandDefinition, task: str) -> Dict[str, Any]:
        """Invoke the actual OpenFang Hand via API, with strict depth limit = 1"""
        hand.status = "ACTIVE"
        hand.last_action = task
        hand.last_updated = datetime.now()

        # Simulated or actual runtime caller
        try:
            result = await OpenFangRunner.execute_hand(hand.config_path, task)
            hand.status = "IDLE" if result.get("status") == "SUCCESS" else "FAILED"
            return result
        except Exception as e:
            logger.error(f"Hand {hand.dept_id} OpenFang Execution Failed: {str(e)}")
            hand.status = "FAILED"
            return {"status": "FAILED", "message": str(e)}

    # ==========================
    # METRICS AND PULSE
    # ==========================
    def get_pulse(self) -> Dict[str, Any]:
        """Aggregate health metrics for all 50 departments and system."""
        active_count = sum(1 for h in self.registry.values() if h.status == "ACTIVE")
        failed_count = sum(1 for h in self.registry.values() if h.status == "FAILED")
        
        division_stats: Dict[str, int] = {}
        for h in self.registry.values():
            division_stats[h.division] = division_stats.get(h.division, 0) + 1
            
        status_label = "OPTIMAL"
        if failed_count > 3: status_label = "DEGRADED"
        if failed_count > 10: status_label = "LOCKDOWN"
            
        return {
            "status": status_label,
            "timestamp": datetime.now().isoformat(),
            "active_agents": active_count,
            "critical_fails": failed_count,
            "metrics": {
                "total_depts": len(self.registry),
                "by_division": division_stats
            }
        }

commander = CEOController()
