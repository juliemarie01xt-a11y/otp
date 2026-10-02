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
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <LucideLoader2 className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-6 font-[family-name:var(--font-geist-sans)]">
        <h1 className="text-xl font-bold text-white mb-4">You must be logged in</h1>
        <Link href="/dashboard" className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500 transition-colors">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full">
      <main className="w-full">
        <div className="bg-zinc-900/50 backdrop-blur rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700">
              <LucideWallet className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <h1 className="font-bold text-white">Top up wallet</h1>
              <p className="text-xs text-zinc-400">
                Balance: <span className="font-mono font-bold text-zinc-300">${balance}</span>
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
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700'
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-semibold text-sm">$</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg py-2.5 pl-7 pr-4 text-sm font-semibold text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-shadow"
                  placeholder="Custom amount"
                />
              </div>
              
              {amount >= 1 && (
                <div className="mt-3 flex justify-between items-center text-xs text-zinc-400 bg-zinc-800/50 px-3 py-2 rounded border border-zinc-700">
                  <span>Estimated Total (incl. 1.5% fee):</span>
                  <span className="font-semibold text-white">${(amount * 1.015).toFixed(2)}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 text-red-500 text-sm font-medium p-3 rounded-lg border border-red-500/20">
                {error}
              </div>
            )}

            <button
              onClick={handleDeposit}
              disabled={loading || !user}
              className="w-full bg-blue-600 text-white font-semibold text-sm py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-500 transition-colors disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <LucideLoader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Pay with crypto <LucideArrowRight className="w-4 h-4" /></>
              )}
            </button>
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 mt-4">
              <p className="text-[11px] text-zinc-300 font-medium leading-relaxed">
                <strong className="font-bold text-white">Don't worry about exact amounts!</strong><br />
                If you underpay or overpay, our system will automatically detect the exact amount of crypto we receive and credit your wallet fairly.
              </p>
            </div>
            <p className="text-center text-[11px] text-zinc-500 font-medium mt-2">
              Secured by Plisio. USDT, Bitcoin, and Litecoin accepted.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
