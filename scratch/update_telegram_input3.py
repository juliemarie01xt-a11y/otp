import os
import re

file_path = "src/app/dashboard/telegram/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace("onChange={(e) => setTelegramId(e.target.value)}", "onChange={(e) => setTelegramId(e.target.value.replace(/\\D/g, ''))}\n                        maxLength={12}")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Injected maxLength and replace constraint!")
