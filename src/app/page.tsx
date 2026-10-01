'use client';
import { useState, useEffect } from 'react';

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { TelegramIcon } from '@/components/TelegramIcon';
import { LucideShield, LucideZap, LucideRefreshCw, LucideArrowRight, LucideWallet, LucideLock, LucideCheck, LucideGlobe, LucideUsers, LucideBriefcase, LucideStar, LucideLoader2, LucideMousePointer2, LucidePhone, LucideMessageSquare, LucideLifeBuoy, LucideBot } from 'lucide-react';

const FEED_SERVICES = [
  { name: 'Google', logo: 'https://img.icons8.com/color/96/google-logo.png', countries: [{ c: 'GB', f: 'https://flagcdn.com/w40/gb.png', p: '+44 7700 90' }, { c: 'CA', f: 'https://flagcdn.com/w40/ca.png', p: '+1 (416) 555-' }] },
  { name: 'Google Voice', logo: 'https://img.icons8.com/color/96/google-voice.png', countries: [{ c: 'US', f: 'https://flagcdn.com/w40/us.png', p: '+1 (415) 555-' }] },
  { name: 'Gmail', logo: 'https://img.icons8.com/color/96/gmail-new.png', countries: [{ c: 'US', f: 'https://flagcdn.com/w40/us.png', p: '+1 (202) 555-' }, { c: 'DE', f: 'https://flagcdn.com/w40/de.png', p: '+49 151 555' }] },
  { name: 'YouTube', logo: 'https://img.icons8.com/color/96/youtube-play.png', countries: [{ c: 'GB', f: 'https://flagcdn.com/w40/gb.png', p: '+44 7700 90' }, { c: 'FR', f: 'https://flagcdn.com/w40/fr.png', p: '+33 6 12 34 ' }] },
];

function generateRandomFeedItem(id: number, status: 'awaiting' | 'completed') {
  const s = FEED_SERVICES[Math.floor(Math.random() * FEED_SERVICES.length)];
  const c = s.countries[Math.floor(Math.random() * s.countries.length)];
  const ext = Math.floor(1000 + Math.random() * 9000);
  const code = status === 'completed' ? (s.name === 'Google' ? `G-${Math.floor(10000 + Math.random() * 90000)}` : Math.floor(10000 + Math.random() * 90000).toString()) : '';
  return { id, service: s.name, logo: s.logo, country: c.c, flag: c.f, number: `${c.p}${ext}`, status, code };
}

