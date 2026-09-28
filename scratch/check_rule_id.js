const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({path: ".env.local"});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
supabase.from("routing_rules").select("*").limit(1).then(res => console.log(res.data));
