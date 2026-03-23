import sys
import httpx
import os
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Firecrawl")

@mcp.tool()
async def scrape(url: str, formats: list = None, schema: dict = None) -> dict:
    """Scrape a URL using Firecrawl API with optional LLM extraction schema."""
    formats = formats or ["markdown"]
    api_key = os.environ.get("FIRECRAWL_API_KEY")
    if not api_key:
        return {"status": "error", "message": "FIRECRAWL_API_KEY is missing"}
    
    endpoint = "https://api.firecrawl.dev/v1/scrape"
    headers = {"Authorization": f"Bearer {api_key}"}
    payload = {"url": url, "formats": formats}
    
    if schema:
        # Ensure 'extract' is the primary format if schema is given
        if "extract" not in formats:
            formats.append("extract")
        # Remove 'json' if present as it requires additional options we aren't using
        if "json" in formats:
            formats.remove("json")
        payload["extract"] = {"schema": schema}
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            resp = await client.post(endpoint, json=payload, headers=headers)
            if resp.status_code != 200:
                return {"status": "error", "message": resp.text}
            return {"status": "success", "data": resp.json()}
        except Exception as e:
            return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    mcp.run()
