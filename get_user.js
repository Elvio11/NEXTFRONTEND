require('dotenv').config({ path: 'c:\\Users\\DELL\\Antigravity\\Talvix\\branch-server1\\.env' });
const { getSupabase } = require('./src/lib/supabaseClient');

async function run() {
    try {
        const sb = getSupabase();
        const { data, error } = await sb.from('users').select('id').limit(1);
        if (error) {
            console.error('Supabase Error:', error);
            process.exit(1);
        }
        if (data && data.length > 0) {
            console.log('VALID_USER_ID=' + data[0].id);
        } else {
            console.log('NO_USERS_FOUND');
        }
    } catch (e) {
        console.error('Exception:', e);
    }
}
run();
