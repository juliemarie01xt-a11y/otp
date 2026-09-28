with open('src/app/api/vsim/status/route.ts', 'r', encoding='utf-8') as f:
    code = f.read()

if "export const runtime = 'edge';" not in code:
    code = "export const runtime = 'edge';\n" + code

code = code.replace("import axios from 'axios';\n", "")

old_axios = """    const response = await axios.get(TARGET_API_URL, {
      params: {
        api_key: TARGET_API_KEY,
        action: 'getStatus',
        id: realId,
      }
    });

    const data = response.data;"""
    
new_fetch = """    const url = new URL(TARGET_API_URL);
    url.searchParams.append('api_key', TARGET_API_KEY);
    url.searchParams.append('action', 'getStatus');
    url.searchParams.append('id', realId);

    const response = await fetch(url.toString());
    const data = await response.text();"""
    
code = code.replace(old_axios, new_fetch)

with open('src/app/api/vsim/status/route.ts', 'w', encoding='utf-8') as f:
    f.write(code)
print("done edge")
