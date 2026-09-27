'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { LucidePhoneCall, LucideWallet, LucideActivity, LucideCheckCircle, LucideXCircle } from 'lucide-react';
import { getService } from '@/lib/constants';

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState({ total: 0, spent: 0, pending: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data } = await supabase
        .from('activations')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (data) {
        const total = data.length;
        const spent = data.filter(a => a.status === 'COMPLETED').reduce((acc, curr) => acc + curr.cost, 0);
        const pending = data.filter(a => a.status === 'PENDING').length;
        setStats({ total, spent, pending });
        setRecent(data.slice(0, 3));
      }
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Welcome back</h1>
        <p className="text-zinc-500 mt-1">Here is what is happening with your numbers today.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-zinc-200 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <LucidePhoneCall className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-500">Total Numbers</p>
            <p className="text-2xl font-bold text-zinc-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-zinc-200 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
            <LucideWallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-500">Total Spent</p>
            <p className="text-2xl font-bold text-zinc-900">${stats.spent}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-zinc-200 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
            <LucideActivity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-500">Active Sessions</p>
            <p className="text-2xl font-bold text-zinc-900">{stats.pending}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Actions */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 text-white">
            <h3 className="font-bold text-lg mb-2">Need a number?</h3>
            <p className="text-zinc-400 text-sm mb-6">Instantly provision a virtual or physical number for verification.</p>
            <Link href="/dashboard/buy" className="block w-full text-center py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors shadow-sm">
              Buy Number
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="font-bold text-zinc-900">Recent Transactions</h3>
            <Link href="/dashboard/history" className="text-sm font-semibold text-blue-600 hover:text-blue-700">View all</Link>
          </div>
          <div className="divide-y divide-zinc-100">
            {recent.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">No recent activity.</div>
            ) : (
              recent.map((r) => {
                const srv = getService(r.service);
                return (
                <div key={r.id} className="p-4 px-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={srv.logo} alt="" className="w-10 h-10 rounded-lg object-contain p-1.5 border border-zinc-100 bg-zinc-50" />
                    <div>
                      <p className="font-semibold text-sm text-zinc-900">{r.phone_number || 'Awaiting number...'}</p>
                      <p className="text-xs text-zinc-500">{new Date(r.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-zinc-700">${r.cost}</span>
                    {r.status === 'COMPLETED' && <LucideCheckCircle className="w-5 h-5 text-emerald-500" />}
                    {r.status === 'CANCELLED' && <LucideXCircle className="w-5 h-5 text-red-500" />}
                    {r.status === 'PENDING' && <LucideActivity className="w-5 h-5 text-orange-500" />}
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
}
