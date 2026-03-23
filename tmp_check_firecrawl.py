
import asyncio
import os
from dotenv import load_dotenv
from skills.mcp_wrapper import MCPWrapper

load_dotenv()

async def check():
    print("Testing Firecrawl MCP...")
    wrapper = MCPWrapper()
    try:
        # Minimal scrape test
        res = await wrapper.run_tool("firecrawl", {
            "url": "https://example.com",
            "formats": ["markdown"]
        })
        print(f"Response: {str(res)[:500]}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check())
