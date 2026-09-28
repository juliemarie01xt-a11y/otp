import os
import requests
import json

with open('.env.local', 'r') as f:
    for line in f:
        if line.startswith('VSIM_API_KEY='):
            vsim_key = line.split('=')[1].strip()
            break

url = f"https://api.vsimpro.com/stubs/handler_api.php?api_key={vsim_key}&action=getPrices&country=12&service=lvbv"
res = requests.get(url)
print("With service:", res.text)

url2 = f"https://api.vsimpro.com/stubs/handler_api.php?api_key={vsim_key}&action=getPrices&country=12"
res2 = requests.get(url2)
data = res2.json()
print("Without service, checking lvbv:", json.dumps(data.get('12', {}).get('lvbv', {}), indent=2))
