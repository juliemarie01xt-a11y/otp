import os
import glob

search_terms = ['otp-three-liard', 'localhost', 'NEXT_PUBLIC_SITE_URL']
found_files = {}

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '.next' in root:
        continue
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.env.local', '.env.example', '.env')):
            file_path = os.path.join(root, file)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    for i, line in enumerate(lines):
                        for term in search_terms:
                            if term in line:
                                if file_path not in found_files:
                                    found_files[file_path] = []
                                found_files[file_path].append((i+1, line.strip()))
            except Exception:
                pass

for file, hits in found_files.items():
    print(f"\n--- {file} ---")
    for hit in hits:
        print(f"Line {hit[0]}: {hit[1]}")
