'use client';

import { ReactNode, useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { supabase } from '@/lib/supabase';
import { LucideWallet, LucidePlus } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);

  useEffect(() => {
    const fetchWallet = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data, error } = await supabase.from('profiles').select('balance').eq('id', session.user.id).single();
        if (!error && data) {
          setWallet(data);
        }
      }
    };
    fetchWallet();

    const handleWalletUpdate = (event: any) => {
      if (event.detail && event.detail.balance !== undefined) {
        setWallet({ balance: event.detail.balance });
      } else {
        fetchWallet();
      }
    };

    window.addEventListener('walletUpdated', handleWalletUpdate);
    return () => window.removeEventListener('walletUpdated', handleWalletUpdate);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 font-[family-name:var(--font-geist-sans)] flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-end px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard/recharge" 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500 transition-colors shadow-sm"
            >
              <LucidePlus className="w-4 h-4" />
              Top Up
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-lg border border-zinc-200">
              <LucideWallet className="w-4 h-4 text-zinc-500" />
              <span className="font-mono text-sm font-bold text-zinc-800">
                ${wallet?.balance ? wallet.balance : '0'}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-8 max-w-5xl mx-auto w-full flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
