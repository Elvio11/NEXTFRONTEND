"""
skills/resume_tailor.py
Tailors a user's parsed resume to a specific job description using Sarvam-M Think.

Reads the parsed resume from FluxShare (/storage/parsed-resumes/{user_id}.json.gz).
Calls Sarvam-M Think to reorder/reframe bullets using JD keyword alignment.
Generates a python-docx .docx file written to /storage/tailored-resumes/{user_id}/{job_id}.docx.

THE ABSOLUTE CONSTRAINT: NEVER fabricate skills, experience, certifications, or achievements.
Only reorder and reframe what already exists in the resume. Missing skills stay missing.
"""

import json
from io import BytesIO
from datetime import datetime, timezone

from llm.sarvam import sarvam, SarvamUnavailableError
from skills.humanizer_prompt import HUMANIZER_GUIDELINES
from skills.storage_client import get_json_gz, put_bytes
from skills.mcp_wrapper import MCPWrapper


# ─── Tailoring Prompt ──────────────────────────────────────────────────────────

def _build_tailor_prompt(resume: dict, job: dict) -> str:
    return f"""You are an expert resume tailor. Rewrite the resume to maximise fit for this specific job.

ABSOLUTE RULES (never violate):
- NEVER add skills, certifications, or experience that are not in the original resume
- NEVER change dates, company names, job titles, or education institutions
- ONLY reorder bullets and reframe using JD terminology where synonyms exist
- Missing skills stay missing — do not imply them

JOB DETAILS:
Title:   {job.get('title', '')}
Company: {job.get('company', '')}
Required skills: {', '.join(job.get('required_skills', [])[:20])}
JD summary: {job.get('jd_summary', job.get('raw_jd', ''))[:1000]}

ORIGINAL RESUME:
{json.dumps(resume, indent=2)[:3000]}

{HUMANIZER_GUIDELINES}

OUTPUT FORMAT — Return ONLY a JSON object with this exact structure:
{{
  "name":         "<full name from resume>",
  "email":        "<email>",
  "phone":        "<phone>",
  "summary":      "<rewritten 2-3 sentence summary aligned to this role>",
  "skills":       ["<required skills first, then others — no new skills>"],
  "experience": [
    {{
      "title":   "<exact job title — do not change>",
      "company": "<exact company — do not change>",
      "dates":   "<exact dates — do not change>",
      "bullets": ["<reordered/reframed bullet — most relevant to THIS job first>"]
    }}
  ],
  "education": [
    {{
      "degree":      "<exact degree>",
      "institution": "<exact institution>",
      "year":        "<year>"
    }}
  ],
  "certifications": ["<certifications from original only>"]
}}"""





# ─── Main Entry ────────────────────────────────────────────────────────────────

async def tailor_resume(user_id: str, job: dict) -> str:
    """
    Tailor the user's resume to the given job and write the .docx to FluxShare.

    Args:
        user_id: User UUID
        job: dict with keys: id, title, company, required_skills, jd_summary, raw_jd

    Returns:
        Storage path string: /storage/tailored-resumes/{user_id}/{job_id}.docx

    Raises:
        SarvamUnavailableError: if Sarvam-M is down — agent catches and returns skipped
        FileNotFoundError: if parsed resume doesn't exist on FluxShare
    """
    job_id = str(job.get("id", "unknown"))

    try:
        resume = await get_json_gz(f"parsed-resumes/{user_id}.json.gz")
    except Exception as exc:
        raise FileNotFoundError(f"Parsed resume not found: {exc}")

    prompt  = _build_tailor_prompt(resume, job)
    raw     = await sarvam.complete(prompt, mode="think")

    # Parse Sarvam-M JSON response
    try:
        # Strip markdown fences if present
        clean = raw.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        tailored = json.loads(clean.strip())
    except (json.JSONDecodeError, IndexError) as exc:
        raise SarvamUnavailableError(f"Sarvam returned non-JSON tailor response: {exc}") from exc

    # Build and write DOCX & PDF via MCP
    docx_path = f"tailored-resumes/{user_id}/{job_id}.docx"
    pdf_path  = f"tailored-resumes/{user_id}/{job_id}.pdf"
    
    wrapper = MCPWrapper()
    payload = {"payload_json": json.dumps(tailored)}

    try:
        # 1. Generate DOCX
        docx_res = await wrapper.run_tool("docx_generator", payload) # Note: tool name might be generate_docx or docx_generator depending on registration
        # Actually in docx_generator.py we have @mcp.tool() def generate_docx and generate_pdf
        # Since the server name is DocxGenerator, we check how it's called.
        
        async def _save_mcp_file(tool_name: str, path: str):
            res = await wrapper.run_tool(tool_name, payload)
            if res.get("status") == "error":
                raise Exception(f"MCP {tool_name} failed: {res.get('message')}")
            
            import base64
            b64_content = res.get("content_base64", "")
            if not b64_content:
                raise Exception(f"MCP {tool_name} returned empty content")
            
            await put_bytes(path, base64.b64decode(b64_content))

        await _save_mcp_file("generate_docx", docx_path)
        await _save_mcp_file("generate_pdf", pdf_path)
        
    except Exception as exc:
        raise Exception(f"Failed to generate documents via MCP: {exc}")

    return docx_path # Returning docx_path as primary, but both are saved
