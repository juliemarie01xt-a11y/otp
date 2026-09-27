import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SECRET_KEY!;

// This client bypasses RLS and should ONLY be used in server-side API routes
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
