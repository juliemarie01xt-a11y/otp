'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LucideCheckCircle, LucideXCircle, LucideClock, LucideSearch } from 'lucide-react';
import { getCountry, getService } from '@/lib/constants';

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data } = await supabase
        .from('activations')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setHistory(data);
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(h => 
    h.service?.toLowerCase().includes(search.toLowerCase()) || 
    h.phone_number?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Numbers & History</h1>
          <p className="text-zinc-500 mt-1">View all your purchased numbers and SMS verifications.</p>
        </div>
        <div className="relative">
          <LucideSearch className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search service or number..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 w-full sm:w-64 shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Service</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Country</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Number</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">OTP Code</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">Loading history...</td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">No transactions found.</td>
                </tr>
              ) : (
                filteredHistory.map((h) => {
                  const srv = getService(h.service);
                  const ctr = getCountry(h.country);
                  return (
                  <tr key={h.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={srv.logo} alt="" className="w-8 h-8 rounded object-contain p-1 border border-zinc-200 bg-zinc-50" />
                        <span className="font-semibold text-zinc-900 text-sm">{srv.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {ctr.flagUrl ? (
                          <img src={ctr.flagUrl} alt="" className="w-5 h-4 rounded-[2px] object-cover border border-zinc-200" />
                        ) : (
                          <span className="text-sm">{ctr.flag}</span>
                        )}
                        <span className="text-xs font-semibold px-2 py-1 bg-zinc-100 border border-zinc-200 rounded text-zinc-600 uppercase">
                          {ctr.short}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-sm text-zinc-900">{h.phone_number || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {h.code ? (
                        <span className="font-mono text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{h.code}</span>
                      ) : (
                        <span className="text-zinc-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm font-semibold text-zinc-700">
                      ${h.cost}
                    </td>
                    <td className="px-6 py-4">
                      {h.status === 'COMPLETED' && (
                        <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-full w-max border border-emerald-100">
                          <LucideCheckCircle className="w-3.5 h-3.5" /> Success
                        </div>
                      )}
                      {h.status === 'CANCELLED' && (
                        <div className="flex items-center gap-1.5 text-red-600 text-xs font-bold bg-red-50 px-2.5 py-1 rounded-full w-max border border-red-100">
                          <LucideXCircle className="w-3.5 h-3.5" /> Cancelled
                        </div>
                      )}
                      {h.status === 'PENDING' && (
                        <div className="flex items-center gap-1.5 text-orange-600 text-xs font-bold bg-orange-50 px-2.5 py-1 rounded-full w-max border border-orange-100">
                          <LucideClock className="w-3.5 h-3.5" /> Pending
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-zinc-500 whitespace-nowrap">
                      {new Date(h.created_at).toLocaleString()}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
