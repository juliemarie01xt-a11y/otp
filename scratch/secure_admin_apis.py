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
    
    if 'verifyAdmin' not in code:
        # Add import after NextResponse import
        code = code.replace("import { NextResponse } from 'next/server';", "import { NextResponse } from 'next/server';\n" + auth_import)
        
        # Add check at the start of GET or POST
        # For GET
        code = re.sub(r'(export async function GET\(request: Request\) {\n)', r'\1' + auth_check, code)
        # For POST
        code = re.sub(r'(export async function POST\(request: Request\) {\n)', r'\1' + auth_check, code)
        
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(code)

print('done')
