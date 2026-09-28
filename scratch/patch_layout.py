with open('src/app/dashboard/layout.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

import re

# Add LucideMenu to imports
code = code.replace("import { LucideWallet, LucidePlus } from 'lucide-react';", "import { LucideWallet, LucidePlus, LucideMenu } from 'lucide-react';")

# Add state
code = code.replace("const [wallet, setWallet] = useState<{ balance: number } | null>(null);", "const [wallet, setWallet] = useState<{ balance: number } | null>(null);\n  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);")

# Update layout wrapper and header
old_jsx = """  return (
    <div className="min-h-screen bg-zinc-50 font-[family-name:var(--font-geist-sans)] flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-end px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">"""

new_jsx = """  return (
    <div className="min-h-screen bg-zinc-50 font-[family-name:var(--font-geist-sans)] flex">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between md:justify-end px-4 md:px-8 sticky top-0 z-30">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-lg"
          >
            <LucideMenu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">"""

code = code.replace(old_jsx, new_jsx)

# Adjust main content padding for mobile
code = code.replace(
    """<main className="p-8 max-w-5xl mx-auto w-full flex-1">""",
    """<main className="p-4 md:p-8 max-w-5xl mx-auto w-full flex-1">"""
)

with open('src/app/dashboard/layout.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
