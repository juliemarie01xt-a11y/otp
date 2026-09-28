with open('src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

import re

# 1. Add authentication states and logic
auth_logic = """
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('adminEmail');
    const savedPassword = localStorage.getItem('adminPassword');
    if (savedEmail && savedPassword) {
      setAdminEmail(savedEmail);
      setAdminPassword(savedPassword);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('adminEmail', adminEmail);
    localStorage.setItem('adminPassword', adminPassword);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminPassword');
    setIsAuthenticated(false);
    setAdminEmail('');
    setAdminPassword('');
  };

  const getHeaders = () => ({
    headers: {
      'x-admin-email': adminEmail,
      'x-admin-password': adminPassword
    }
  });

  if (!isAuthenticated) {
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
  }
"""

code = code.replace("  const availableCountries", auth_logic + "\n  const availableCountries")

# 2. Add logout button to header
header_code = """          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white tracking-tight">Routing Rules</h1>
            <button onClick={handleLogout} className="text-xs text-zinc-400 hover:text-white underline">Logout</button>
          </div>"""
code = code.replace('<h1 className="text-2xl font-bold text-white tracking-tight">Routing Rules</h1>', header_code)

# 3. Patch axios calls
code = code.replace("axios.get('/api/admin/set-route')", "axios.get('/api/admin/set-route', getHeaders())")
code = code.replace("axios.get('/api/admin/scan', { params: { country, service } })", "axios.get('/api/admin/scan', { params: { country, service }, ...getHeaders() })")

code = re.sub(
    r"await axios\.post\('/api/admin/bulk-set-routes', \{\n\s+country_id: country,\n\s+internal_service: service,\n\s+rules: stagedRules\n\s+\}\);",
    r"await axios.post('/api/admin/bulk-set-routes', {\n        country_id: country,\n        internal_service: service,\n        rules: stagedRules\n      }, getHeaders());",
    code
)

with open('src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
