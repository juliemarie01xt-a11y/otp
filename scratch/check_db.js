const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('routing_rules').select('*').eq('country_id', '33').eq('internal_service', 'go').then(r => console.dir(r.data, {depth: null}));
