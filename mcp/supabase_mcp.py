import os
import subprocess
import sys

def main():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url:
        print("Error: SUPABASE_URL environment variable is not set.", file=sys.stderr)
        sys.exit(1)
    if not key:
        print("Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    # Launch the official Supabase PostgREST MCP server
    # We use npx to ensure it's available without manual installation
    cmd = [
        "npx", "-y", "@supabase/mcp-server-postgrest",
        "--apiUrl", str(url),
        "--apiKey", str(key),
        "--schema", "public"
    ]

    try:
        # On Windows, we need shell=True to find npx.cmd
        subprocess.run(cmd, check=True, shell=True)
    except subprocess.CalledProcessError as e:
        print(f"Error: Supabase MCP server exited with code {e.returncode}", file=sys.stderr)
        sys.exit(e.returncode)
    except Exception as e:
        print(f"Error: Failed to launch Supabase MCP server: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
