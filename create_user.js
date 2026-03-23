require('dotenv').config({ path: 'c:\\Users\\DELL\\Antigravity\\Talvix\\branch-server1\\.env' });
const { getSupabase } = require('./src/lib/supabaseClient');

async function run() {
    try {
        const sb = getSupabase();
        
        const testUser = {
            id: '11111111-1111-1111-1111-111111111111',
            email: 'test@talvix.ai',
            full_name: 'Test User',
            tier: 'professional',
            onboarding_completed: true,
            wa_opted_in: false,
            fit_scores_stale: true,
            skill_gap_stale: true,
            career_intel_stale: true,
            auto_apply_enabled: false,
            auto_apply_paused: false,
        };

        const { data, error } = await sb.from('users').upsert(testUser).select();
        if (error) {
            console.error('Supabase Error:', error);
            process.exit(1);
        }
        if (data && data.length > 0) {
            console.log('CREATED_USER_ID=' + data[0].id);
        }
    } catch (e) {
        console.error('Exception:', e);
    }
}
run();