function LiveFeed() {
  const [items, setItems] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [counter, setCounter] = useState(6);

  useEffect(() => {
    setItems([
      generateRandomFeedItem(1, 'awaiting'),
      generateRandomFeedItem(2, 'completed'),
      generateRandomFeedItem(3, 'completed'),
      generateRandomFeedItem(4, 'completed'),
      generateRandomFeedItem(5, 'completed'),
    ]);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const timer = setInterval(() => {
      setItems(prev => {
        const newItems = [...prev];
        if (newItems[0] && newItems[0].status === 'awaiting') {
          const isGoogle = newItems[0].service === 'Google';
          newItems[0] = { ...newItems[0], status: 'completed', code: isGoogle ? `G-${Math.floor(10000 + Math.random() * 90000)}` : Math.floor(10000 + Math.random() * 90000).toString() };
        }
        newItems.unshift(generateRandomFeedItem(counter, 'awaiting'));
        setCounter(c => c + 1);
        return newItems.slice(0, 5);
      });
    }, 3500);
    return () => clearInterval(timer);
  }, [counter, mounted]);

  if (!mounted) return null;

  return (
    <div className="relative bg-white border border-zinc-200 rounded-3xl shadow-2xl shadow-zinc-200/50 overflow-hidden flex flex-col">
      <div className="bg-zinc-50/90 backdrop-blur-md border-b border-zinc-100 px-5 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <span className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Live network</span>
        </div>
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Updating...</span>
      </div>
      <div className="flex flex-col relative bg-zinc-50/20">
        {items.map((item) => (
          <div key={item.id} className="p-5 flex items-center justify-between bg-white border-b border-zinc-100 animate-in slide-in-from-top-4 fade-in duration-500">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center border border-zinc-100 shadow-sm">
                  <img src={item.logo} alt={item.service} className="w-7 h-7 object-contain" />
                </div>
                <img src={item.flag} alt={item.country} className="w-5 h-5 absolute -bottom-2 -right-2 border-2 border-white rounded-full object-cover bg-white shadow-sm" />
              </div>
              <div>
                <div className="text-base font-bold text-zinc-900 tracking-tight">{item.number}</div>
                <div className="text-sm text-zinc-500 font-medium">{item.service}</div>
              </div>
            </div>
            {item.status === 'awaiting' ? (
              <div className="flex items-center gap-2 bg-blue-50/50 border border-blue-100 px-3 py-1.5 rounded-lg shrink-0">
                <LucideLoader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Awaiting</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-emerald-50/50 border border-emerald-100 px-3 py-1.5 rounded-lg shrink-0 animate-in zoom-in duration-300">
                <LucideCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-mono text-sm font-bold text-emerald-700">{item.code}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}



const STEPS = [
  {
    num: '1',
    title: 'Pick a service',
    desc: 'Choose the app you need to verify with and your preferred country.',
  },
  {
    num: '2',
    title: 'Get your number',
    desc: 'A real or virtual phone number is assigned to you instantly. No SIM card needed.',
  },
  {
    num: '3',
    title: 'Receive the code',
    desc: 'The OTP appears on your screen within seconds. Copy it and verify.',
  },
];

const FEATURES = [
  {
    icon: LucideZap,
    title: 'Instant delivery',
    desc: 'Numbers are activated in under 3 seconds. No queues, no wait.',
  },
  {
    icon: LucideRefreshCw,
    title: 'Auto-refund',
    desc: 'If the SMS never arrives, your wallet is refunded automatically.',
  },
  {
    icon: LucideWallet,
    title: 'Pay with crypto',
    desc: 'USDT, Bitcoin, Litecoin. No credit card or bank account needed.',
  },
  {
    icon: LucideLock,
    title: 'No personal data',
    desc: 'We never ask for your real phone number, name, or address.',
  },
];

const COVERAGE = [
  { country: 'United States', code: 'US', flag: 'https://flagcdn.com/w40/us.png', price: '0.15' },
  { country: 'United Kingdom', code: 'UK', flag: 'https://flagcdn.com/w40/gb.png', price: '0.25' },
  { country: 'Canada', code: 'CA', flag: 'https://flagcdn.com/w40/ca.png', price: '0.35' },
  { country: 'Germany', code: 'DE', flag: 'https://flagcdn.com/w40/de.png', price: '0.40' },
  { country: 'France', code: 'FR', flag: 'https://flagcdn.com/w40/fr.png', price: '0.30' },
  { country: 'Colombia', code: 'CO', flag: 'https://flagcdn.com/w40/co.png', price: '0.10' },
];

const USE_CASES = [
  {
    icon: LucideBriefcase,
    title: 'Digital Marketers',
    desc: 'Create and manage isolated accounts for your clients without juggling dozens of physical SIM cards.'
  },
  {
    icon: LucideUsers,
    title: 'Privacy Advocates',
    desc: 'Stop giving your personal phone number to data brokers. Use a temporary number for online registrations.'
  },
  {
    icon: LucideGlobe,
    title: 'Global Access',
    desc: 'Bypass geo-restrictions. Verify accounts on platforms that require a phone number from a specific country.'
  }
];

const TESTIMONIALS = [
  {
    quote: "I run a marketing agency and we need to verify client accounts daily. This platform completely eliminated our physical SIM card headache.",
    author: "David R.",
    role: "Agency Owner"
  },
  {
    quote: "The auto-refund feature is a lifesaver. On other platforms I constantly lost money when SMS codes didn't arrive. Here it is completely automated.",
    author: "Sarah M.",
    role: "Digital Nomad"
  },
  {
    quote: "Being able to top up my wallet directly with USDT on the Tron network saves me so much money in fees. The UI is incredibly clean.",
    author: "Alex K.",
    role: "Privacy Consultant"
  }
];

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 font-[family-name:var(--font-geist-sans)]">
      {/* ── Navigation ───────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-zinc-100">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <LucideShield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-zinc-900 text-lg tracking-tight">SwiftOTP</span>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-colors"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-5 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-xl">
            <h1 className="text-4xl md:text-6xl font-bold text-zinc-900 tracking-tight leading-[1.1]">
              Virtual phone numbers,<br />delivered in seconds.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-zinc-500 leading-relaxed">
              Receive SMS verification codes without sharing your real number. 
              Pay with crypto. Get refunded instantly if the message never arrives.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-zinc-900 text-white rounded-lg font-bold hover:bg-zinc-800 transition-colors active:scale-[0.98]"
              >
                Start verifying <LucideArrowRight className="w-4 h-4" />
              </Link>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-700">No subscriptions.</span>
                <span className="text-sm text-zinc-400">Pay only for what you use.</span>
              </div>
            </div>
          </div>
          
          {/* Right Column: Simulated Live Feed */}
          <div className="hidden lg:block relative w-full max-w-lg mx-auto">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-3xl transform rotate-3 scale-105 opacity-50 blur-xl"></div>
            <LiveFeed />
          </div>
        </div>
      </section>

      {/* ── Supported Services ────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-5 pb-20">
        <div className="flex flex-col items-center justify-center gap-6 py-8 border-y border-zinc-200">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider text-center">Works seamlessly with</span>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 lg:gap-12 w-full">
            {[
              { name: 'Google', logo: 'https://img.icons8.com/color/96/google-logo.png' },
              { name: 'Google Voice', logo: 'https://img.icons8.com/color/96/google-voice.png' },
              { name: 'Gmail', logo: 'https://img.icons8.com/color/96/gmail-new.png' },
              { name: 'YouTube', logo: 'https://img.icons8.com/color/96/youtube-play.png' },
            ].map(s => (
              <img 
                key={s.name}
                src={s.logo} 
                alt={s.name} 
                title={s.name}
                className="w-8 h-8 md:w-9 md:h-9 object-contain hover:scale-110 transition-transform cursor-default drop-shadow-sm" 
              />
            ))}
            <div className="flex items-center justify-center px-4 py-2 rounded-full bg-zinc-50 border border-zinc-200 text-[10px] font-bold text-zinc-500 uppercase tracking-wider cursor-default shadow-sm">
              + More coming soon
            </div>
          </div>
        </div>
      </section>

      {/* ── Global Coverage ───────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-5 py-16">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-zinc-900 mb-3">Global coverage</h2>
          <p className="text-zinc-500">Access numbers from over 100+ countries at wholesale prices.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {COVERAGE.map((loc) => (
            <div key={loc.code} className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-start gap-4 hover:border-zinc-300 transition-colors shadow-sm hover:shadow-md">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-100 shrink-0">
                <img src={loc.flag} alt="" aria-hidden="true" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-zinc-800 text-sm">{loc.country}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Use Cases ─────────────────────────────────────────── */}
      <section className="bg-white border-y border-zinc-200 mt-10">
        <div className="max-w-5xl mx-auto px-5 py-20">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">Who is this for?</h2>
            <p className="text-zinc-500 text-lg">Whether you are building a business or protecting your identity, we have you covered.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {USE_CASES.map((useCase) => (
              <div key={useCase.title} className="text-center md:text-left">
                <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center mb-5 mx-auto md:mx-0">
                  <useCase.icon className="w-6 h-6 text-zinc-700" />
                </div>
                <h3 className="font-bold text-zinc-900 text-lg mb-2">{useCase.title}</h3>
                <p className="text-zinc-500 leading-relaxed">{useCase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-5 py-24">
        <h2 className="text-3xl font-bold text-zinc-900 mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step) => (
            <div key={step.num} className="bg-white rounded-2xl border border-zinc-200 p-8 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <span className="text-8xl font-black">{step.num}</span>
              </div>
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 relative z-10">
                {step.num === '1' && <LucideMousePointer2 className="w-5 h-5" />}
                {step.num === '2' && <LucidePhone className="w-5 h-5" />}
                {step.num === '3' && <LucideMessageSquare className="w-5 h-5" />}
              </div>
              <h3 className="font-bold text-zinc-900 text-lg mb-2 relative z-10">{step.title}</h3>
              <p className="text-zinc-500 leading-relaxed relative z-10">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="bg-zinc-900 text-white py-24">
        <div className="max-w-5xl mx-auto px-5">
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-4">Built for scale and privacy.</h2>
            <p className="text-zinc-400 text-lg max-w-xl">Everything you need to manage verifications without the headache of physical hardware.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-5">
                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0 border border-zinc-700">
                  <f.icon className="w-6 h-6 text-zinc-300" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-zinc-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-5 py-24">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-zinc-900 mb-3">Trusted by professionals</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map(star => (
                    <LucideStar key={star} className="w-4 h-4 fill-blue-600 text-blue-600" />
                  ))}
                </div>
                <p className="text-zinc-600 leading-relaxed mb-6">"{t.quote}"</p>
              </div>
              <div>
                <div className="font-bold text-zinc-900">{t.author}</div>
                <div className="text-sm text-zinc-400">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section className="bg-white border-y border-zinc-200 py-24">
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="text-3xl font-bold text-zinc-900 mb-12">Common questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {[
              {
                q: 'What happens if I don\'t receive the SMS?',
                a: 'Your wallet is refunded automatically after 15 minutes. You can also cancel manually at any time for an instant refund.',
              },
              {
                q: 'Which payment methods do you accept?',
                a: 'We accept USDT (Tron), Bitcoin, and Litecoin. No credit cards or bank accounts needed. Deposits are credited automatically.',
              },
              {
                q: 'Are the phone numbers real?',
                a: 'Yes. Every number is from a verified telecom carrier. They work with any service that sends SMS verification codes.',
              },
              {
                q: 'Do you offer an API?',
                a: 'Not publicly yet, but we are working on a developer API for high-volume users. Check back soon.',
              },
            ].map(faq => (
              <div key={faq.q}>
                <h3 className="font-bold text-zinc-900 text-lg mb-2">{faq.q}</h3>
                <p className="text-zinc-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-5 py-24">
        <div className="bg-blue-600 rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to get started?</h2>
            <p className="text-blue-100 text-lg mb-8 max-w-lg mx-auto">
              Create your account in seconds. Deposit crypto and receive your first OTP today. No minimums.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-base hover:bg-zinc-50 transition-colors active:scale-[0.98] shadow-lg"
            >
              Open dashboard <LucideArrowRight className="w-5 h-5" />
            </Link>
          </div>
          {/* Decorative background circles */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-blue-700 rounded-full blur-3xl opacity-50"></div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-zinc-950 pt-20 pb-10 border-t border-zinc-900 mt-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto px-5 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                  <LucideShield className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-white text-2xl tracking-tight drop-shadow-md">SwiftOTP</span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mb-8">
                The fastest, most reliable virtual numbers for SMS verification. Powered by crypto, fully automated, and perfectly integrated with Telegram.
              </p>
              <div className="flex items-center gap-4">
                <a href="https://t.me/SwiftOTPOfficial_bot" target="_blank" className="w-10 h-10 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-blue-400 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all shadow-lg hover:-translate-y-1" title="Telegram Bot">
                   <LucideBot className="w-4 h-4" />
                </a>
                <a href="https://t.me/swiftotpofficial_Support" target="_blank" className="w-10 h-10 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-cyan-400 hover:bg-cyan-600 hover:text-white hover:border-cyan-500 transition-all shadow-lg hover:-translate-y-1" title="Telegram Support">
                   <TelegramIcon className="w-4 h-4" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-white mb-6 tracking-wide uppercase text-xs">Platform</h3>
              <ul className="space-y-4 text-sm font-medium">
                <li><Link href="/dashboard" className="text-zinc-400 hover:text-blue-400 transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></div> Dashboard</Link></li>
                <li><Link href="/deposit" className="text-zinc-400 hover:text-blue-400 transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></div> Deposit Crypto</Link></li>
                <li><Link href="/login" className="text-zinc-400 hover:text-blue-400 transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></div> Log In</Link></li>
                <li><Link href="/signup" className="text-zinc-400 hover:text-blue-400 transition-colors flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></div> Create Account</Link></li>
              </ul>
            </div>
            
            <div>
                            <h3 className="font-bold text-white mb-6 tracking-wide uppercase text-xs">Help & Support</h3>
              <ul className="space-y-4 text-sm font-medium">
                <li><a href="https://t.me/swiftotpofficial_Support" target="_blank" className="text-zinc-400 hover:text-cyan-400 transition-colors flex items-center gap-2"><TelegramIcon className="w-3.5 h-3.5"/> Telegram Support</a></li>
                <li><Link href="/support" className="text-zinc-400 hover:text-cyan-400 transition-colors flex items-center gap-2"><LucideShield className="w-3.5 h-3.5"/> Help Center</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-zinc-800/80 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-zinc-500 text-sm font-medium">
              &copy; {new Date().getFullYear()} SwiftOTP. All rights reserved.
            </p>
            <div className="flex items-center gap-3 bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-800 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              <span className="text-zinc-300 text-xs font-bold uppercase tracking-widest">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
