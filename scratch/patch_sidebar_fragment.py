with open('src/app/dashboard/Sidebar.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    "return (\n    {/* Mobile Backdrop */}",
    "return (\n    <>\n    {/* Mobile Backdrop */}"
)

code = code.replace(
    "</div>\n  );\n}",
    "</div>\n    </>\n  );\n}"
)

with open('src/app/dashboard/Sidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
