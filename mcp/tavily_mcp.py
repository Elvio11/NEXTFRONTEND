import sys
import json
import httpx
import os
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Tavily")

@mcp.tool()
async def search(query: str, api_key: str = None) -> dict:
    """Search the web using Tavily API."""
    key = api_key or os.environ.get("TAVILY_API_KEY")
    if not key:
        return {"status": "error", "message": "TAVILY_API_KEY is required"}
        
    url = "https://api.tavily.com/search"
    payload = {"api_key": key, "query": query, "include_answer": True}
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json=payload)
        if resp.status_code != 200:
            return {"status": "error", "message": resp.text}
        return {"status": "success", "data": resp.json()}

if __name__ == "__main__":
    mcp.run()
