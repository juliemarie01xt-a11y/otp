with open('src/app/api/admin/scan/route.ts', 'r', encoding='utf-8') as f:
    code = f.read()

old_map = """const SERVICE_MAP: Record<string, { vsim: string, smsbower: string }> = {
    'gv': { vsim: 'lvbv', smsbower: 'gf' },
    'go': { vsim: 'api', smsbower: 'go' }
};"""

new_map = """const SERVICE_MAP: Record<string, { vsim: string, smsbower: string }> = {
    'gv': { vsim: 'lvbv', smsbower: 'gf' },
    'go': { vsim: 'api', smsbower: 'go' },
    'wa': { vsim: 'wa', smsbower: 'wa' },
    'tg': { vsim: 'tg', smsbower: 'tg' },
    'ig': { vsim: 'ig', smsbower: 'ig' },
    'fb': { vsim: 'fb', smsbower: 'fb' }
};"""

code = code.replace(old_map, new_map)

with open('src/app/api/admin/scan/route.ts', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
