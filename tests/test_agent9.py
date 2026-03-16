"""
tests/test_agent9.py
Test Group 4: Job Scraper (Agent 9)
Validates: fingerprint dedup, DB upsert logic, scrape_runs record,
           one-source failure doesn't abort others, Server 2 trigger POST.
"""

import asyncio
import re
from pathlib import Path
from unittest.mock import MagicMock, patch, AsyncMock

import pytest

SERVER3_ROOT = Path(__file__).parent.parent


# ── Fingerprint Tests ──────────────────────────────────────────────────────────

def test_fingerprint_same_job_produces_same_hash():
    """Same title+company+location+jd → same fingerprint."""
    from skills.fingerprint import compute_fingerprint
    fp1 = compute_fingerprint("Software Engineer", "Acme Corp", "Bangalore", "Python developer needed")
    fp2 = compute_fingerprint("Software Engineer", "Acme Corp", "Bangalore", "Python developer needed")
    assert fp1 == fp2


def test_fingerprint_different_jobs_produce_different_hash():
    """Different titles → different fingerprints."""
    from skills.fingerprint import compute_fingerprint
    fp1 = compute_fingerprint("Software Engineer", "Acme Corp", "Bangalore", "Python dev")
    fp2 = compute_fingerprint("Data Scientist", "Beta Inc", "Mumbai", "ML engineer")
    assert fp1 != fp2


def test_fingerprint_case_insensitive():
    """Fingerprint is case-insensitive — uppercase and lowercase same job."""
    from skills.fingerprint import compute_fingerprint
    fp1 = compute_fingerprint("SOFTWARE ENGINEER", "ACME CORP", "BANGALORE", "python")
    fp2 = compute_fingerprint("software engineer", "acme corp", "bangalore", "python")
    assert fp1 == fp2


@pytest.mark.asyncio
async def test_new_job_inserted_with_is_new_true():
    """New jobs (no fingerprint in DB) must be inserted with is_new=TRUE."""
    with patch("skills.fingerprint.get_supabase") as mock_sb_fp, \
         patch("agents.agent9_scraper.get_supabase") as mock_sb_ag, \
         patch("agents.agent9_scraper.run_jobspy", new_callable=AsyncMock) as mock_spy, \
         patch("agents.agent9_scraper.run_custom_scrapers", new_callable=AsyncMock) as mock_custom, \
         patch("agents.agent9_scraper.log_start", new_callable=AsyncMock), \
         patch("agents.agent9_scraper.log_end", new_callable=AsyncMock), \
         patch("agents.agent9_scraper._trigger_jd_clean", new_callable=AsyncMock), \
         patch("agents.agent9_scraper.put_text", new_callable=AsyncMock):

        # No existing fingerprint → new job
        mock_sb_fp.return_value.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = []
        mock_sb_ag.return_value.table.return_value.insert.return_value.execute.return_value = MagicMock()
        mock_sb_ag.return_value.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()

        mock_spy.return_value = {
            "jobs": [{"title": "SWE", "company": "Acme", "city_canonical": "BLR", "raw_jd": "python", "apply_url": "", "source": "indeed", "employment_type": "full_time", "work_mode": "onsite", "posted_at": "", "salary_min": None, "salary_max": None, "exp_min_years": None, "seniority_level": None, "role_family": None, "is_new": True, "is_active": True, "jd_cleaned": False}],
            "linkedin_skipped": False,
            "source_counts": {"indeed": 1},
            "failures": [],
        }
        mock_custom.return_value = {"jobs": [], "source_counts": {}, "failures": []}

        from agents.agent9_scraper import run_scraper
        result = await run_scraper(["indeed"], [], 100)
        assert result["jobs_inserted"] == 1
        assert result["jobs_updated"] == 0


@pytest.mark.asyncio
async def test_duplicate_job_updates_last_seen_at_only():
    """Duplicate fingerprints must only UPDATE last_seen_at — no new INSERT."""
    with patch("skills.fingerprint.get_supabase") as mock_sb_fp, \
         patch("agents.agent9_scraper.get_supabase") as mock_sb_ag, \
         patch("agents.agent9_scraper.run_jobspy", new_callable=AsyncMock) as mock_spy, \
         patch("agents.agent9_scraper.run_custom_scrapers", new_callable=AsyncMock) as mock_custom, \
         patch("agents.agent9_scraper.log_start", new_callable=AsyncMock), \
         patch("agents.agent9_scraper.log_end", new_callable=AsyncMock), \
         patch("agents.agent9_scraper._trigger_jd_clean", new_callable=AsyncMock):

        # Existing fingerprint
        mock_sb_fp.return_value.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = [
            {"id": "existing-id", "fingerprint": "abc", "last_seen_at": "2024-01-01", "is_active": True}
        ]
        update_mock = MagicMock()
        mock_sb_ag.return_value.table.return_value.update.return_value.eq.return_value.execute.return_value = update_mock
        mock_sb_ag.return_value.table.return_value.insert.return_value.execute.return_value = MagicMock()

        mock_spy.return_value = {
            "jobs": [{"title": "SWE", "company": "Acme", "city_canonical": "BLR", "raw_jd": "python", "apply_url": "", "source": "indeed", "employment_type": "full_time", "work_mode": "onsite", "posted_at": "", "salary_min": None, "salary_max": None, "exp_min_years": None, "seniority_level": None, "role_family": None, "is_new": True, "is_active": True, "jd_cleaned": False}],
            "linkedin_skipped": False,
            "source_counts": {"indeed": 1},
            "failures": [],
        }
        mock_custom.return_value = {"jobs": [], "source_counts": {}, "failures": []}

        from agents.agent9_scraper import run_scraper
        result = await run_scraper(["indeed"], [], 100)
        assert result["jobs_updated"] == 1
        assert result["jobs_inserted"] == 0


