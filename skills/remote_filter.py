"""
skills/remote_filter.py
Remote Filter Skill for Agent 9 — Job Scraper.
Implements India Remote Filter as per March 16 Locked Decisions.
"""

import re
from typing import Dict, List, Tuple, Any
from db.client import get_supabase


async def load_remote_filter_patterns() -> Dict[str, List[str]]:
    """
    Load active patterns from remote_filter_config table.
    Returns a dictionary mapping pattern_type to list of patterns.
    """
    try:
        supabase = get_supabase()
        response = (
            supabase.table("remote_filter_config")
            .select("pattern, pattern_type")
            .eq("active", True)
            .execute()
        )

        patterns = {
            "hard_reject": [],
            "eo_provider": [],
            "global_signal": [],
            "timezone_good": [],
            "timezone_bad": [],
        }

        # Handle response data safely
        if hasattr(response, "data") and response.data:
            for row in response.data:
                # Handle both dict and object responses
                if isinstance(row, dict):
                    p_type = row.get("pattern_type")
                    pattern = row.get("pattern")
                else:
                    # Assume it's an object with attributes
                    p_type = getattr(row, "pattern_type", None)
                    pattern = getattr(row, "pattern", None)

                # Only process if p_type is a string and matches our expected keys
                if isinstance(p_type, str) and p_type in patterns and pattern:
                    patterns[p_type].append(pattern)

        return patterns
    except Exception as e:
        # Return empty patterns on error - will cause no filtering
        return {
            "hard_reject": [],
            "eo_provider": [],
            "global_signal": [],
            "timezone_good": [],
            "timezone_bad": [],
        }


def compile_patterns(patterns: List[str]) -> List[re.Pattern]:
    """Compile list of pattern strings into regex patterns."""
    compiled = []
    for pattern in patterns:
        try:
            compiled.append(re.compile(pattern, re.IGNORECASE))
        except re.error:
            pass  # Skip invalid patterns
    return compiled


def apply_location_restriction_rule(jd_text: str) -> Tuple[bool, bool]:
    """
    Apply Himalayas Exception rule.
    Returns (location_restriction_found, location_restriction_excludes_india)
    """
    # Location restriction patterns to detect country mentions
    location_patterns = [
        r"must be located in\s*([^,\.;\n]+)",
        r"must reside in\s*([^,\.;\n]+)",
        r"must be based in\s*([^,\.;\n]+)",
        r"location:\s*([^,\.;\n]+)",
        r"work location:\s*([^,\.;\n]+)",
        r"office location:\s*([^,\.;\n]+)",
        r"relocation to\s*([^,\.;\n]+)",
        r"must be willing to relocate to\s*([^,\.;\n]+)",
        r"relocating to\s*([^,\.;\n]+)",
        r"position based in\s*([^,\.;\n]+)",
    ]

    location_restriction_found = False
    location_restriction_excludes_india = False

    for pattern_str in location_patterns:
        try:
            pattern = re.compile(pattern_str, re.IGNORECASE)
            matches = pattern.findall(jd_text)
            for match in matches:
                location_restriction_found = True
                country = match.strip()
                # Normalize common country references
                country_lower = country.lower()
                if country_lower in ["india", "indian"]:
                    continue  # India mention doesn't trigger exclusion
                # Check if it's a non-India country
                if country_lower and country_lower != "india":
                    location_restriction_excludes_india = True
                    break
            if location_restriction_excludes_india:
                break
        except re.error:
            pass  # Skip invalid patterns

    return location_restriction_found, location_restriction_excludes_india


def compute_remote_scores(
    job: Dict[str, Any], patterns: Dict[str, List[re.Pattern]]
) -> Tuple[int, int]:
    """
    Compute remote_viability_score (0-3) and pool_tier (1-3) for a job.
    Returns (remote_viability_score, pool_tier).
    """
    title_text = str(job.get("title") or "").lower()
    jd_text = str(job.get("raw_jd") or "").lower()
    search_text = f"{title_text} {jd_text}"

    # 0. Check Free API Sources for direct pool assignment
    source = job.get("source", "")

    # Adzuna: Always Pool Tier 1 (India Domestic)
    if source == "adzuna":
        return (1, 1)

    # Remotive: Always Pool Tier 2 (Verified Global Remote - pre-curated)
    if source == "remotive":
        return (3, 2)

    # Himalayas: Has special handling via locationRestrictions
    if source == "himalayas":
        location_restrictions = job.get("locationRestrictions", "")
        if location_restrictions:
            # Check if locationRestrictions excludes India
            loc_found, loc_excludes_india = apply_location_restriction_rule(
                str(location_restrictions)
            )
            if loc_excludes_india:
                return (0, 1)  # Hard reject - location excludes India
        # If locationRestrictions is empty -> remote_viability_score = 3 automatically
        return (3, 2)

    # 2. Check hard reject patterns (includes location-based exclusions like "Must reside in [specific country other than India]")
    for pattern in patterns["hard_reject"]:
        if pattern.search(title_text) or pattern.search(jd_text):
            return (0, 1)  # Hard reject

    # 3. Check EOR provider and global signals (Tier 1)
    eo_found = any(
        pattern.search(title_text) or pattern.search(jd_text)
        for pattern in patterns["eo_provider"]
    )
    global_found = any(
        pattern.search(title_text) or pattern.search(jd_text)
        for pattern in patterns["global_signal"]
    )

    if eo_found or global_found:
        return (3, 2)  # Verified Global

    # 4. Check timezone patterns (Tier 2)
    timezone_good_found = any(
        pattern.search(title_text) or pattern.search(jd_text)
        for pattern in patterns["timezone_good"]
    )
    timezone_bad_found = any(
        pattern.search(title_text) or pattern.search(jd_text)
        for pattern in patterns["timezone_bad"]
    )

    if timezone_good_found or timezone_bad_found:
        return (2, 2)  # Timezone Compatible

    # 5. Default to Tier 3 (Unverified Remote)
    return (1, 3)
