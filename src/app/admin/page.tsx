"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { LucidePhone, LucideGlobe, LucideSearch, LucideShield, LucideServer, LucideDollarSign, LucideActivity, LucideLoader2, LucideCheckCircle, LucideX, LucideSave, LucideAlertTriangle } from 'lucide-react';

import { POPULAR_COUNTRIES, POPULAR_SERVICES } from '@/lib/constants';

export default function AdminPage() {
  const [country, setCountry] = useState(POPULAR_COUNTRIES[0].id);
  const [service, setService] = useState(POPULAR_SERVICES[0].code);
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [activeRules, setActiveRules] = useState<any[]>([]);
  const [stagedRules, setStagedRules] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [apiFilter, setApiFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [hideEmpty, setHideEmpty] = useState(false);









  const availableCountries = service === 'gv' ? POPULAR_COUNTRIES.filter(c => ['12', '187', '36'].includes(c.id)) : POPULAR_COUNTRIES;

  // Unsaved changes detection
  const stripRule = (r: any) => ({
    target_api: r.target_api,
    target_service_code: r.target_service_code,
    target_operator: r.target_operator || null,
    target_provider: r.target_provider || null,
    tier: r.tier
  });

  const getCompareString = (rules: any[]) => JSON.stringify(
    rules.map(stripRule).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
  );

  const hasUnsavedChanges = getCompareString(activeRules) !== getCompareString(stagedRules);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to switch?')) return;
    }
    fetchActiveRules();
  }, [country, service]);

  const fetchActiveRules = async () => {
    try {
      const res = await axios.get('/api/admin/set-route');
      const filtered = res.data.rules?.filter((r: any) => r.country_id === country && r.internal_service === service) || [];
      setActiveRules(filtered);
      setStagedRules(JSON.parse(JSON.stringify(filtered)));
    } catch(err) {
      console.error(err);
    }
  };

  const scanMarket = async () => {
    setLoading(true);
    setError('');
    setOptions([]);
    try {
      const res = await axios.get('/api/admin/scan', { params: { country, service } });
      setOptions(res.data.options || []);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteRouteLocal = (api: string, code: string, operator: any, provider: any, tier: string) => {
    setStagedRules(prev => prev.filter(r => !(
      r.target_api === api && 
      r.target_service_code === code && 
      r.target_operator == operator && 
      r.target_provider == provider && 
      r.tier === tier
    )));
  };

  const addRouteLocal = (opt: any, tier: string) => {
    const newRule = {
      country_id: country,
      internal_service: service,
      target_api: opt.api,
      target_service_code: opt.code,
      target_operator: opt.operator || null,
      target_provider: opt.provider || null,
      tier
    };
    setStagedRules(prev => [...prev, newRule]);
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      await axios.post('/api/admin/bulk-set-routes', {
        country_id: country,
        internal_service: service,
        rules: stagedRules
      });
      alert('Changes saved successfully! Prices are syncing in the background.');
      await fetchActiveRules();
    } catch (err: any) {
      alert('Error saving routes: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredOptions = options.filter(opt => {
    if (apiFilter !== 'all' && opt.api !== apiFilter) return false;
    if (hideEmpty && opt.count <= 0) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (opt.operator?.toLowerCase() || '').includes(search) || 
             (opt.provider?.toString() || '').includes(search);
    }
    return true;
  });



  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-32">
      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-amber-600 text-white p-4 z-50 flex items-center justify-between shadow-2xl border-t border-amber-500 animate-in slide-in-from-bottom-10">
          <div className="flex items-center gap-3">
            <LucideAlertTriangle className="w-6 h-6" />
            <div>
              <p className="font-bold">You have unsaved changes!</p>
              <p className="text-sm text-amber-100">Don't forget to save your routes before leaving.</p>
            </div>
          </div>
          <button 
            onClick={saveChanges}
            disabled={isSaving}
            className="flex items-center gap-2 bg-white text-amber-700 px-6 py-2.5 rounded-lg font-bold hover:bg-amber-50 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? <LucideLoader2 className="w-5 h-5 animate-spin" /> : <LucideSave className="w-5 h-5" />}
            {isSaving ? 'Saving...' : 'Save & Sync'}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <LucideShield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Admin Routing Dashboard</h1>
              <p className="text-sm text-slate-400 font-medium">Configure global routing algorithms</p>
            </div>
          </div>
          <a href="/admin/users" className="flex items-center gap-2 bg-slate-800 text-slate-300 px-4 py-2 rounded-lg font-bold hover:bg-slate-700 transition">
             Manage Users
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-4">
        
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Country</label>
            <select 
              value={country} 
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 font-medium"
            >
              {availableCountries.map(c => (
                <option key={c.id} value={c.id}>{c.short} {c.name} ({c.id})</option>
              ))}
            </select>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Service</label>
            <select 
              value={service} 
              onChange={(e) => setService(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 font-medium"
            >
              {POPULAR_SERVICES.map(s => (
                <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-start gap-6">
          <button
            onClick={scanMarket}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
          >
            {loading ? <LucideLoader2 className="w-5 h-5 animate-spin" /> : <LucideSearch className="w-5 h-5" />}
            Scan Market
          </button>
          
          <div className="flex flex-wrap gap-4 flex-1">
            {stagedRules.length === 0 && (
              <div className="flex items-center gap-2 text-slate-500 italic py-4">
                No active routes for this combination.
              </div>
            )}
            
            {stagedRules.map((rule, idx) => (
               <div key={idx} className={`flex-1 min-w-[200px] border rounded-lg p-3 flex items-center justify-between gap-3 ${rule.tier === 'premium' ? 'border-amber-500/50 bg-amber-900/20 text-amber-100' : 'border-slate-500/50 bg-slate-800 text-slate-200'}`}>
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
                    onClick={() => deleteRouteLocal(rule.target_api, rule.target_service_code, rule.target_operator, rule.target_provider, rule.tier)}
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
          <div className="p-4 bg-red-900/50 border border-red-700 text-red-200 rounded-lg mt-6">
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
                    const activePremium = stagedRules.find(r => r.tier === 'premium' && r.target_api === opt.api && r.target_service_code === opt.code && r.target_operator == opt.operator && r.target_provider == opt.provider);
                    const activeStandard = stagedRules.find(r => r.tier === 'standard' && r.target_api === opt.api && r.target_service_code === opt.code && r.target_operator == opt.operator && r.target_provider == opt.provider);
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
                             <button onClick={() => deleteRouteLocal(opt.api, opt.code, opt.operator, opt.provider, 'premium')} className="text-xs font-bold text-amber-500 uppercase hover:text-red-400 cursor-pointer">Remove Premium</button>
                           ) : (
                             <button onClick={() => addRouteLocal(opt, 'premium')} className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium">Set Premium</button>
                           )}
                           {activeStandard ? (
                             <button onClick={() => deleteRouteLocal(opt.api, opt.code, opt.operator, opt.provider, 'standard')} className="text-xs font-bold text-slate-400 uppercase hover:text-red-400 cursor-pointer">Remove Standard</button>
                           ) : (
                             <button onClick={() => addRouteLocal(opt, 'standard')} className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs font-medium">Set Standard</button>
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
