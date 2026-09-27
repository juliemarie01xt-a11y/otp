'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { LucidePhone, LucideCheckCircle, LucideXCircle, LucideLoader2, LucideWallet, LucideChevronDown, LucideShield, LucideCopy, LucideLogOut, LucidePlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

import { POPULAR_COUNTRIES, POPULAR_SERVICES, getCountry, getService } from '@/lib/constants';


// ── Active Number Card ──────────────────────────────────────────────
const ActiveNumberCard = ({ activation, user, fetchWallet, onCancel }: { activation: any, user: any, fetchWallet: any, onCancel: any }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [otpCode, setOtpCode] = useState('');
  const [polling, setPolling] = useState(false);
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
        axios.post('/api/vsim/cancel', { id: activation.activationId || activation.id, userId: user.id })
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
                axios.post('/api/vsim/cancel', { id: activation.activationId || activation.id, userId: user.id })
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
      const res = await axios.post('/api/vsim/cancel', { id: activation.activationId || activation.id, userId: user.id });
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
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-sm text-red-700 font-medium">
        <LucideXCircle className="w-4 h-4 shrink-0" />
        {error}
      </div>
    );
  }

  const progressPercent = Math.max(0, (timeLeft / 900) * 100);

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      {/* Progress bar - thin line at top */}
      {!otpCode && (
        <div className="h-0.5 bg-zinc-100">
          <div
            className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
      
      <div className="p-5">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Service icon + number */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0">
              <div className="w-11 h-11 bg-zinc-50 rounded-lg flex items-center justify-center border border-zinc-100">
                <img src={getService(activation.service).logo} alt="Service" className="w-7 h-7 object-contain" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full overflow-hidden border-2 border-white bg-white">
                <img src={getCountry(activation.country).flagUrl} alt="Flag" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="font-mono text-lg font-bold text-zinc-900 tracking-wide">
                +{activation.phoneNumber}
              </div>
              <button 
                onClick={() => copyToClipboard(activation.phoneNumber)}
                className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1 transition-colors"
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
                <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-0.5 flex items-center gap-1 justify-end">
                  <LucideCheckCircle className="w-3 h-3" /> Received
                </div>
                <button 
                  onClick={() => copyToClipboard(otpCode)}
                  className="font-mono text-2xl font-black text-emerald-600 tracking-widest hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  {otpCode}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-0.5 flex items-center gap-1 justify-end">
                  <LucideLoader2 className="w-3 h-3 animate-spin" /> Waiting
                </div>
                <div className="font-mono text-xl font-bold text-zinc-700">
                  {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
              </div>
              <button 
                onClick={cancelActivation} 
                disabled={loading} 
                title="Cancel Order" 
                className="w-9 h-9 flex items-center justify-center text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
              >
                <LucideXCircle className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {warning && (
        <div className="bg-amber-50 border-t border-amber-100 px-5 py-2.5 text-xs font-medium text-amber-700 text-center">
          {warning}
        </div>
      )}
    </div>
  );
}


// ── Main Page ───────────────────────────────────────────────────────
export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [country, setCountry] = useState(POPULAR_COUNTRIES[0].id);
  const [service, setService] = useState(POPULAR_SERVICES[0].code);
  const [countryOpen, setCountryOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);

  const selectedCountry = POPULAR_COUNTRIES.find(c => c.id === country) || POPULAR_COUNTRIES[0];
  const selectedService = POPULAR_SERVICES.find(s => s.code === service) || POPULAR_SERVICES[0];

  const [availability, setAvailability] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [purchasingTier, setPurchasingTier] = useState<string | null>(null);
  const [error, setError] = useState('');
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

  const checkAvailability = async () => {
    setLoading(true);
    setError('');
    setAvailability(null);
    try {
      const res = await axios.get('/api/vsim/prices', { params: { country, service } });
      if (res.data.options && res.data.options.length > 0) {
        setAvailability(res.data);
      } else {
        setError('Currently out of stock for this combination.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
      setPurchasingTier(null);
    }
  };

  const buyNumber = async (tier: string = 'premium', price: number) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setLoading(true);
    setPurchasingTier(tier);
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
      const payload: any = { country, service, userId: user.id, tier };
      payload.maxPrice = price;
      const res = await axios.post('/api/vsim/allocate', payload);
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
      setPurchasingTier(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full">
      <main className="max-w-2xl mx-auto px-5 py-8">
        {/* Active Number Cards */}
        {activations.length > 0 && (
          <div className="space-y-3 mb-8">
            {activations.map(act => (
              <ActiveNumberCard
                key={act.activationId || act.id}
                activation={act}
                user={user}
                fetchWallet={fetchWallet}
                onCancel={(id: string) => setActivations((prev: any[]) => prev.filter(a => (a.activationId || a.id) !== id))}
              />
            ))}
          </div>
        )}

        {/* ── Select Service Card ──────────────────────────────── */}
        <div className="bg-white rounded-xl border border-zinc-200">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="font-bold text-zinc-900">Get a number</h2>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Country Dropdown */}
              <div className="relative">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Country</label>
                <button
                  onClick={() => { setCountryOpen(!countryOpen); setServiceOpen(false); }}
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-shadow text-sm"
                >
                  <div className="flex items-center gap-2">
                    <img src={selectedCountry.flagUrl} alt="" className="w-5 h-4 rounded-[2px] object-cover" />
                    <span className="font-medium text-zinc-800 truncate">{selectedCountry.name}</span>
                  </div>
                  <LucideChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                </button>

                {countryOpen && (
                  <div className="absolute z-20 w-full mt-1.5 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden">
                    {POPULAR_COUNTRIES.map(c => (
                      <button
                        key={c.id}
                        className={`w-full text-left px-3 py-2.5 flex items-center gap-2 text-sm hover:bg-zinc-50 transition-colors ${c.id === country ? 'bg-zinc-50 font-semibold' : ''}`}
                        onClick={() => { setCountry(c.id); setCountryOpen(false); }}
                      >
                        <img src={c.flagUrl} alt="" className="w-5 h-4 rounded-[2px] object-cover" />
                        <span className="truncate">{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Service Dropdown */}
              <div className="relative">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Service</label>
                <button
                  onClick={() => { setServiceOpen(!serviceOpen); setCountryOpen(false); }}
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-shadow text-sm"
                >
                  <div className="flex items-center gap-2">
                    <img src={selectedService.logo} alt="" className="w-5 h-5 object-contain" />
                    <span className="font-medium text-zinc-800 truncate">{selectedService.name}</span>
                  </div>
                  <LucideChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                </button>

                {serviceOpen && (
                  <div className="absolute z-20 w-full mt-1.5 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden">
                    {POPULAR_SERVICES.map(s => (
                      <button
                        key={s.code}
                        className={`w-full text-left px-3 py-2.5 flex items-center gap-2 text-sm hover:bg-zinc-50 transition-colors ${s.code === service ? 'bg-zinc-50 font-semibold' : ''}`}
                        onClick={() => { setService(s.code); setServiceOpen(false); }}
                      >
                        <img src={s.logo} alt="" className="w-5 h-5 object-contain" />
                        <span className="truncate">{s.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={checkAvailability}
              disabled={loading}
              className="w-full py-2.5 bg-zinc-900 text-white rounded-lg font-semibold text-sm hover:bg-zinc-800 disabled:opacity-50 transition-colors active:scale-[0.98]"
            >
              {loading && !purchasingTier ? (
                <span className="flex items-center justify-center gap-2">
                  <LucideLoader2 className="w-4 h-4 animate-spin" /> Checking...
                </span>
              ) : 'Check availability'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-5 mb-5 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm font-medium border border-red-100">
              <LucideXCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Availability Results */}
          {availability && !error && (
            <div className="border-t border-zinc-100 p-5 space-y-3">
              {availability.options.map((opt: any) => (
                <div 
                  key={opt.tier} 
                  className={`rounded-xl p-4 flex items-center justify-between gap-4 border transition-colors ${
                    opt.tier === 'premium' 
                      ? 'bg-blue-50/50 border-blue-200' 
                      : 'bg-zinc-50 border-zinc-200'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`font-bold text-sm ${opt.tier === 'premium' ? 'text-blue-800' : 'text-zinc-700'}`}>
                        {opt.tier === 'premium' ? 'High-Priority' : 'Standard'}
                      </span>
                      {opt.tier === 'premium' && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded">
                          Faster
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      {opt.tier === 'premium'
                        ? 'Historically faster delivery. Success depends on source network.'
                        : 'Success rates vary. Cancel and retry if SMS does not arrive.'}
                    </p>
                  </div>
                  <button
                    onClick={() => buyNumber(opt.tier, opt.price)}
                    disabled={loading}
                    className={`shrink-0 px-4 py-2.5 rounded-lg font-bold text-sm transition-all active:scale-[0.97] disabled:opacity-50 ${
                      opt.tier === 'premium'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200'
                    }`}
                  >
                    {purchasingTier === opt.tier ? (
                      <LucideLoader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      `$${Number(opt.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Info Strip ──────────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="bg-white rounded-xl border border-zinc-200 px-3 py-4">
            <LucideShield className="w-5 h-5 text-zinc-400 mx-auto mb-2" />
            <div className="text-xs font-semibold text-zinc-500">Auto-refund</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">If SMS fails</div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 px-3 py-4">
            <LucidePhone className="w-5 h-5 text-zinc-400 mx-auto mb-2" />
            <div className="text-xs font-semibold text-zinc-500">Real numbers</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Verified carriers</div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 px-3 py-4">
            <LucideWallet className="w-5 h-5 text-zinc-400 mx-auto mb-2" />
            <div className="text-xs font-semibold text-zinc-500">Crypto pay</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">USDT, BTC, LTC</div>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="max-w-2xl mx-auto px-5 py-8 mt-auto">
        <div className="border-t border-zinc-200 pt-6 flex items-center justify-between">
          <span className="text-xs text-zinc-400">SwiftOTP</span>
          <a href="/admin" className="text-xs text-zinc-300 hover:text-zinc-500 transition-colors">Admin</a>
        </div>
      </footer>
    </div>
  );
}
