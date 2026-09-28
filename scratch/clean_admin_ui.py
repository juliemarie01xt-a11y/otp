with open('src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

import re

# Remove states
code = re.sub(r"  const \[adminEmail, setAdminEmail\] = useState\(''\);\n  const \[adminPassword, setAdminPassword\] = useState\(''\);\n  const \[isAuthenticated, setIsAuthenticated\] = useState\(false\);\n", "", code)

# Remove useEffect for auth
code = re.sub(r"  useEffect\(\(\) => \{\n    const savedEmail = localStorage\.getItem\('adminEmail'\);\n    const savedPassword = localStorage\.getItem\('adminPassword'\);\n    if \(savedEmail && savedPassword\) \{\n      setAdminEmail\(savedEmail\);\n      setAdminPassword\(savedPassword\);\n      setIsAuthenticated\(true\);\n    \}\n  \}, \[\]\);\n", "", code)

# Remove handleLogin
code = re.sub(r"  const handleLogin = \(e: React\.FormEvent\) => \{\n    e\.preventDefault\(\);\n    localStorage\.setItem\('adminEmail', adminEmail\);\n    localStorage\.setItem\('adminPassword', adminPassword\);\n    setIsAuthenticated\(true\);\n  \};\n", "", code)

# Remove handleLogout
code = re.sub(r"  const handleLogout = \(\) => \{\n    localStorage\.removeItem\('adminEmail'\);\n    localStorage\.removeItem\('adminPassword'\);\n    setIsAuthenticated\(false\);\n    setAdminEmail\(''\);\n    setAdminPassword\(''\);\n  \};\n", "", code)

# Remove getHeaders
code = re.sub(r"  const getHeaders = \(\) => \(\{\n    headers: \{\n      'x-admin-email': adminEmail,\n      'x-admin-password': adminPassword\n    \}\n  \}\);\n", "", code)

# Remove Logout button
code = code.replace('<button onClick={handleLogout} className="text-xs text-zinc-400 hover:text-white underline">Logout</button>', '')

# Replace API calls with just axios without headers
code = code.replace("axios.get('/api/admin/set-route', getHeaders())", "axios.get('/api/admin/set-route')")
code = code.replace("axios.get('/api/admin/scan', { params: { country, service }, ...getHeaders() })", "axios.get('/api/admin/scan', { params: { country, service } })")
code = code.replace("}, getHeaders());", "});")

# Remove the auth block
auth_block = """  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 font-[family-name:var(--font-geist-sans)]">
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700">
              <LucideShield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Login</h1>
              <p className="text-xs text-zinc-400">Restricted Access</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Admin Email</label>
              <input type="email" required value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-zinc-700" placeholder="admin@example.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Password</label>
              <input type="password" required value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-zinc-700" placeholder="Password" />
            </div>
            <button type="submit" className="w-full bg-white text-zinc-900 font-semibold text-sm py-2.5 rounded-lg mt-2 hover:bg-zinc-200 transition-colors">Login to Dashboard</button>
          </form>
        </div>
      </div>
    );
  }"""
code = code.replace(auth_block, "")

with open('src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
