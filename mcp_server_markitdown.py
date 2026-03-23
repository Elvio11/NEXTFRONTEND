import sys
import json
from mcp.server.fastmcp import FastMCP
from markitdown import MarkItDown

mcp = FastMCP("MarkItDown")

@mcp.tool()
def extract(file: str) -> str:
    """Extract text from a file using MarkItDown."""
    try:
        md = MarkItDown()
        result = md.convert(file)
        # Wrap response in JSON block so stdout is easily readable by custom CLI wrapper if needed
        return json.dumps({"text": result.text_content})
    except Exception as exc:
        return json.dumps({"error": str(exc)})

if __name__ == "__main__":
    mcp.run()
