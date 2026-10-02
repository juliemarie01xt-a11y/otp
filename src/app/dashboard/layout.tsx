'use client';

import { ReactNode, useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { supabase } from '@/lib/supabase';
import { LucideWallet, LucidePlus, LucideMenu } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <div className="flex h-screen bg-zinc-950">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out`}>
        <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-zinc-900 border-b border-zinc-800 shrink-0">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 text-zinc-400 hover:text-white"
          >
            <LucideMenu className="w-6 h-6" />
          </button>

          <div className="flex items-center space-x-4 ml-auto">
            {/* Wallet Display */}
            <div className="flex items-center space-x-3 bg-zinc-800 border border-zinc-700 px-4 py-2 rounded-xl">
              <LucideWallet className="w-4 h-4 text-blue-400" />
              <span className="text-white font-mono font-medium">
                ${wallet?.balance?.toFixed(2) || '0.00'}
              </span>
              <Link 
                href="/dashboard/recharge" 
                className="ml-2 bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded-md transition-colors"
              >
                <LucidePlus className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
