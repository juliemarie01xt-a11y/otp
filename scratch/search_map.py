with open('src/app/dashboard/buy/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if "POPULAR_SERVICES.map" in line or "availableCountries.map" in line:
        print(f"Line {i+1}: {line.strip()}")
