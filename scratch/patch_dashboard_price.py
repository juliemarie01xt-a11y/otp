with open('src/app/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("name: 'Google Voice', price: '0.15'", "name: 'Google Voice', price: '0.20'")

with open('src/app/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("done")
