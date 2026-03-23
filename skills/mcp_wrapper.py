"""
MCP Wrapper Utility for Talvix Server 2 (Intelligence Layer)
Replaces heavy Python libraries (PyPDF, etc.) and custom APIs with MCPorter CLI calls.
"""

import asyncio
import json
import logging
from typing import Any, Dict, Optional
from tenacity import retry, stop_after_attempt, wait_exponential

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MCPWrapper:
    def __init__(self, mcporter_path: str = "mcporter"):
        self.mcporter_path = mcporter_path

    @retry(
        stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def run_tool(self, tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute an MCP tool via MCPorter CLI asynchronously.
        Args:
            tool_name: Name of the MCP tool (e.g., 'markitdown', 'tavily')
            args: Arguments to pass to the tool
        Returns:
            Dict containing tool output
        """
        try:
            # Bypass .CMD wrapper on Windows to avoid shell corruption of complex JSON/URLs
            import sys
            import os
            
            # Find the direct JS entry point for mcporter
            npm_root = "C:/Users/DELL/AppData/Roaming/npm/node_modules"
            cli_js = f"{npm_root}/mcporter/dist/cli.js"
            
            # Determine MCP call target
            if "." in tool_name:
                call_target = tool_name
            else:
                method_map = {
                    "markitdown": "extract",
                    "tavily": "search",
                    "firecrawl": "scrape"
                }
                call_target = f"{tool_name}.{method_map.get(tool_name, 'execute')}"

            # Consolidate all args into one JSON string for robust CLI handover
            json_args = json.dumps(args)
            cmd = ["node", cli_js, "call", call_target, "--args", json_args, "--output", "json"]

            logger.info(f"Executing direct Node MCP command: node {cli_js} call {call_target} --args <JSON> --output json")

            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            try:
                stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=300)
            except asyncio.TimeoutError:
                proc.kill()
                logger.error(f"MCP tool {tool_name} timed out")
                raise Exception(f"MCP tool {tool_name} timed out after 300 seconds")

            if proc.returncode != 0:
                raise Exception(f"MCP Tool Error: {stderr.decode()}")

            return json.loads(stdout.decode())

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse MCP output: {e}")
            raise
        except Exception as e:
            logger.error(f"MCP execution failed: {str(e)}")
            raise

    async def extract_text(self, file_path: str) -> Dict[str, Any]:
        """Wrapper for MarkItDown MCP - Extract text from file"""
        return await self.run_tool("markitdown", {"file": file_path})

    async def search_web(self, query: str) -> Dict[str, Any]:
        """Wrapper for Tavily MCP - Search web"""
        return await self.run_tool("tavily", {"query": query})
