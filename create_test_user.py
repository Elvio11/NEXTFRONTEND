import os
from supabase import create_client, Client


from db.client import get_supabase
supabase = get_supabase()

test_user = {
    'id': '22222222-2222-2222-2222-222222222222',
    'id': '22222222-2222-2222-2222-222222222222',
    'email': 'test2@talvix.ai',
    'full_name': 'Test User',
    'tier': 'professional',
    'onboarding_completed': True,
    'wa_opted_in': False,
    'fit_scores_stale': True,
    'skill_gap_stale': True,
    'career_intel_stale': True,
    'auto_apply_enabled': False,
    'auto_apply_paused': False,
}

response = supabase.table('users').upsert(test_user).execute()
print(f"Created user: {response.data}")
