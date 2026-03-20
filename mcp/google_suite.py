"""
mcp/google_suite.py
FastMCP server for Google Calendar and advanced Gmail queries.
Fulfills Agent 14's requirement for non-stripped-down follow-up logic.
"""

from mcp.server.fastmcp import FastMCP
import httpx
import os

mcp = FastMCP("GoogleSuite")

@mcp.tool()
async def create_calendar_event(
    summary: str,
    start_time: str,
    end_time: str,
    token: str,
    description: str = ""
) -> dict:
    """Creates a Google Calendar event. start_time and end_time should be ISO strings."""
    url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "summary": summary,
        "description": description,
        "start": {"dateTime": start_time},
        "end": {"dateTime": end_time},
    }
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload, headers=headers)
        if resp.status_code != 200:
            return {"status": "error", "message": resp.text}
        return {"status": "success", "event_id": resp.json().get("id")}

@mcp.tool()
async def get_gmail_thread(thread_id: str, token: str) -> dict:
    """Fetches a full Gmail thread to check for recruiter replies."""
    url = f"https://gmail.googleapis.com/gmail/v1/users/me/threads/{thread_id}"
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers)
        if resp.status_code != 200:
            return {"status": "error", "message": resp.text}
        return resp.json()

if __name__ == "__main__":
    mcp.run()
