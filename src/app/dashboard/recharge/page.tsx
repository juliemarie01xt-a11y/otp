'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabase';
import { LucideWallet, LucideLoader2, LucideArrowRight, LucideShield } from 'lucide-react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';

export default function DepositPage() {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [amount, setAmount] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('balance').eq('id', session.user.id).single();
        if (profile) setBalance(Number(profile.balance));
      }
      setCheckingAuth(false);
    };
    checkUser();
  }, []);

  const handleDeposit = async () => {
    if (!user) return;
    if (amount < 1) {
      setError('Minimum deposit is $1.00');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await axios.post('/api/deposit', { amount }, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      if (res.data.success && res.data.invoice_url) {
        window.location.href = res.data.invoice_url;
      } else {
        setError(res.data.error || 'Failed to generate invoice');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred.');
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <LucideLoader2 className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-6 font-[family-name:var(--font-geist-sans)]">
        <h1 className="text-xl font-bold text-zinc-900 mb-4">You must be logged in</h1>
        <Link href="/dashboard" className="px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-colors">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full">
      <main className="w-full">
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-50 rounded-lg flex items-center justify-center border border-zinc-100">
              <LucideWallet className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <h1 className="font-bold text-zinc-900">Top up wallet</h1>
              <p className="text-xs text-zinc-400">
                Balance: <span className="font-mono font-bold text-zinc-600">${balance}</span>
              </p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Amount (USD)
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[5, 10, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset)}
                    className={`py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-[0.97] ${
                      amount === preset
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-semibold text-sm">$</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2.5 pl-7 pr-4 text-sm font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-shadow"
                  placeholder="Custom amount"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm font-medium p-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <button
              onClick={handleDeposit}
              disabled={loading || !user}
              className="w-full bg-zinc-900 text-white font-semibold text-sm py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <LucideLoader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Pay with crypto <LucideArrowRight className="w-4 h-4" /></>
              )}
            </button>
            <p className="text-center text-[11px] text-zinc-400 font-medium">
              Secured by Plisio. USDT, Bitcoin, and Litecoin accepted.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
