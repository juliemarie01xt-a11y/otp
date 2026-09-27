'use client';

import Link from 'next/link';
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
  LucideShield
} from 'lucide-react';

const MENU = [
  { name: 'Dashboard', path: '/dashboard', icon: LucideLayoutDashboard },
  { name: 'Buy Number', path: '/dashboard/buy', icon: LucideShoppingCart },
  { name: 'Recharge / Top-Up', path: '/dashboard/recharge', icon: LucideWallet },
  { name: 'Numbers', path: '/dashboard/history', icon: LucideList },
  { name: 'My Profile', path: '/dashboard/settings', icon: LucideSettings },
  { name: 'Help & Support', path: '/dashboard/support', icon: LucideLifeBuoy },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="w-64 bg-zinc-900 text-zinc-300 h-screen fixed top-0 left-0 flex flex-col border-r border-zinc-800">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2.5 text-white">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <LucideShield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">SwiftOTP</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {MENU.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <LucideLogOut className="w-5 h-5" />
          Log out
        </button>
      </div>
    </div>
  );
}
