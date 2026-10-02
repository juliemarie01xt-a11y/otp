'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { LucidePhoneCall, LucideWallet, LucideActivity, LucideCheckCircle, LucideXCircle, LucideTrendingUp, LucideArrowRight } from 'lucide-react';
import { getService } from '@/lib/constants';

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState({ total: 0, spent: 0, pending: 0, balance: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [trendingPrices, setTrendingPrices] = useState<Record<string, string>>({ wa: '0.20', gv: '0.20', tg: '0.18', go: '0.12' });

  useEffect(() => {
    const loadStats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data } = await supabase
        .from('activations')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', session.user.id)
        .single();

      try {
        const pricesRes = await fetch('/api/routes/available').then(r => r.json());
        if (pricesRes.routes) {
          const newPrices = { ...trendingPrices };
          const services = ['wa', 'gv', 'tg', 'go'];
          for (const s of services) {
            const routes = pricesRes.routes.filter((r: any) => r.internal_service === s);
            if (routes.length > 0) {
              let minWholesale = Infinity;
              for (const r of routes) {
                let cost = r.cached_wholesale_cost;
                if (r.country_id === '12' && s === 'gv' && cost < 0.188) cost = 0.188;
                if (cost < minWholesale) minWholesale = cost;
              }
              const finalPrice = (minWholesale + 0.012).toFixed(2);
              newPrices[s] = finalPrice;
            }
          }
          setTrendingPrices(newPrices);
        }
      } catch (e) {
        console.error('Failed to fetch trending prices', e);
      }

      if (data) {
        const total = data.length;
        const spent = data.filter(a => a.status === 'COMPLETED').reduce((acc, curr) => acc + curr.cost, 0);
        const pending = data.filter(a => a.status === 'PENDING').length;
        setStats({ total, spent, pending, balance: profile ? Number(profile.balance) : 0 });
        setRecent(data.slice(0, 3));
      }
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Overview</h1>
          <p className="text-zinc-400">Welcome back! Here's what's happening with your account.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link href="/dashboard/buy" className="flex-1 sm:flex-none">
            <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              <LucidePhoneCall className="w-4 h-4" />
              Buy a Number
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Wallet Stat */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <LucideWallet className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Current Balance</p>
              <h3 className="text-2xl font-bold text-white">${stats.balance.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        {/* Total Activations */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <LucideActivity className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Total Activations</p>
              <h3 className="text-2xl font-bold text-white">{stats.total}</h3>
            </div>
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-lg">
              <LucideCheckCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Total Spent</p>
              <h3 className="text-2xl font-bold text-white">${stats.spent.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        {/* Pending Actions */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <LucideTrendingUp className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Pending Actions</p>
              <h3 className="text-2xl font-bold text-white">{stats.pending}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - Recent Transactions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
            <Link href="/dashboard/history" className="text-sm text-blue-500 hover:text-blue-400 flex items-center gap-1">
              View all <LucideArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            {recent.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-800 mb-4">
                  <LucideActivity className="w-6 h-6 text-zinc-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-1">No transactions yet</h3>
                <p className="text-zinc-400 text-sm max-w-sm mx-auto mb-4">You haven't purchased any numbers yet. Buy your first number to see it here.</p>
                <Link href="/dashboard/buy">
                  <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Buy a Number
                  </button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50">
                      <th className="py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Service</th>
                      <th className="py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Number</th>
                      <th className="py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                      <th className="py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Cost</th>
                      <th className="py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {recent.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-800/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-white font-medium">
                          {getService(item.service)?.name || item.service}
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-300 font-mono">
                          +{item.phone_number}
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-400">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-300">
                          ${item.cost.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium
                            ${item.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 
                              item.status === 'PENDING' ? 'bg-orange-500/10 text-orange-500' : 
                              'bg-red-500/10 text-red-500'}`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Trending Services */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Trending Services</h2>
          </div>
          
          <div className="space-y-3">
            {[
              { id: 'wa', name: 'WhatsApp', price: trendingPrices.wa },
              { id: 'gv', name: 'Google Voice', price: trendingPrices.gv },
              { id: 'tg', name: 'Telegram', price: trendingPrices.tg },
              { id: 'go', name: 'Google/YouTube', price: trendingPrices.go }
            ].map(service => (
              <Link href={`/dashboard/buy?service=${service.id}`} key={service.id}>
                <div className="bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 flex items-center justify-between transition-colors group cursor-pointer mt-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                      <img src={getService(service.id).logo} alt={service.name} className="w-8 h-8 object-contain" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{service.name}</h4>
                      <p className="text-sm text-zinc-400">From ${service.price}</p>
                    </div>
                  </div>
                  <LucideArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-blue-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
