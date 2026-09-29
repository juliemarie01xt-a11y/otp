require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function check() {
    const { data: activations } = await supabase.from('activations').select('id, cost, status').limit(10);
    console.log(activations);
}
check();
