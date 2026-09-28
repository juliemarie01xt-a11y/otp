import re

with open('src/app/dashboard/recharge/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

lines = code.split('\n')
for i, line in enumerate(lines):
    if 'Authorization:' in line:
        lines[i] = "        headers: { Authorization: `Bearer ${session?.access_token}` }"

with open('src/app/dashboard/recharge/page.tsx', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
print('done')
