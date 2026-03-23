import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv('C:\\Users\\DELL\\Antigravity\\Talvix\\branch-server2\\.env')

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

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
