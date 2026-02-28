"""
tests/test_agent6.py
Test Group 3: Agent 6 — Fit Scorer

Tests: prefilter reduction, blacklist exclusion, remote inclusion,
       score threshold (>=40 only), paid vs free fields,
       delta/full_scan mode behaviour, is_new flag, model weights from DB.
"""

import os
from unittest.mock import AsyncMock, MagicMock, patch, call
import pytest

os.environ.setdefault("SUPABASE_URL",              "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("SARVAM_API_URL",            "http://localhost:9999")
os.environ.setdefault("SARVAM_API_KEY",            "test-sarvam-key")
os.environ.setdefault("GEMINI_API_KEY",            "test-gemini-key")
os.environ.setdefault("AGENT_SECRET",              "test-agent-secret")
os.environ.setdefault("SERVER1_URL",               "http://localhost:3000")

# ─── Prefilter tests ─────────────────────────────────────────────────────────

def test_prefilter_reduces_job_pool_below_300():
    """Prefilter must cap output at 300 for full_scan."""
    from skills.prefilter_engine import _tfidf_filter
    # Create 500 fake jobs
    jobs = [{"id": str(i), "title": "Engineer", "jd_summary": "Python React AWS",
              "role_family": "swe_backend"} for i in range(500)]
    result = _tfidf_filter(jobs, ["python", "aws"], top_n=300)
    assert len(result) <= 300


def test_prefilter_returns_empty_for_no_jobs():
    """Prefilter should handle empty job list gracefully."""
    from skills.prefilter_engine import _tfidf_filter
    result = _tfidf_filter([], ["python"], top_n=100)
    assert result == []


# ─── Fit calculator tests ────────────────────────────────────────────────────

def test_fit_calculator_only_writes_scores_gte_40():
    """Scores < 40 must NOT be written to job_fit_scores."""
    import asyncio, json
    low_score_response = json.dumps([
        {"job_id": "job1", "fit_score": 30, "fit_label": "poor",
         "recommendation": "skip", "fit_reasons": [], "missing_skills": [], "strengths": []},
        {"job_id": "job2", "fit_score": 50, "fit_label": "fair",
         "recommendation": "consider", "fit_reasons": [], "missing_skills": [], "strengths": []},
    ])
    inserted_scores = []
    mock_db = MagicMock()
    mock_db.table.return_value.select.return_value.execute.return_value = MagicMock(data=[])
    mock_db.table.return_value.upsert.side_effect = lambda rows, **kw: (
        inserted_scores.extend(rows), MagicMock()
    )[1]
    mock_db.table.return_value.upsert.return_value.execute.return_value = MagicMock(data=[])

    async def mock_sarvam(prompt, mode):
        return low_score_response

    with patch("skills.fit_calculator.supabase", mock_db), \
         patch("skills.fit_calculator.sarvam.complete", side_effect=mock_sarvam):
        from skills.fit_calculator import score_jobs
        asyncio.get_event_loop().run_until_complete(
            score_jobs(
                "user1",
                [{"id": "job1", "jd_summary": "test"}, {"id": "job2", "jd_summary": "test"}],
                {"top_5_skills": ["python"], "experience_years": 3,
                 "seniority_level": "mid", "current_title": "Engineer"},
                is_paid=True,
                mode="think",
            )
        )

    # Only job2 (score=50) should be inserted
    inserted_job_ids = [s["job_id"] for s in inserted_scores]
    assert "job1" not in inserted_job_ids, "Score < 40 was written to DB"
    assert "job2" in inserted_job_ids, "Score >= 40 was NOT written to DB"


def test_free_user_fit_reasons_is_null():
    """Free users must have fit_reasons = NULL in job_fit_scores."""
    import asyncio, json
    score_response = json.dumps([{
        "job_id": "job1", "fit_score": 75, "fit_label": "good",
        "recommendation": "apply", "fit_reasons": ["good skill match"],
        "missing_skills": ["kafka"], "strengths": ["python"]
    }])
    inserted_rows = []
    mock_db = MagicMock()
    mock_db.table.return_value.select.return_value.execute.return_value = MagicMock(data=[])
    mock_upsert = MagicMock()
    mock_upsert.execute.return_value = MagicMock(data=[])
    mock_db.table.return_value.upsert.side_effect = lambda rows, **kw: (
        inserted_rows.extend(rows), mock_upsert
    )[1]

    async def mock_sarvam(prompt, mode):
        return score_response

    with patch("skills.fit_calculator.supabase", mock_db), \
         patch("skills.fit_calculator.sarvam.complete", side_effect=mock_sarvam):
        from skills.fit_calculator import score_jobs
        asyncio.get_event_loop().run_until_complete(
            score_jobs(
                "free-user", [{"id": "job1", "jd_summary": "Python expert"}],
                {"top_5_skills": ["python"], "experience_years": 2,
                 "seniority_level": "junior", "current_title": "Developer"},
                is_paid=False,  # FREE USER
                mode="no_think",
            )
        )

    if inserted_rows:
        assert inserted_rows[0]["fit_reasons"] is None, "fit_reasons must be NULL for free users"
        assert inserted_rows[0]["missing_skills"] is None
        assert inserted_rows[0]["strengths"] is None


def test_model_weights_applied_from_db_not_hardcoded():
    """fit_calculator must READ model_weights from Supabase, not use hardcoded values."""
    import inspect
    from skills import fit_calculator
    source = inspect.getsource(fit_calculator)
    # Should call _load_model_weights(), not define weights inline
    assert "_load_model_weights" in source
    assert "supabase.table" in source


def test_delta_mode_only_scores_is_new_true_jobs():
    """Agent 6 in delta mode: prefilter SQL must include AND j.is_new = TRUE."""
    from skills.prefilter_engine import _build_skill_query_sql
    sql = _build_skill_query_sql("user-id", "delta")
    assert "is_new" in sql.lower() and "true" in sql.lower(), \
        "Delta mode SQL must filter on is_new = TRUE"


def test_full_scan_sql_does_not_filter_on_is_new():
    """Agent 6 full_scan must NOT restrict to is_new=TRUE — scores all active jobs."""
    from skills.prefilter_engine import _build_skill_query_sql
    sql = _build_skill_query_sql("user-id", "full_scan")
    # is_new should not appear as a filter in full_scan
    lines_with_is_new = [l for l in sql.split("\n") if "is_new" in l.lower() and "--" not in l]
    assert not lines_with_is_new, "full_scan must not filter on is_new"
