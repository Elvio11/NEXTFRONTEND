"""
MCP Wrapper Utility for Talvix Execution Layer
Replaces heavy Python libraries (Selenium, PyPDF) with MCPorter CLI calls.
"""

import asyncio
import json
import logging
import subprocess
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
            tool_name: Name of the MCP tool (e.g., 'playwright', 'firecrawl')
            args: Arguments to pass to the tool
        Returns:
            Dict containing tool output
        """
        import subprocess
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
                # Default function names for popular services if not fully qualified
                method_map = {
                    "playwright": "browser_navigate",
                    "firecrawl": "scrape",
                    "markitdown": "extract",
                    "tavily": "search"
                }
                call_target = f"{tool_name}.{method_map.get(tool_name, 'execute')}"

            # Consolidate all args into one JSON string
            json_args = json.dumps(args)
            
            # Formulate direct node command
            cmd = ["node", cli_js, "call", call_target, "--args", json_args, "--output", "json"]

            logger.info(f"Executing direct Node MCP command: node {cli_js} call {call_target} --args <JSON> --output json")

            logger.info(f"Executing MCP command: {' '.join(cmd)}")

            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )

            # Wait for subprocess to complete with timeout
            try:
                stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=300)
            except asyncio.TimeoutError:
                proc.kill()
                logger.error(f"MCP tool {tool_name} timed out")
                raise Exception(f"MCP tool {tool_name} timed out after 300 seconds")

            if proc.returncode != 0:
                raise Exception(f"MCP Tool Error: {stderr.decode()}")

            # Robust JSON extraction
            raw_output = stdout.decode().strip()
            try:
                # Find the first { and last }
                start_idx = raw_output.find('{')
                end_idx = raw_output.rfind('}')
                
                if start_idx != -1 and end_idx != -1:
                    json_part = raw_output[start_idx : end_idx + 1]
                    try:
                        return json.loads(json_part)
                    except json.JSONDecodeError:
                        # Fallback: Parse as JS literal using node -e
                        logger.info("Parsing output as JS literal fallback...")
                        # We use a temp file to avoid shell escaping issues with complex JS
                        import tempfile
                        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as tf:
                            tf.write(f"const obj = {json_part}; console.log(JSON.stringify(obj));")
                            temp_path = tf.name
                        
                        try:
                            js_proc = await asyncio.create_subprocess_exec(
                                "node", temp_path,
                                stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE,
                            )
                            js_stdout, js_stderr = await asyncio.wait_for(js_proc.communicate(), timeout=30)
                            if js_proc.returncode == 0:
                                return json.loads(js_stdout.decode())
                            else:
                                logger.error(f"JS fallback failed: {js_stderr.decode()}")
                        finally:
                            if os.path.exists(temp_path):
                                os.remove(temp_path)
                
                return json.loads(raw_output)

            except Exception as e:
                logger.error(f"Failed to parse MCP output: {e}. Raw: {raw_output}")
                raise
        except Exception as e:
            logger.error(f"MCP execution failed: {str(e)}")
            raise

    async def browse_page(
        self, task: str, url: Optional[str] = None, cookies: Optional[list] = None
    ) -> Dict[str, Any]:
        """Wrapper for Playwright MCP - Browse page"""
        args = {"task": task}
        if url:
            args["url"] = url
        if cookies:
            args["cookies"] = json.dumps(cookies)
        return await self.run_tool("playwright", args)

    async def scrape_url(self, url: str) -> Dict[str, Any]:
        """Wrapper for Firecrawl MCP - Scrape URL"""
        return await self.run_tool("firecrawl", {"url": url})

    async def extract_text(self, file_path: str) -> Dict[str, Any]:
        """Wrapper for MarkItDown MCP - Extract text from file"""
        return await self.run_tool("markitdown", {"file": file_path})

    async def search_web(self, query: str) -> Dict[str, Any]:
        """Wrapper for Tavily MCP - Search web"""
        return await self.run_tool("tavily", {"query": query})

    async def send_email(self, to: str, subject: str, body: str, token: Optional[str] = None) -> Dict[str, Any]:
        """Wrapper for Gmail MCP - Send email"""
        args = {"to": to, "subject": subject, "body": body}
        if token:
            args["token"] = token
        return await self.run_tool("GoogleSuite.send_email", args)

    async def search_email(self, query: str, token: Optional[str] = None) -> Dict[str, Any]:
        """Wrapper for Gmail MCP - Search emails"""
        args = {"query": query}
        if token:
            args["token"] = token
        return await self.run_tool("GoogleSuite.search_email", args)

    async def get_email_thread(self, thread_id: str, token: str) -> Dict[str, Any]:
        """Wrapper for Gmail MCP - Get thread"""
        return await self.run_tool("GoogleSuite.get_gmail_thread", {"thread_id": thread_id, "token": token})

    async def create_calendar_event(
        self, summary: str, start_time: str, end_time: str, token: str, description: str = ""
    ) -> Dict[str, Any]:
        """Wrapper for Google Calendar MCP - Create calendar event"""
        return await self.run_tool(
            "GoogleSuite.create_calendar_event",
            {
                "summary": summary,
                "start_time": start_time,
                "end_time": end_time,
                "token": token,
                "description": description,
            },
        )
