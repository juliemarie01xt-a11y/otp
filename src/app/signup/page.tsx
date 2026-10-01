'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LucideShield, LucideLoader2, LucideMail, LucideLock, LucideArrowRight, LucideAlertCircle, LucideCheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.user?.identities && data.user.identities.length === 0) {
      setError('An account with this email already exists.');
      setLoading(false);
    } else {
      setSuccess('Account created! Please check your email.');
      setTimeout(() => {
        router.push('/login');
      }, 4000);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-[family-name:var(--font-geist-sans)] relative overflow-hidden">
      {/* Unified Background Glow (Same as Login for smooth transition) */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link href="/" className="flex items-center justify-center gap-3 group">
          <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center shadow-xl group-hover:border-cyan-500/50 transition-all">
            <LucideShield className="w-6 h-6 text-cyan-400" />
          </div>
          <span className="font-bold text-white text-3xl tracking-tight">SwiftOTP</span>
        </Link>
        <h2 className="mt-8 text-center text-3xl font-bold tracking-tight text-white">
          Create an account
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
            Sign in instead
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[420px] relative z-10">
        <div className="bg-zinc-900/40 backdrop-blur-2xl px-8 py-10 shadow-2xl sm:rounded-3xl border border-zinc-800/60">
          <form className="space-y-6" onSubmit={handleSignup}>
            {error && (
              <div className="p-3 bg-red-500/10 text-red-400 text-sm font-medium rounded-xl border border-red-500/20 flex items-center gap-2">
                <LucideAlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-500/10 text-emerald-400 text-sm font-medium rounded-xl border border-emerald-500/20 flex items-center gap-2">
                <LucideCheckCircle2 className="w-4 h-4 shrink-0" />
                <p>{success}</p>
              </div>
            )}
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <LucideMail className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 border border-zinc-800 rounded-xl bg-black/40 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm transition-all"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <LucideLock className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 border border-zinc-800 rounded-xl bg-black/40 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl shadow-lg shadow-cyan-500/25 text-sm font-bold text-zinc-950 bg-cyan-400 hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-8"
            >
              {loading ? (
                <LucideLoader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Create Account <LucideArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
