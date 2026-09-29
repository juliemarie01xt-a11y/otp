require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function check() {
    const { data: activations } = await supabase.from('activations').select('cost');
    console.log("Activations sample:", activations.slice(0, 5));
}
check();
