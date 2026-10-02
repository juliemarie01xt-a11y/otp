'use client';

import Link from 'next/link';
import { TelegramIcon } from '@/components/TelegramIcon';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  LucideLayoutDashboard, 
  LucideShoppingCart, 
  LucideWallet, 
  LucideList, 
  LucideSettings, 
  LucideLifeBuoy, 
  LucideLogOut, 
  LucideShield,
  LucideBot
} from 'lucide-react';
import { useEffect, useState } from 'react';

const MENU = [
  { name: 'Dashboard', path: '/dashboard', icon: LucideLayoutDashboard },
  { name: 'Buy Number', path: '/dashboard/buy', icon: LucideShoppingCart },
  { name: 'Recharge / Top-Up', path: '/dashboard/recharge', icon: LucideWallet },
  { name: 'Numbers', path: '/dashboard/history', icon: LucideList },
  { name: 'My Profile', path: '/dashboard/settings', icon: LucideSettings },
  { name: 'Help & Support', path: '/dashboard/support', icon: LucideLifeBuoy },
  { name: 'Telegram Bot', path: '/dashboard/telegram', icon: TelegramIcon },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const fetchWallet = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('balance').eq('id', session.user.id).single();
        if (data) setBalance(data.balance);
      }
    };
    fetchWallet();

    const handleWalletUpdate = (event: any) => {
      if (event.detail && event.detail.balance !== undefined) {
        setBalance(event.detail.balance);
      } else {
        fetchWallet();
      }
    };

    window.addEventListener('walletUpdated', handleWalletUpdate);
    return () => window.removeEventListener('walletUpdated', handleWalletUpdate);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="h-full bg-zinc-900 border-r border-zinc-800 flex flex-col w-full">
      {/* Logo */}
      <div className="p-6 flex items-center space-x-3 shrink-0">
        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
          <LucideShield className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-white">OTP Service</span>
      </div>

      {/* Menu */}
      <div className="flex-1 px-4 space-y-1 overflow-y-auto py-2">
        {MENU.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.path}
              onClick={onClose}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-zinc-800 space-y-2 shrink-0">
        {/* Balance Display */}
        <div className="px-4 py-3 bg-zinc-950/50 rounded-lg border border-zinc-800/50 flex items-center justify-between">
          <span className="text-sm text-zinc-500">Balance</span>
          <span className="text-sm font-mono text-white">₹{balance !== null ? balance.toFixed(2) : '0.00'}</span>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <LucideLogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
