from supabase import create_client
import os
url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
key = os.environ.get('SUPABASE_SECRET_KEY')
supabase = create_client(url, key)
res = supabase.table('routing_rules').select('*').execute()
for r in res.data:
    print(r)
