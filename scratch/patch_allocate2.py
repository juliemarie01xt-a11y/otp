with open('src/app/api/vsim/allocate/route.ts', 'r', encoding='utf-8') as f:
    code = f.read()

import re

old_error = "return NextResponse.json({ success: false, error: 'This route is currently out of stock or having issues. Please try selecting one of our other available routes above!' }, { status: 400 });"

new_error = """    let finalError = lastError;
    if (!finalError.includes('balance') && !finalError.includes('Price changed')) {
       finalError = 'This route is currently out of stock or having issues. Please try selecting one of our other available routes above!';
    }
    return NextResponse.json({ success: false, error: finalError }, { status: 400 });"""

code = code.replace(old_error, new_error)

with open('src/app/api/vsim/allocate/route.ts', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
