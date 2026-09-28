with open('src/lib/constants.ts', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    "{ code: 'go', name: 'Google', logo: 'https://img.icons8.com/color/96/google-logo.png' }",
    "{ code: 'go', name: 'Google / YouTube / Gmail', logo: 'https://img.icons8.com/color/96/google-logo.png' }"
)

with open('src/lib/constants.ts', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
