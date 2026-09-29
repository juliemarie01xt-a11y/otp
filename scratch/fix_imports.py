import os

file_path = "src/app/dashboard/telegram/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace("import { LucideAlertTriangle, LucideTerminal, supabase } from '@/lib/supabase';", "import { supabase } from '@/lib/supabase';")
code = code.replace("LucideAlertTriangle, LucideTerminal, LucideSmartphone", "LucideSmartphone")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Fixed duplicate imports!")
