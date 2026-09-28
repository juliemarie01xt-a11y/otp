with open('src/app/dashboard/Sidebar.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

import re

# Update props
code = code.replace("export default function Sidebar() {", "export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) {")

# Update classNames
old_wrapper = """<div className="w-64 bg-zinc-900 text-zinc-300 h-screen fixed top-0 left-0 flex flex-col border-r border-zinc-800">"""
new_wrapper = """{/* Mobile Backdrop */}
    {isOpen && (
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden" 
        onClick={onClose}
      />
    )}

    <div className={`w-64 bg-zinc-900 text-zinc-300 h-screen fixed top-0 left-0 flex flex-col border-r border-zinc-800 z-50 transition-transform duration-200 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>"""

code = code.replace(old_wrapper, new_wrapper)

# Update onClick in mobile links to close the sidebar
code = code.replace(
    "className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${",
    "onClick={() => onClose && onClose()}\n              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${"
)

with open('src/app/dashboard/Sidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
