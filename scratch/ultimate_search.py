import os

search_terms = ['otp-three', 'localhost', 'vercel.app']
found_files = {}

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '.next' in root:
        continue
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.env.local', '.env.example', '.env')):
            file_path = os.path.join(root, file)
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    lines = f.readlines()
                    for i, line in enumerate(lines):
                        for term in search_terms:
                            if term in line:
                                if file_path not in found_files:
                                    found_files[file_path] = []
                                found_files[file_path].append((i+1, line.strip()))
                                break # avoid duplicate if multiple terms match
            except Exception:
                pass

with open('scratch/deep_dive_results.txt', 'w', encoding='utf-8') as out:
    for file, hits in found_files.items():
        out.write(f"\n--- {file} ---\n")
        for hit in hits:
            out.write(f"Line {hit[0]}: {hit[1]}\n")
print("Search complete. Check scratch/deep_dive_results.txt")
