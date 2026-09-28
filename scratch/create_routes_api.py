code = """import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('routing_rules')
      .select('country_id, internal_service');
      
    if (error) throw error;
    
    return NextResponse.json({ routes: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
"""
with open('src/app/api/routes/available/route.ts', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
