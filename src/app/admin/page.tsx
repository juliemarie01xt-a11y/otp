'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { LucidePhone, LucideGlobe, LucideSearch, LucideShield, LucideServer, LucideDollarSign, LucideActivity, LucideLoader2, LucideCheckCircle, LucideX } from 'lucide-react';

import { POPULAR_COUNTRIES, POPULAR_SERVICES } from '@/lib/constants';

export default function AdminPage() {
  const [country, setCountry] = useState(POPULAR_COUNTRIES[0].id);
  const [service, setService] = useState(POPULAR_SERVICES[0].code);
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [activeRules, setActiveRules] = useState<any[]>([]);

  const fetchActiveRules = async () => {
    try {
      const res = await axios.get('/api/admin/set-route');
      
      setActiveRules(res.data.rules?.filter((r: any) => r.country_id === country && r.internal_service === service) || []);
    } catch(err) {
      console.error(err);
    }
  };

  const deleteRoute = async (id: string) => {
    if (!confirm('Are you sure you want to remove this route?')) return;
    try {
      await axios.post('/api/admin/delete-route', {
        id: id
      });
      fetchActiveRules();
    } catch(err: any) {
      alert('Error deleting route: ' + (err.response?.data?.error || err.message));
    }
  };

  useEffect(() => {
    fetchActiveRules();
  }, [country, service]);

  const [searchTerm, setSearchTerm] = useState('');
  const [hideEmpty, setHideEmpty] = useState(true);
  const [apiFilter, setApiFilter] = useState('all');

  const fetchAllPrices = async () => {
    setLoading(true);
    setError('');
    setOptions([]);
    try {
      const res = await axios.get('/api/admin/scan', {
        params: { country, service }
      });
      setOptions(res.data.options || []);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const setRoute = async (opt: any, tier: string) => {
    try {
      await axios.post('/api/admin/set-route', {
        country_id: country,
        internal_service: service,
        target_api: opt.api,
        target_service_code: opt.code,
        target_operator: opt.operator,
        target_provider: opt.provider,
        tier
      });
      alert(`Active ${tier} Route Updated!`);
      fetchActiveRules();
    } catch(err: any) {
      alert('Error updating route: ' + (err.response?.data?.error || err.message));
    }
  };

  // Filter and sort the options
  const filteredOptions = options.filter(opt => {
    if (hideEmpty && opt.count === 0) return false;
    if (apiFilter !== 'all' && opt.api !== apiFilter) return false;
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        opt.api.toLowerCase().includes(search) ||
        (opt.operator && opt.operator.toString().toLowerCase().includes(search)) ||
        (opt.provider && opt.provider.toString().toLowerCase().includes(search)) ||
        opt.price.toString().includes(search)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <header className="flex items-center justify-between border-b border-slate-700 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-lg">
              <LucideShield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Aggregator Admin</h1>
              <p className="text-slate-400 text-sm">Cross-API Routing Control Panel</p>
            </div>
          </div>
          <a href="/" className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2">
            Back to App
          </a>
        </header>

        {/* Control Panel */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Target Country</label>
              <select 
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
              >
                {POPULAR_COUNTRIES.map(c => (
                  <option key={c.id} value={c.id}>{c.flag} {c.name} ({c.id})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Target Service</label>
              <select 
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 font-bold"
              >
                {POPULAR_SERVICES.map(s => (
                  <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-col md:flex-row items-center gap-4">
            <button 
              onClick={fetchAllPrices}
              disabled={loading}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2 shadow"
            >
              {loading ? <LucideLoader2 className="w-5 h-5 animate-spin" /> : <LucideSearch className="w-5 h-5" />}
              Scan Market
            </button>
            
            {activeRules.map((rule, idx) => (
               <div key={idx} className={`flex-1 border rounded-lg p-3 flex items-center justify-between gap-3 ${rule.tier === 'premium' ? 'border-amber-500/50 bg-amber-900/20 text-amber-100' : 'border-slate-500/50 bg-slate-800 text-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <LucideCheckCircle className={`w-6 h-6 ${rule.tier === 'premium' ? 'text-amber-400' : 'text-slate-400'}`} />
                    <div>
                      <div className={`text-xs uppercase font-bold ${rule.tier === 'premium' ? 'text-amber-400/80' : 'text-slate-400/80'}`}>Active {rule.tier} Route</div>
                      <div className="text-sm font-mono">
                          {rule.target_api.toUpperCase()} | Code: {rule.target_service_code} | Op: {rule.target_operator || 'N/A'} | Pr: {rule.target_provider || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteRoute(rule.id)}
                    className="p-1.5 rounded bg-black/20 hover:bg-red-500/50 hover:text-white transition-colors"
                    title="Remove route"
                  >
                    <LucideX className="w-4 h-4" />
                  </button>
               </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-900/50 border border-red-700 text-red-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Results Table */}
        {options.length > 0 && !loading && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden mt-6">
            
            {/* Filters Bar */}
            <div className="p-4 border-b border-slate-700 bg-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                 <select 
                   value={apiFilter}
                   onChange={(e) => setApiFilter(e.target.value)}
                   className="bg-slate-900 border border-slate-700 text-slate-300 rounded px-3 py-2 text-sm focus:outline-none"
                 >
                   <option value="all">All APIs</option>
                   <option value="vsim">VSIM Only</option>
                   <option value="smsbower">SMSBower Only</option>
                 </select>

                 <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                   <input 
                     type="checkbox" 
                     checked={hideEmpty}
                     onChange={(e) => setHideEmpty(e.target.checked)}
                     className="rounded border-slate-600 bg-slate-900"
                   />
                   Hide 0 Stock
                 </label>
               </div>

               <div className="relative">
                 <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                 <input 
                   type="text"
                   placeholder="Search operator, provider..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 w-full md:w-64"
                 />
               </div>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-sm relative">
                <thead className="bg-slate-900/90 text-slate-400 sticky top-0 backdrop-blur-sm z-10">
                  <tr>
                    <th className="px-6 py-4 font-medium">Website API</th>
                    <th className="px-6 py-4 font-medium">Internal Code</th>
                    <th className="px-6 py-4 font-medium">Cost</th>
                    <th className="px-6 py-4 font-medium">Operator ID</th>
                    <th className="px-6 py-4 font-medium">Provider ID</th>
                    <th className="px-6 py-4 font-medium text-right">Stock</th>
                    <th className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredOptions.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-slate-500">No matching providers found.</td></tr>
                  ) : filteredOptions.map((opt, i) => {
                    const activePremium = activeRules.find(r => r.tier === 'premium' && r.target_api === opt.api && r.target_service_code === opt.code && r.target_operator == opt.operator && r.target_provider == opt.provider);
                    const activeStandard = activeRules.find(r => r.tier === 'standard' && r.target_api === opt.api && r.target_service_code === opt.code && r.target_operator == opt.operator && r.target_provider == opt.provider);
                    const isActive = activePremium || activeStandard;
                    return (
                    <tr key={i} className={`hover:bg-slate-750 transition-colors ${isActive ? 'bg-slate-700/50' : 'bg-slate-800'}`}>
                      <td className="px-6 py-4 font-bold uppercase tracking-wider">
                         <span className={`px-2 py-1 rounded text-xs ${opt.api === 'vsim' ? 'bg-purple-900/50 text-purple-300 border border-purple-700' : 'bg-orange-900/50 text-orange-300 border border-orange-700'}`}>
                           {opt.api}
                         </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">{opt.code}</td>
                      <td className="px-6 py-4 font-mono font-bold text-green-400">
                        ${opt.price}
                      </td>
                      <td className="px-6 py-4">
                         {opt.operator ? <span className="font-mono text-slate-300">{opt.operator}</span> : <span className="text-slate-500 italic">None</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                         {opt.provider ? <span className="font-mono text-slate-300">{opt.provider}</span> : <span className="text-slate-500 italic">None</span>}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {opt.count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex flex-col gap-1 items-end">
                           {activePremium ? (
                             <span className="text-xs font-bold text-amber-500 uppercase">Premium</span>
                           ) : (
                             <button onClick={() => setRoute(opt, 'premium')} className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium">Set Premium</button>
                           )}
                           {activeStandard ? (
                             <span className="text-xs font-bold text-slate-400 uppercase">Standard</span>
                           ) : (
                             <button onClick={() => setRoute(opt, 'standard')} className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs font-medium">Set Standard</button>
                           )}
                         </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
