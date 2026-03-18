"""
MCP Wrapper Utility for Talvix Execution Layer
Replaces heavy Python libraries (Selenium, PyPDF) with MCPorter CLI calls.
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
            tool_name: Name of the MCP tool (e.g., 'playwright', 'firecrawl')
            args: Arguments to pass to the tool
        Returns:
            Dict containing tool output
        """
        import subprocess
        try:
            # Construct command: mcporter run <tool> --json <args>
            cmd = [self.mcporter_path, "run", tool_name, "--json"]

            # Flatten args into CLI flags
            for key, value in args.items():
                cmd.extend([f"--{key}", str(value)])

            logger.info(f"Executing MCP command: {' '.join(cmd)}")

            # Create subprocess asynchronously
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

            return json.loads(stdout.decode())

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse MCP output: {e}")
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
        args = {"action": "send", "to": to, "subject": subject, "body": body}
        if token:
            args["token"] = token
        return await self.run_tool("mcp-gmail", args)

    async def search_email(self, query: str, token: Optional[str] = None) -> Dict[str, Any]:
        """Wrapper for Gmail MCP - Search emails"""
        args = {"action": "search", "query": query}
        if token:
            args["token"] = token
        return await self.run_tool("mcp-gmail", args)
