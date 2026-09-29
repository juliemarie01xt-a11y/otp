import os

files = [
    "src/app/api/cron/check-sms/route.ts",
    "src/app/api/cron/sync-prices/route.ts",
    "src/app/api/cron/cleanup/route.ts"
]

for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "export const maxDuration" not in content:
        content = "export const maxDuration = 60;\n\n" + content
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)

print("Injected maxDuration into cron jobs!")
