require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function check() {
    const { data: statuses } = await supabase.from('activations').select('status');
    const counts = {};
    for (let s of statuses) {
        counts[s.status] = (counts[s.status] || 0) + 1;
    }
    console.log("Status counts:", counts);
}
check();
