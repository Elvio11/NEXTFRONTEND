"""
tests/test_agent6.py
Test Group 4: Agent 6 — Fit Scorer (Prefilter Step)

Tests hybrid search logic (pgvector + BM25) and top_n capping.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest


def _make_mock_db():
    mock_db = MagicMock()
    # Return embedding and tier in sequence
    mock_db.table.return_value.select.return_value.eq.return_value.single.return_value.execute.side_effect = [
        MagicMock(data={"resume_embedding": [0.1] * 768}),
        MagicMock(data={"tier": "professional"}),
        MagicMock(data={"resume_embedding": [0.1] * 768}),
        MagicMock(data={"tier": "professional"}),
        MagicMock(data={"resume_embedding": [0.1] * 768}),
        MagicMock(data={"tier": "professional"}),
    ]
    return mock_db


@pytest.mark.asyncio
async def test_prefilter_returns_top_n():
    """Prefilter should cap output at specified top_n."""
    from skills.prefilter_engine import prefilter

    mock_db = _make_mock_db()
    mock_results = [{"id": f"job-{i}"} for i in range(500)]

    with patch("skills.prefilter_engine.get_supabase", return_value=mock_db), \
         patch("skills.prefilter_engine.hybrid_search", new_callable=AsyncMock, return_value=mock_results):

        # Test full_scan mode (top_n=300)
        results = await prefilter("user-1", ["python"], mode="full_scan")
        assert len(results) == 300

        # Test delta mode (top_n=100)
        results = await prefilter("user-1", ["python"], mode="delta")
        assert len(results) == 100


@pytest.mark.asyncio
async def test_prefilter_returns_empty_if_no_embedding():
    """Prefilter should return [] if user has no resume embedding."""
    from skills.prefilter_engine import prefilter

    mock_db = MagicMock()
    mock_db.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(data={})

    with patch("skills.prefilter_engine.get_supabase", return_value=mock_db):
        results = await prefilter("user-1", ["python"])
        assert results == []


@pytest.mark.asyncio
async def test_hyde_called_for_weak_results():
    """HyDE should be triggered if first-pass results < 10 in full_scan mode."""
    from skills.prefilter_engine import prefilter

    mock_db = _make_mock_db()
    mock_results = [{"id": "job-1"}]
    hyde_results = [{"id": "job-hyde-1"}]

    with patch("skills.prefilter_engine.get_supabase", return_value=mock_db), \
         patch("skills.prefilter_engine.hybrid_search", new_callable=AsyncMock, return_value=mock_results), \
         patch("skills.prefilter_engine.get_json_gz", new_callable=AsyncMock, return_value={"raw_text": "resume content"}), \
         patch("skills.prefilter_engine.hyde_search", new_callable=AsyncMock, return_value=hyde_results) as mock_hyde:

        results = await prefilter("user-1", ["python"], mode="full_scan")

        assert mock_hyde.called
        assert len(results) == 2
        assert results[0]["id"] == "job-1"
        assert results[1]["id"] == "job-hyde-1"
