import os
import re

files_to_update = [
    "src/app/api/admin/bulk-set-routes/route.ts",
    "src/app/api/bot/command/route.ts",
    "src/app/api/cron/check-sms/route.ts",
    "src/app/api/deposit/route.ts"
]

for file_path in files_to_update:
    if not os.path.exists(file_path):
        continue
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        code = f.read()

    # Replace old Vercel URL
    code = code.replace("otp-three-liard.vercel.app", "swiftotp.store")
    
    # Replace localhost:3000 fallback in host headers
    code = code.replace("'localhost:3000'", "'swiftotp.store'")
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(code)

print("Codebase upgraded to swiftotp.store!")
