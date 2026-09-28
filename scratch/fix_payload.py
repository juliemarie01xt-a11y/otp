with open('src/app/dashboard/buy/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

old_payload = "const payload: any = { country, service, tier, maxPrice: price };"
new_payload = "const payload: any = { country, service, tier, maxPrice: price, rule_id };"

if old_payload in code:
    code = code.replace(old_payload, new_payload)
else:
    print("WARNING: payload string not found!")

with open('src/app/dashboard/buy/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
