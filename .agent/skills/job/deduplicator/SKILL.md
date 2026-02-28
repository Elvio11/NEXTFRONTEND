---
name: deduplicator
description: SHA-256 fingerprint generation for job deduplication. Use this skill before every DB write in Agent 9. The fingerprint prevents the same job appearing multiple times because it was found on both Indeed and LinkedIn.
---

# Skill: deduplicator

## Purpose
Generate a consistent fingerprint for every scraped job so the same role at the same company never appears twice in the database, regardless of which platform found it.

## Fingerprint Formula

```python
import hashlib

def generate_fingerprint(title: str, company: str, city: str, employment_type: str) -> str:
    raw = (
        title.lower().strip() +
        company.lower().strip() +
        city.lower().strip() +
        employment_type.lower().strip()
    )
    return hashlib.sha256(raw.encode()).hexdigest()
```

## Fields INCLUDED in fingerprint
- `title` — job title (lowercased)
- `company` — company name (lowercased)
- `city` — city/location (lowercased, use `city_canonical` after normalisation)
- `employment_type` — full_time / part_time / contract / internship / not_specified

## Fields EXCLUDED from fingerprint
- `salary` — varies per platform for same job
- `apply_url` — different URL per platform for same job
- `posted_date` — different dates per platform for same job

## City Normalisation (apply before fingerprinting)
```python
CITY_MAP = {
    "bengaluru": "bangalore",
    "bombay": "mumbai",
    "new delhi": "delhi",
    "ncr": "delhi",
    "gurugram": "gurgaon",
    "hyderabad": "hyderabad",
    "chennai": "chennai",
    "pune": "pune"
}
```

## DB Upsert Logic
```sql
INSERT INTO jobs (fingerprint, title, company, ...)
ON CONFLICT (fingerprint) DO UPDATE SET
    last_seen_at = NOW(),
    apply_url = EXCLUDED.apply_url  -- update with latest URL
RETURNING id, xmax;

-- xmax = 0 → brand new INSERT → is_new = TRUE (already set by DEFAULT TRUE)
-- xmax ≠ 0 → existing row updated → is_new stays FALSE
```

## Multi-Platform Handling
When the same job is found on multiple platforms:
- The `jobs` table has ONE row (deduplicated by fingerprint)
- The `job_sources` table has MULTIPLE rows — one per platform
- This enables best apply_url selection: prefer LinkedIn Easy Apply > Indeed Easy Apply > others
