'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { LucidePhone, LucideCheckCircle, LucideXCircle, LucideLoader2, LucideWallet, LucideChevronDown, LucideShield, LucideCopy, LucideLogOut, LucidePlus, LucideArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

import { POPULAR_COUNTRIES, POPULAR_SERVICES, getCountry, getService } from '@/lib/constants';


// ─── Active Number Card ────────────────────────────────────────────────────────
const ActiveNumberCard = ({ activation, user, fetchWallet, onCancel, onBuyAgain }: { activation: any, user: any, fetchWallet: any, onCancel: any, onBuyAgain: any }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [otpCode, setOtpCode] = useState('');
  const [polling, setPolling] = useState(false);
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(false);
  const [buyingAgain, setBuyingAgain] = useState(false);
  const [error, setError] = useState('');

  const apiPost = async (url: string, data: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    return axios.post(url, data, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
    });
  };

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const createdTime = activation.createdAt ? new Date(activation.createdAt).getTime() : Date.now();
    const elapsed = (Date.now() - createdTime) / 1000;
    const remaining = Math.floor(900 - elapsed);
    if (remaining > 0 && activation.status !== 'CANCELLED' && activation.status !== 'COMPLETED') {
      setTimeLeft(remaining);
      setPolling(true);
    } else if (activation.status === 'COMPLETED') {
      setOtpCode(activation.code || '');
    } else if (remaining <= 0 && activation.status === 'PENDING') {
      if (user) {
        setLoading(true);
        apiPost('/api/vsim/cancel', { id: activation.activationId || activation.id })
          .catch(() => {})
          .finally(() => {
            setLoading(false);
            onCancel(activation.activationId || activation.id);
          });
      }
    }
  }, [activation]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (polling && timeLeft > 0 && !otpCode) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
              if (user) {
                apiPost('/api/vsim/cancel', { id: activation.activationId || activation.id })
                  .then((res) => {
                    if (res.data.success && res.data.newBalance !== undefined) {
                      window.dispatchEvent(new CustomEvent('walletUpdated', { detail: { balance: res.data.newBalance } }));
                    } else {
                      fetchWallet(user.id);
                    }
                  })
                  .catch(() => {
                    fetchWallet(user.id);
                  })
                  .finally(() => {
                    setError('Time expired. Order cancelled and refunded.');
                    setPolling(false);
                    setTimeout(() => onCancel(activation.activationId || activation.id), 2000);
                  });
              }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [polling, timeLeft, otpCode, activation, user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (polling && (activation.activationId || activation.id)) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get('/api/vsim/status', {
            params: { id: activation.activationId || activation.id }
          });
          if (res.data.status === 'COMPLETED') {
            setOtpCode(res.data.code);
            setPolling(false);
          } else if (res.data.status === 'CANCELLED') {
            setError('Activation was cancelled.');
            setPolling(false);
            if (user?.id) fetchWallet(user.id);
            setTimeout(() => onCancel(activation.activationId || activation.id), 3000);
          }
        } catch (err) {}
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [polling, activation, user?.id]);

  const cancelActivation = async () => {
    if (!activation || !user) return;
    setLoading(true);
    setWarning('');
    try {
      const res = await apiPost('/api/vsim/cancel', { id: activation.activationId || activation.id });
      if (res.data.success) {
        setPolling(false);
        if (res.data.newBalance !== undefined) {
          window.dispatchEvent(new CustomEvent('walletUpdated', { detail: { balance: res.data.newBalance } }));
        } else {
          fetchWallet(user.id);
        }
        onCancel(activation.activationId || activation.id);
      } else {
        if (res.data.error === 'EARLY_CANCEL_DENIED') {
          setWarning('The provider requires a 2-minute wait before canceling. Please wait and try again.');
        } else {
          setWarning(res.data.error || 'Failed to cancel.');
        }
      }
    } catch (err: any) {
      setWarning(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-sm text-red-400 font-medium">
        <LucideXCircle className="w-4 h-4 shrink-0" />
        {error}
      </div>
    );
  }

  const progressPercent = Math.max(0, (timeLeft / 900) * 100);

  return (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Progress bar - thin line at top */}
      {!otpCode && (
        <div className="h-0.5 bg-zinc-800">
          <div
            className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
      
      <div className="p-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Service icon + number */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0">
              <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700">
                <img src={getService(activation.service).logo} alt="Service" className="w-5 h-5 object-contain" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full overflow-hidden border-2 border-zinc-900 bg-zinc-800">
                <img src={getCountry(activation.country).flagUrl} alt="Flag" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="font-mono text-base font-bold text-white tracking-wide">
                +{activation.phoneNumber}
              </div>
              <button 
                onClick={() => copyToClipboard(activation.phoneNumber)}
                className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
              >
                <LucideCopy className="w-3 h-3" />
                {copied ? 'Copied' : 'Copy number'}
              </button>
            </div>
          </div>

          {/* Right: OTP or Timer */}
          {otpCode ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-0.5 flex items-center gap-1 justify-end">
                  <LucideCheckCircle className="w-3 h-3" /> Received
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                  <span className="font-mono text-xl font-black text-emerald-400 tracking-widest">{otpCode}</span>
                  <button 
                    onClick={() => copyToClipboard(otpCode)}
                    className="p-1.5 hover:bg-emerald-500/20 rounded-md text-emerald-400 transition-colors"
                    title="Copy OTP"
                  >
                    <LucideCopy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-0.5 flex items-center gap-1 justify-end">
                  <LucideLoader2 className="w-3 h-3 animate-spin" /> Waiting
                </div>
                <div className="font-mono text-xl font-bold text-white">
                  {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
              </div>
              <button 
                onClick={cancelActivation} 
                disabled={loading} 
                title="Cancel Order" 
                className="w-9 h-9 flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
              >
                <LucideXCircle className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Actions Row */}
      <div className="bg-zinc-800/30 px-4 py-2.5 flex items-center justify-end border-t border-zinc-800">
         <button 
           onClick={async () => {
             setBuyingAgain(true);
             try {
               await onBuyAgain(activation);
             } finally {
               setBuyingAgain(false);
             }
           }}
           disabled={buyingAgain}
           className="px-4 py-1.5 bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 shadow-sm text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
         >
           {buyingAgain ? <LucideLoader2 className="w-3.5 h-3.5 animate-spin" /> : <LucidePlus className="w-3.5 h-3.5" />}
           {buyingAgain ? 'Buying...' : 'Buy Again'}
         </button>
      </div>
      
      {warning && (
        <div className="bg-amber-500/10 border-t border-amber-500/20 px-5 py-2.5 text-xs font-medium text-amber-400 text-center">
          {warning}
        </div>
      )}
    </div>
  );
}


// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);
  const [routesLoading, setRoutesLoading] = useState(true);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await axios.get('/api/routes/available');
        setAvailableRoutes(res.data.routes || []);
      } catch (err) {
        console.error('Failed to load routes');
      } finally {
        setRoutesLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  const [country, setCountry] = useState(POPULAR_COUNTRIES[0].id);
  const [service, setService] = useState(POPULAR_SERVICES[0].code);
  const [step, setStep] = useState<1 | 2>(1);
  const [countrySearch, setCountrySearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');


  const selectedCountry = POPULAR_COUNTRIES.find(c => c.id === country) || POPULAR_COUNTRIES[0];
  const selectedService = POPULAR_SERVICES.find(s => s.code === service) || POPULAR_SERVICES[0];

  const availableCountries = service === 'gv' ? POPULAR_COUNTRIES.filter(c => ['12', '187', '36'].includes(c.id)) : POPULAR_COUNTRIES;

  const [availability, setAvailability] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [purchasingRule, setPurchasingRule] = useState<string | null>(null);
  const [error, setError] = useState('');

  const apiPost = async (url: string, data: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    return axios.post(url, data, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
    });
  };

  const [activations, setActivations] = useState<any[]>([]);

  const fetchWallet = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('balance').eq('id', userId).single();
    if (data) {
      setWallet(data);
      window.dispatchEvent(new CustomEvent('walletUpdated', { detail: { balance: data.balance } }));
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchWallet(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchWallet(session.user.id);
        resumeOrder(session.user.id);
      } else {
        setWallet(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) resumeOrder(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const resumeOrder = async (userId: string) => {
    try {
      const { data } = await supabase.from('activations').select('*').eq('user_id', userId).eq('status', 'PENDING');
      if (data) {
        setActivations(data.map((d: any) => ({
          ...d,
          activationId: d.vsim_activation_id,
          createdAt: d.created_at,
          phoneNumber: d.phone_number
        })));
      }
    } catch (e) {}
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
        if (error) throw error;
        setAuthMode('login');
        setAuthError('Account created. Check your email, then log in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
        setShowAuthModal(false);
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const checkAvailability = async (cId: string = country, sCode: string = service) => {
    setLoading(true);
    setError('');
    setAvailability(null);
    try {
      const res = await axios.get('/api/vsim/prices', { params: { country: cId, service: sCode } });
      if (res.data.options && res.data.options.length > 0) {
        setAvailability(res.data);
      } else {
        setError('Currently out of stock for this combination.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
      setPurchasingRule(null);
      }
    };

  const handleBuyAgain = async (activation: any) => {
    setLoading(true);
    setError('');
    
    try {
      const buyCountry = activation.country;
      const buyService = activation.service;
      
      const res = await axios.get(`/api/vsim/prices?country=${buyCountry}&service=${buyService}`);
      const prices = res.data.options;
      if (!prices || prices.length === 0) {
        setError('This route is completely out of stock and no longer available.');
        setLoading(false);
        return;
      }
      
      // If we have the exact rule_id (new purchases in this session)
      let selectedRoute = prices.find((p: any) => p.rule_id === activation.rule_id);
      
      // If rule_id is missing (old purchases from DB), try to match the exact target API
      if (!selectedRoute) {
        let targetApi = '';
        if (activation.activationId && activation.activationId.includes('::')) {
           targetApi = activation.activationId.split('::')[0];
        } else if (activation.vsim_activation_id && activation.vsim_activation_id.includes('::')) {
           targetApi = activation.vsim_activation_id.split('::')[0];
        }
        if (targetApi) {
           selectedRoute = prices.find((p: any) => p.rule_id && p.tier && p.price && p.source === targetApi);
        }
      }
      
      // If we STILL can't match it, just use the cheapest one available as a fallback
      if (!selectedRoute) {
         selectedRoute = prices[0];
      }
      
      const payload = { country: buyCountry, service: buyService, tier: selectedRoute.tier, maxPrice: selectedRoute.price, rule_id: selectedRoute.rule_id };
      const allocateRes = await apiPost('/api/vsim/allocate', payload);
      
      if (allocateRes.data.success) {
        setActivations((prev: any[]) => [allocateRes.data, ...prev]);
        if (allocateRes.data.newBalance !== undefined) {
           setWallet({ balance: allocateRes.data.newBalance });
           window.dispatchEvent(new CustomEvent('walletUpdated', { detail: { balance: allocateRes.data.newBalance } }));
        } else {
           if (user?.id) fetchWallet(user.id);
        }
      } else {
        setError(allocateRes.data.error || 'Failed to allocate (Out of stock)');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };


  const buyNumber = async (rule_id: string, tier: string, price: number) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setLoading(true);
    setPurchasingRule(rule_id);
    setError('');

    const handlePurchaseError = (errorMsg: string) => {
      setError(errorMsg);
      if (availability?.options) {
        setAvailability((prev: any) => ({
          ...prev,
          options: prev.options.filter((o: any) => o.tier !== tier)
        }));
      }
    };

    try {
      const payload: any = { country, service, tier, maxPrice: price, rule_id };
      const res = await apiPost('/api/vsim/allocate', payload);
      if (res.data.success) {
        setActivations((prev: any[]) => [res.data, ...prev]);
        if (res.data.newBalance !== undefined) {
           setWallet({ balance: res.data.newBalance });
           window.dispatchEvent(new CustomEvent('walletUpdated', { detail: { balance: res.data.newBalance } }));
        } else {
           fetchWallet(user.id);
        }
      } else {
        handlePurchaseError(res.data.error || 'Failed to allocate (Out of stock)');
      }
    } catch (err: any) {
      handlePurchaseError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
      setPurchasingRule(null);
      }
    };

  


  return (
    <div className="w-full space-y-6">
      
      {/* SIDE-BY-SIDE LAYOUT INSPIRED BY 5SIM */}
      <div className="flex flex-col md:flex-row gap-4 h-[600px]">
        
        {/* LEFT COLUMN: COUNTRIES */}
        <div className="w-full md:w-[320px] shrink-0 flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 border-b border-zinc-800 bg-zinc-900">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search for a Country..." 
                className="w-full bg-zinc-950/80 border border-zinc-700 text-white text-sm rounded-lg pl-3 pr-8 py-2.5 outline-none focus:border-blue-500 transition-colors"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
              />
              {countrySearch && (
                <button onClick={() => setCountrySearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  <LucideXCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {POPULAR_COUNTRIES
              .filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
              .map(c => (
              <button
                key={c.id}
                onClick={() => { setCountry(c.id); setStep(1); setAvailability(null); setError(''); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                  country === c.id 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                    : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img src={c.flagUrl} alt="" className="w-6 h-4 rounded-[2px] object-cover shadow-sm border border-black/10" />
                  <span className="text-sm font-medium">{c.name}</span>
                </div>
                <LucideCheckCircle className={`w-4 h-4 ${country === c.id ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            ))}
            {POPULAR_COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).length === 0 && (
              <div className="py-8 text-center text-zinc-500 text-sm">No countries found.</div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: SERVICES / ROUTES */}
        <div className="flex-1 flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden shadow-sm relative">
          
          {/* STEP 1: SERVICES LIST */}
          {step === 1 && (
            <>
              <div className="p-3 border-b border-zinc-800 bg-zinc-900 flex items-center gap-3">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    placeholder="Search for an App..." 
                    className="w-full bg-zinc-950/80 border border-zinc-700 text-white text-sm rounded-lg pl-3 pr-8 py-2.5 outline-none focus:border-blue-500 transition-colors"
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                  />
                  {serviceSearch && (
                    <button onClick={() => setServiceSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                      <LucideXCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="hidden sm:flex items-center bg-zinc-800/50 px-3 py-2 rounded-lg border border-zinc-700">
                  <span className="text-xs text-zinc-400">Selected: <strong className="text-zinc-200">{selectedCountry.name}</strong></span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                {routesLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                    <LucideLoader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
                    <span className="text-sm">Loading services...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                    {POPULAR_SERVICES
                      .filter(s => s.code !== 'gmail' && s.name.toLowerCase().includes(serviceSearch.toLowerCase()) && availableRoutes.some(r => r.internal_service === s.code && r.country_id === country))
                      .map(s => {
                        const sRoutes = availableRoutes.filter(r => r.internal_service === s.code && r.country_id === country);
                        const minPrice = sRoutes.length > 0 ? Math.min(...sRoutes.map(r => r.cached_wholesale_cost + 0.012)).toFixed(2) : '--';
                        const count = sRoutes.length > 0 ? sRoutes.length * 125 : 0; // Fake count for aesthetic purposes matching 5sim badge
                        return (
                          <button
                            key={s.code}
                            onClick={() => { 
                              setService(s.code); 
                              setStep(2); 
                              setTimeout(() => checkAvailability(country, s.code), 50); 
                            }}
                            className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-800/20 hover:border-blue-500/50 hover:bg-zinc-800/80 transition-all active:scale-[0.99] group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-zinc-950/50 rounded flex items-center justify-center border border-zinc-800/50 group-hover:border-blue-500/30 transition-colors">
                                <img src={s.logo} alt="" className="w-5 h-5 object-contain" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-zinc-200">{s.name}</span>
                                <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded">{count}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono font-medium text-zinc-400">$${minPrice}</span>
                              <LucideArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-500 transition-colors" />
                            </div>
                          </button>
                        );
                      })
                    }
                    {POPULAR_SERVICES.filter(s => s.code !== 'gmail' && s.name.toLowerCase().includes(serviceSearch.toLowerCase()) && availableRoutes.some(r => r.internal_service === s.code && r.country_id === country)).length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center py-16 text-zinc-500">
                        <LucideXCircle className="w-12 h-12 mb-3 opacity-20" />
                        <span className="text-sm">No services found for {selectedCountry.name}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* STEP 2: ROUTE SELECTION (PURCHASE) */}
          {step === 2 && (
            <div className="flex-1 flex flex-col bg-zinc-950/30">
              <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
                <button 
                  onClick={() => { setStep(1); setAvailability(null); setError(''); }}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  ← Back to Apps
                </button>
                <div className="flex items-center gap-3 bg-zinc-950/50 px-3 py-1.5 rounded-lg border border-zinc-800">
                  <div className="flex items-center gap-1.5 border-r border-zinc-700/50 pr-3">
                    <img src={selectedCountry.flagUrl} alt="" className="w-5 h-3.5 rounded-[2px] object-cover" />
                    <span className="text-xs font-bold text-zinc-300">{selectedCountry.short}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <img src={selectedService.logo} alt="" className="w-4 h-4 object-contain" />
                    <span className="text-xs font-bold text-white">{selectedService.name}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                {loading && (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                    <LucideLoader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
                    <span className="text-sm font-medium">Finding best routes...</span>
                  </div>
                )}
                
                {error && !loading && (
                  <div className="p-4 bg-red-500/10 text-red-400 rounded-xl flex items-start gap-3 text-sm font-medium border border-red-500/20">
                    <LucideXCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}
                
                {!loading && availability && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-zinc-400 mb-4 uppercase tracking-wider">Available Routes</h3>
                    {availability.options.map((opt: any) => (
                      <div 
                        key={opt.rule_id} 
                        className={"rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border transition-colors " + (
                          opt.tier === 'premium' 
                            ? 'bg-blue-500/5 border-blue-500/30' 
                            : 'bg-zinc-800/50 border-zinc-700'
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={"font-bold text-sm " + (opt.tier === 'premium' ? 'text-blue-400' : 'text-zinc-200')}>
                                {opt.tier === 'premium' ? 'Premium Route' : 'Standard Route'} <span className="opacity-60 font-normal text-xs">({opt.server_label})</span>
                            </span>
                            {opt.tier === 'premium' && (
                              <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 leading-relaxed">
                            {opt.tier === 'premium'
                              ? 'Highest delivery rate and fastest OTP arrival. Recommended for fresh accounts.'
                              : 'Standard delivery queue. Cancel and retry if SMS fails.'}
                          </p>
                        </div>
                        <div className="flex items-center sm:flex-col gap-4 sm:gap-1.5">
                          <span className="text-lg font-mono font-bold text-white whitespace-nowrap">$${Number(opt.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                          <button
                            onClick={() => buyNumber(opt.rule_id, opt.tier, opt.price)}
                            disabled={purchasingRule === opt.rule_id}
                            className={"w-full sm:w-auto shrink-0 px-4 py-1.5 rounded-lg font-bold text-sm transition-all active:scale-[0.97] disabled:opacity-50 border-none " + (
                              opt.tier === 'premium'
                                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                : 'bg-zinc-700 hover:bg-zinc-600 text-white'
                            )}
                          >
                            {purchasingRule === opt.rule_id ? (
                              <LucideLoader2 className="w-4 h-4 animate-spin mx-auto" />
                            ) : (
                              'Buy Now'
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Active Number Cards */}
      {activations.length > 0 && (
        <div className="space-y-3 mt-8 mb-8">
          {activations.map(act => (
            <ActiveNumberCard
                key={act.activationId || act.id}
                activation={act}
                user={user}
                fetchWallet={fetchWallet}
                onCancel={(id: string) => setActivations((prev: any[]) => prev.filter(a => (a.activationId || a.id) !== id))}
                onBuyAgain={() => handleBuyAgain(act)}
              />
          ))}
        </div>
      )}
    </div>
  );
}
