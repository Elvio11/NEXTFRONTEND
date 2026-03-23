import asyncio
import json
import os
import sys
from dotenv import load_dotenv

# Add parent directory to path to find skills
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from skills.mcp_wrapper import MCPWrapper

async def test_scraping():
    print("--- STARTING MCP SCRAPING TEST ---")
    
    # Load env for API keys if needed
    load_dotenv()
    
    wrapper = MCPWrapper()
    
    # Test URL - we'll use a simple one first to verify connectivity
    test_url = "https://example.com"
    print(f"Testing Firecrawl MCP with URL: {test_url}")
    
    try:
        # We explicitly call firecrawl.scrape via the wrapper
        # The wrapper should map "firecrawl" to "firecrawl.scrape"
        result = await wrapper.run_tool("firecrawl", {"url": test_url})
        
        print("\n--- RESPONSE RECEIVED ---")
        if "data" in result:
            print("Status: Success from Python FastMCP Wrapper")
            markdown = result.get("data", {}).get("data", {}).get("markdown", "")
            print(f"Markdown snippet (first 100 chars): {markdown[:100]}...")
            print("✅ Scraping connectivity verified.")
        elif "error" in result:
            print(f"❌ Error in result: {result['error']}")
        else:
            print(f"Unexpected result format: {json.dumps(result, indent=2)}")
            
    except Exception as e:
        print(f"❌ Test failed with exception: {str(e)}")
        
    print("\n--- TEST COMPLETED ---")

if __name__ == "__main__":
    asyncio.run(test_scraping())
