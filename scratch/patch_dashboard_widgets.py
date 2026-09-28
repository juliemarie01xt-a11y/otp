with open('src/app/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# I will completely rewrite the return block of this component to include the new widgets.
import re

new_imports = """import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { LucidePhoneCall, LucideWallet, LucideActivity, LucideCheckCircle, LucideXCircle, LucideTrendingUp, LucideArrowRight } from 'lucide-react';
import { getService } from '@/lib/constants';"""

code = code.replace("""import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { LucidePhoneCall, LucideWallet, LucideActivity, LucideCheckCircle, LucideXCircle } from 'lucide-react';
import { getService } from '@/lib/constants';""", new_imports)

# Add balance to state
state_logic = """export default function DashboardOverviewPage() {
  const [stats, setStats] = useState({ total: 0, spent: 0, pending: 0, balance: 0 });"""
code = code.replace("export default function DashboardOverviewPage() {\n  const [stats, setStats] = useState({ total: 0, spent: 0, pending: 0 });", state_logic)

# Add balance fetch
fetch_logic = """      const { data } = await supabase
        .from('activations')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', session.user.id)
        .single();

      if (data) {
        const total = data.length;
        const spent = data.filter(a => a.status === 'COMPLETED').reduce((acc, curr) => acc + curr.cost, 0);
        const pending = data.filter(a => a.status === 'PENDING').length;
        setStats({ total, spent, pending, balance: profile ? Number(profile.balance) : 0 });"""
        
code = re.sub(r"      const \{ data \} = await supabase\n\s+\.from\('activations'\)\n\s+\.select\('\*'\)\n\s+\.eq\('user_id', session\.user\.id\)\n\s+\.order\('created_at', \{ ascending: false \}\);\n\n\s+if \(data\) \{\n\s+const total = data\.length;\n\s+const spent = data\.filter\(a => a\.status === 'COMPLETED'\)\.reduce\(\(acc, curr\) => acc \+ curr\.cost, 0\);\n\s+const pending = data\.filter\(a => a\.status === 'PENDING'\)\.length;\n\s+setStats\(\{ total, spent, pending \}\);", fetch_logic, code)


new_ui = """  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Welcome back</h1>
          <p className="text-zinc-500 mt-1 text-sm">Here is what is happening with your numbers today.</p>
        </div>
        <Link href="/dashboard/buy" className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm">
          Buy a Number <LucideArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* IDEA 3: Trending Services */}
      <div>
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <LucideTrendingUp className="w-4 h-4 text-orange-500" /> Trending Services Today
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { id: 'wa', name: 'WhatsApp', price: '0.20', img: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg' },
            { id: 'gv', name: 'Google Voice', price: '0.15', img: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Google_Voice_icon_%282020%29.svg' },
            { id: 'tg', name: 'Telegram', price: '0.18', img: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg' },
            { id: 'go', name: 'Google / Gmail', price: '0.12', img: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg' },
          ].map(s => (
            <Link key={s.id} href={`/dashboard/buy`} className="bg-white p-4 rounded-xl border border-zinc-200 hover:border-blue-500 hover:shadow-md transition-all group flex items-center gap-3 relative overflow-hidden">
              <img src={s.img} className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" alt={s.name} />
              <div>
                <p className="font-bold text-zinc-900 text-sm whitespace-nowrap">{s.name}</p>
                <p className="text-xs text-zinc-500">from ${s.price}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-zinc-200 flex items-center gap-4 shadow-sm hover:border-zinc-300 transition-colors">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border border-blue-100">
            <LucidePhoneCall className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total Numbers</p>
            <p className="text-2xl font-bold text-zinc-900 leading-tight">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-zinc-200 flex items-center gap-4 shadow-sm hover:border-zinc-300 transition-colors">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
            <LucideWallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total Spent</p>
            <p className="text-2xl font-bold text-zinc-900 leading-tight">${stats.spent.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-zinc-200 flex items-center gap-4 shadow-sm hover:border-zinc-300 transition-colors">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center border border-orange-100">
            <LucideActivity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Active Sessions</p>
            <p className="text-2xl font-bold text-zinc-900 leading-tight">{stats.pending}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* IDEA 1: Wallet & Quick Top-Up */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 p-7 rounded-2xl border border-zinc-800 text-white shadow-xl relative overflow-hidden h-full flex flex-col justify-between">
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-blue-500 rounded-full blur-[80px] opacity-30 pointer-events-none"></div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-zinc-400 text-sm">Available Balance</h3>
                <div className="p-1.5 bg-zinc-800 rounded-md border border-zinc-700">
                  <LucideWallet className="w-4 h-4 text-zinc-300" />
                </div>
              </div>
              <p className="text-5xl font-bold tracking-tight mb-2">${stats.balance.toFixed(2)}</p>
              <p className="text-xs text-zinc-500 mb-8">Ready to spend on numbers</p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Link href="/dashboard/recharge" className="py-2.5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 text-center rounded-lg text-sm font-semibold transition-all">$10</Link>
                <Link href="/dashboard/recharge" className="py-2.5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 text-center rounded-lg text-sm font-semibold transition-all">$25</Link>
                <Link href="/dashboard/recharge" className="py-2.5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 text-center rounded-lg text-sm font-semibold transition-all">$50</Link>
              </div>
              <Link href="/dashboard/recharge" className="block w-full text-center py-3 bg-white text-zinc-900 font-bold rounded-lg hover:bg-zinc-100 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]">
                Add Crypto Funds
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <h3 className="font-bold text-zinc-900">Recent Transactions</h3>
            <Link href="/dashboard/history" className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full transition-colors">View all</Link>
          </div>
          <div className="divide-y divide-zinc-100 flex-1">
            {recent.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-zinc-500 text-sm">
                <LucideActivity className="w-8 h-8 text-zinc-300 mb-3" />
                <p>No recent activity.</p>
                <Link href="/dashboard/buy" className="text-blue-600 font-semibold mt-1">Buy your first number</Link>
              </div>
            ) : (
              recent.map((r) => {
                const srv = getService(r.service);
                return (
                <div key={r.id} className="p-4 px-6 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-zinc-100 shadow-sm flex items-center justify-center p-2">
                      <img src={srv.logo} alt="" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-zinc-900">{r.phone_number || 'Awaiting number...'}</p>
                      <p className="text-xs text-zinc-500 font-medium">{new Date(r.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-mono text-sm font-bold text-zinc-900">${r.cost}</span>
                      <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">{srv.name}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${
                      r.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                      r.status === 'CANCELLED' ? 'bg-red-50 text-red-600' :
                      'bg-orange-50 text-orange-600'
                    }`}>
                      {r.status === 'COMPLETED' && <LucideCheckCircle className="w-4 h-4" />}
                      {r.status === 'CANCELLED' && <LucideXCircle className="w-4 h-4" />}
                      {r.status === 'PENDING' && <LucideActivity className="w-4 h-4 animate-pulse" />}
                    </div>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}"""

code = re.sub(r"  return \([\s\S]*\);\n}", new_ui, code)

with open('src/app/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
