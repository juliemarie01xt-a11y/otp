with open('src/app/dashboard/buy/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

import re

# We need to filter out 'gmail' from the buy page list.
code = code.replace(
    "{POPULAR_SERVICES.filter(s => availableRoutes.some(r => r.internal_service === s.code)).map(s => (",
    "{POPULAR_SERVICES.filter(s => s.code !== 'gmail' && availableRoutes.some(r => r.internal_service === s.code)).map(s => ("
)

with open('src/app/dashboard/buy/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
