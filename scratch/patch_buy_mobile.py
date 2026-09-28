with open('src/app/dashboard/buy/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Update grid for popular services
code = code.replace(
    '<div className="grid grid-cols-2 gap-3">',
    '<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">'
)

# Update layout for availability options
code = code.replace(
    'className={"rounded-xl p-4 flex items-center justify-between gap-4 border transition-colors',
    'className={"rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border transition-colors'
)

# Update the button to take full width on mobile
code = code.replace(
    'className={"shrink-0 px-4 py-2.5 rounded-lg font-bold text-sm transition-all',
    'className={"w-full sm:w-auto shrink-0 px-4 py-2.5 rounded-lg font-bold text-sm transition-all'
)

with open('src/app/dashboard/buy/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
