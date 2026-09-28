with open('src/app/dashboard/buy/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("key={opt.tier}", "key={opt.rule_id}")

with open('src/app/dashboard/buy/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
