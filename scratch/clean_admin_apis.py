import os
import re

files = [
    'src/app/api/admin/scan/route.ts',
    'src/app/api/admin/set-route/route.ts',
    'src/app/api/admin/delete-route/route.ts',
    'src/app/api/admin/bulk-set-routes/route.ts'
]

auth_import = "import { verifyAdmin } from '@/lib/auth';\n"
auth_check = """  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid Admin Credentials' }, { status: 401 });
  }
"""

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        code = f.read()
    
    code = code.replace(auth_import, "")
    code = code.replace(auth_check, "")
    
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(code)

print('done')
