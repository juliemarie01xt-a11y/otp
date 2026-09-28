'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LucideCheckCircle, LucideArrowRight, LucideLoader2 } from 'lucide-react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';

export default function SuccessPage() {
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
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
          <LucideCheckCircle className="w-8 h-8 text-green-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Payment Processing!</h1>
        <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
          Your crypto payment has been received and is waiting for blockchain confirmation. 
          Your balance will update automatically in a few minutes.
        </p>

        <Link 
          href="/dashboard"
          className="w-full bg-zinc-900 text-white font-semibold text-sm py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
        >
          Return to Dashboard <LucideArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
