with open('src/app/admin/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

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

final_return = '  return (\n    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-32">'
if final_return in code:
    code = code.replace(final_return, auth_block + "\n\n" + final_return)
else:
    print("Could not find final return!")

with open('src/app/admin/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
