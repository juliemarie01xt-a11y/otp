'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LucideLock, LucideCreditCard, LucideTrendingUp, LucideActivity, LucideCheckCircle2, LucideXCircle, LucideWallet, LucideKey, LucideBot } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalSpent: 0, totalBought: 0, arrivalRate: 0 });
  
  const [password, setPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Get Profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      setProfile(prof);

      // 2. Get Deposits
      const { data: deps } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (deps) setDeposits(deps);

      // 3. Get Activations for Stats
      const { data: acts } = await supabase
        .from('activations')
        .select('status, cost')
        .eq('user_id', session.user.id);

      if (acts) {
        const completed = acts.filter(a => a.status === 'COMPLETED');
        const cancelled = acts.filter(a => a.status === 'CANCELLED');
        const totalProcessed = completed.length + cancelled.length;
        
        const spent = completed.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);
        const rate = totalProcessed > 0 ? (completed.length / totalProcessed) * 100 : 0;

        setStats({
          totalSpent: spent,
          totalBought: completed.length,
          arrivalRate: rate
        });
      }
      
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleUpdatePassword = async (e: any) => {
    e.preventDefault();
    if (password.length < 6) {
      setPwdMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setPwdLoading(true);
    setPwdMsg({ type: '', text: '' });
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPwdMsg({ type: 'success', text: 'Password updated successfully!' });
      setPassword('');
    } catch (err: any) {
      setPwdMsg({ type: 'error', text: err.message });
    }
    setPwdLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LucideActivity className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">My Profile</h1>
        <p className="text-zinc-500 mt-1 text-sm">Manage your account settings, view statistics, and billing history.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <LucideWallet className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">Current Balance</span>
          </div>
          <div className="text-3xl font-black text-zinc-900">${profile?.balance?.toFixed(2) || '0.00'}</div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <LucideCreditCard className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">Total Spent</span>
          </div>
          <div className="text-3xl font-black text-zinc-900">${stats.totalSpent.toFixed(2)}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <LucideTrendingUp className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">Numbers Bought</span>
          </div>
          <div className="text-3xl font-black text-zinc-900">{stats.totalBought}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <LucideActivity className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">OTP Arrival Rate</span>
          </div>
          <div className="text-3xl font-black text-emerald-600">{stats.arrivalRate.toFixed(0)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Crypto Transactions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
              <LucideCreditCard className="w-5 h-5 text-zinc-400" />
              <h2 className="font-bold text-zinc-900">Crypto Transactions</h2>
            </div>
            
            <div className="divide-y divide-zinc-100">
              {deposits.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">No transactions found.</div>
              ) : (
                deposits.map((dep) => (
                  <div key={dep.id} className="p-4 px-6 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                    <div>
                      <div className="font-bold text-zinc-900">${Number(dep.amount).toFixed(2)}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{new Date(dep.created_at).toLocaleString()}</div>
                    </div>
                    <div>
                      {dep.status === 'COMPLETED' ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">Completed</span>
                      ) : dep.status === 'PENDING' ? (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-100">Pending</span>
                      ) : (
                        <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-100">Failed</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Security */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
              <LucideKey className="w-5 h-5 text-zinc-400" />
              <h2 className="font-bold text-zinc-900">Change Password</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                
                {pwdMsg.text && (
                  <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${pwdMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                    {pwdMsg.type === 'error' ? <LucideXCircle className="w-4 h-4 shrink-0" /> : <LucideCheckCircle2 className="w-4 h-4 shrink-0" />}
                    {pwdMsg.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {pwdLoading ? <LucideActivity className="w-4 h-4 animate-spin" /> : <LucideLock className="w-4 h-4" />}
                  {pwdLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
          
          {/* Telegram Bot Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-sm overflow-hidden text-white">
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center sm:text-left">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mb-4">
                  <LucideBot className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold mb-2">Want to Use Our Telegram Bot?</h2>
                <p className="text-blue-100 text-sm max-w-md">Buy numbers and get SMS codes instantly on Telegram. Learn how to securely connect your account in 3 easy steps.</p>
              </div>
              <div className="shrink-0 w-full sm:w-auto">
                <a href="/dashboard/telegram" className="block w-full bg-white text-blue-600 hover:bg-blue-50 font-bold py-3 px-6 rounded-lg text-sm text-center transition-colors shadow-sm">
                  View Setup Guide
                </a>
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-200">
            <h3 className="font-bold text-zinc-900 text-sm mb-1">Account Info</h3>
            <p className="text-zinc-500 text-xs mb-3">Your profile information.</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Email</span>
                <span className="font-medium text-zinc-900">{profile?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Joined</span>
                <span className="font-medium text-zinc-900">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
