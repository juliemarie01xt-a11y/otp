import re

with open('src/app/dashboard/buy/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

helper = '''  const apiPost = async (url: string, data: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    return axios.post(url, data, {
      headers: { Authorization: Bearer  }
    });
  };
'''

if 'apiPost' not in code:
    code = code.replace('const [error, setError] = useState(\'\');', 'const [error, setError] = useState(\'\');\n\n' + helper)

code = re.sub(
    r"axios\.post\('/api/vsim/cancel', \{ id: activation\.activationId \|\| activation\.id, userId: user\.id \}\)",
    r"apiPost('/api/vsim/cancel', { id: activation.activationId || activation.id })",
    code
)

code = re.sub(
    r"const res = await axios\.post\('/api/vsim/cancel', \{ id: activation\.activationId \|\| activation\.id, userId: user\.id \}\);",
    r"const res = await apiPost('/api/vsim/cancel', { id: activation.activationId || activation.id });",
    code
)

code = code.replace(
    "const payload: any = { country, service, userId: user.id, tier };\n      payload.maxPrice = price;\n      const res = await axios.post('/api/vsim/allocate', payload);",
    "const payload: any = { country, service, tier, maxPrice: price };\n      const res = await apiPost('/api/vsim/allocate', payload);"
)

with open('src/app/dashboard/buy/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
