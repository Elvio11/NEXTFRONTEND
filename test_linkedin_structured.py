import asyncio
import json
import os
import sys
from dotenv import load_dotenv

# Add parent directory to path to find skills
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from skills.mcp_wrapper import MCPWrapper

async def test_linkedin_structured():
    print("--- STARTING STRUCTURED LINKEDIN SCRAPING TEST ---")
    
    load_dotenv()
    wrapper = MCPWrapper()
    
    target_url = "https://in.jooble.org/jobs-software-engineer"
    print(f"Targeting Jooble URL: {target_url}")
    
    # Define our needed schema for jobs
    job_schema = {
        "type": "object",
        "properties": {
            "jobs": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "company": {"type": "string"},
                        "location": {"type": "string"},
                        "city_canonical": {"type": "string"},
                        "apply_url": {"type": "string"},
                        "raw_jd": {"type": "string"}
                    },
                    "required": ["title", "company", "location"]
                }
            }
        }
    }
    
    try:
        # Run tool with schema
        print("Requesting structured extraction from Firecrawl...")
        result = await wrapper.run_tool("firecrawl", {
            "url": target_url,
            "formats": ["extract"],
            "schema": job_schema
        })
        
        print("\n--- RESPONSE RECEIVED ---")
        if "data" in result:
             # Look for extraction result
             ext_data = result.get("data", {}).get("data", {}).get("extract", {})
             if not ext_data:
                 # Backup if format is different
                 ext_data = result.get("data", {}).get("extract", {})
             
             if ext_data:
                 print("✅ Structured Data successfully extracted!")
                 print(json.dumps(ext_data, indent=2))
             else:
                 print("⚠️ No extract data found in response. Dumping raw response:")
                 print(json.dumps(result, indent=2))
        elif "error" in result:
             print(f"❌ Error from MCP: {result['error']}")
        else:
             print("Unexpected format:")
             print(json.dumps(result, indent=2))
             
    except Exception as e:
        print(f"❌ Exception occurred: {str(e)}")
        
    print("\n--- TEST COMPLETED ---")

if __name__ == "__main__":
    asyncio.run(test_linkedin_structured())