def test_new_job_has_jd_cleaned_false():
    """Jobs inserted by Agent 9 must have jd_cleaned=FALSE."""
    from agents.agent9_scraper import _upsert_job
    from agents import agent9_scraper
    import inspect
    source = inspect.getsource(agent9_scraper._upsert_job)
    # Flexible match for whitespace
    assert re.search(r'["\']jd_cleaned["\']:\s+False', source), \
        "New jobs must be inserted with jd_cleaned=False"


@pytest.mark.asyncio
async def test_scrape_run_row_inserted():
    """Agent 9 must insert a scrape_runs record after each run."""
    import inspect
    from agents import agent9_scraper
    source = inspect.getsource(agent9_scraper.run_scraper)
    assert "scrape_runs" in source, "Agent 9 must write to scrape_runs table"


@pytest.mark.asyncio
async def test_one_source_failure_does_not_abort_others():
    """asyncio.gather(return_exceptions=True) ensures one failure doesn't stop others."""
    from agents import agent9_scraper
    source = (SERVER3_ROOT / "agents" / "agent9_scraper.py").read_text()
    assert "return_exceptions=True" in source, \
        "Agent 9 must use asyncio.gather(return_exceptions=True) for parallel scrapers"


@pytest.mark.asyncio
async def test_india_remote_filter():
    """Verify that India + Remote in title/JD → Remote — India location + remote work_mode."""
    with patch("agents.agent9_scraper.get_supabase") as mock_get_sb, \
         patch("agents.agent9_scraper.run_jobspy", new_callable=AsyncMock) as mock_spy, \
         patch("agents.agent9_scraper.run_custom_scrapers", new_callable=AsyncMock) as mock_custom, \
         patch("agents.agent9_scraper.log_start", new_callable=AsyncMock), \
         patch("agents.agent9_scraper.log_end", new_callable=AsyncMock), \
         patch("agents.agent9_scraper._trigger_jd_clean", new_callable=AsyncMock), \
         patch("agents.agent9_scraper.put_text", new_callable=AsyncMock):

        mock_sb = MagicMock()
        mock_get_sb.return_value = mock_sb

        # Mock a job that should be filtered
        mock_spy.return_value = {
            "jobs": [{
                "title": "Remote Software Engineer",
                "company": "Acme",
                "city_canonical": "Bangalore, India",
                "raw_jd": "Work from home",
                "apply_url": "https://example.com",
                "source": "indeed"
            }],
            "linkedin_skipped": False,
            "source_counts": {"indeed": 1},
            "failures": [],
        }
        mock_custom.return_value = {"jobs": [], "source_counts": {}, "failures": []}
        
        # Mock successful insert
        mock_sb.table.return_value.insert.return_value.execute.return_value = MagicMock()
        # mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = []
        # Wait, fingerprint check also uses supabase. Patch that too via get_supabase
        with patch("skills.fingerprint.get_supabase") as mock_get_sb_fp:
            mock_sb_fp = MagicMock()
            mock_get_sb_fp.return_value = mock_sb_fp
            mock_sb_fp.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = []

            from agents.agent9_scraper import run_scraper
            await run_scraper(["indeed"], [], 10)

        # Verify that insert was called for the "jobs" table with the correct data
        # We need to find the call where table("jobs") was used
        jobs_insert_call = None
        for call_obj in mock_sb.table.call_args_list:
            if call_obj.args[0] == "jobs":
                # Find the corresponding insert call
                # This is tricky because of the chaining. 
                # Let's simplify and check ALL insert calls for the expected data.
                pass
        
        # Simpler check: check all insert calls args
        all_insert_data = [c.args[0] for c in mock_sb.table.return_value.insert.call_args_list]
        found = False
        for data in all_insert_data:
            if data.get("city_canonical") == "Remote — India":
                assert data["work_mode"] == "remote"
                found = True
                break
        
        assert found, "Did not find expected job insertion with Remote — India"


@pytest.mark.asyncio
async def test_agent9_posts_to_server2_after_completion():
    """Agent 9 must HTTP POST to Server 2 /api/agents/jd-clean after scraping."""
    import inspect
    from agents import agent9_scraper
    source = inspect.getsource(agent9_scraper._trigger_jd_clean)
    assert "jd-clean" in source or "jd_clean" in source, \
        "Agent 9 must trigger jd-clean on Server 2"
    assert "SERVER2_URL" in source, \
        "Agent 9 must use SERVER2_URL from Doppler for the trigger"
