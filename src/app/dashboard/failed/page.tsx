'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LucideXCircle, LucideArrowLeft, LucideLoader2 } from 'lucide-react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';

export default function FailedPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setCheckingAuth(false);
    };
    checkUser();
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <LucideLoader2 className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-6">
        <h1 className="text-xl font-bold text-zinc-900 mb-4">You must be logged in</h1>
        <Link href="/login" className="px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-colors">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full pt-10">
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm p-8 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <LucideXCircle className="w-8 h-8 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Payment Cancelled</h1>
        <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
          Your payment was cancelled or the invoice expired. No funds have been deducted from your account.
        </p>

        <Link 
          href="/dashboard/recharge"
          className="w-full bg-zinc-900 text-white font-semibold text-sm py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
        >
          <LucideArrowLeft className="w-4 h-4" /> Try Again
        </Link>
      </div>
    </div>
  );
}
