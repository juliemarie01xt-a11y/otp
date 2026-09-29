'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LucideCheckCircle2, LucideArrowRight, LucideShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AuthSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center ring-8 ring-green-50 shadow-inner">
            <LucideCheckCircle2 className="h-10 w-10 text-green-600 animate-bounce" style={{ animationIterationCount: 2 }} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-zinc-900 tracking-tight">
          Email Verified!
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-500">
          Your account is now fully active and secure.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-2xl shadow-zinc-200/50 sm:rounded-3xl sm:px-10 border border-zinc-100 text-center">
          
          <div className="flex flex-col items-center justify-center space-y-4 mb-8">
            <div className="flex items-center text-sm font-medium text-zinc-600 bg-zinc-50 px-4 py-2 rounded-full border border-zinc-200">
              <LucideShieldCheck className="w-4 h-4 text-blue-500 mr-2" />
              Ready to buy secure numbers
            </div>
          </div>

          <Link href="/dashboard" className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all hover:shadow-lg hover:shadow-blue-200">
            Go to Dashboard <LucideArrowRight className="ml-2 w-4 h-4" />
          </Link>

          <p className="mt-6 text-xs text-zinc-400 font-medium">
            Redirecting automatically in {countdown} seconds...
          </p>
        </div>
      </div>
    </div>
  );
}
