'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LucideBot, LucideMessageSquare, LucideAlertTriangle, LucideTerminal, LucideSmartphone, LucideCheckCircle2, LucideXCircle, LucideActivity, LucideExternalLink, LucideShoppingCart, LucideWallet, LucideList, LucideActivitySquare, LucideLogOut } from 'lucide-react';
import Link from 'next/link';

export default function TelegramGuidePage() {
  const [telegramId, setTelegramId] = useState('');
  const [tgLoading, setTgLoading] = useState(false);
  const [tgMsg, setTgMsg] = useState({ type: '', text: '' });
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (data) setProfile(data);
    };
    loadProfile();
  }, [router]);

  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Step 1: Send OTP to user's email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramId.trim()) return;
    setTgLoading(true);
    setTgMsg({ type: '', text: '' });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not logged in");

      const res = await fetch('/api/user/send-link-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setMaskedEmail(data.email);
        setOtpStep(true);
        setResendTimer(60);
        setTgMsg({ type: 'success', text: `Verification code sent to ${data.email}` });
      } else {
        setTgMsg({ type: 'error', text: data.error || 'Failed to send verification code' });
      }
    } catch (err: any) {
      setTgMsg({ type: 'error', text: 'Server error: ' + String(err) });
    }
    setTgLoading(false);
  };

  // Step 2: Verify OTP and link Telegram
  const handleLinkTelegram = async () => {
    if (!otpCode.trim()) return;
    setTgLoading(true);
    setTgMsg({ type: '', text: '' });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not logged in");
      
      const res = await fetch('/api/user/link-telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ telegramId, otp_code: otpCode })
      });
      const data = await res.json();
      if (data.success) {
        setProfile({ ...profile, telegram_id: telegramId });
        setOtpStep(false);
        setOtpCode('');
        setTgMsg({ type: 'success', text: 'Successfully connected!' });
      } else {
        setTgMsg({ type: 'error', text: data.error || 'Failed to link account' });
      }
    } catch (err: any) {
      setTgMsg({ type: 'error', text: 'Server error: ' + String(err) });
    }
    setTgLoading(false);
  };

  const handleUnlinkTelegram = async () => {
    if (!confirm('Are you sure you want to disconnect your Telegram account?')) return;
    setTgLoading(true);
    setTgMsg({ type: '', text: '' });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not logged in");
      const res = await fetch(`/api/user/unlink-telegram?t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (data.success) {
        setProfile({ ...profile, telegram_id: null });
        setTelegramId('');
        setTgMsg({ type: 'success', text: 'Telegram account disconnected.' });
      } else {
        setTgMsg({ type: 'error', text: 'Failed: ' + data.error });
      }
    } catch (err: any) {
      setTgMsg({ type: 'error', text: 'Server error: ' + String(err) });
    }
    setTgLoading(false);
  };

  const COMMANDS = [
    { cmd: '/buy', desc: 'Purchase a new verification number', icon: LucideShoppingCart },
    { cmd: '/deposit', desc: 'Top-up your wallet using Crypto', icon: LucideWallet },
    { cmd: '/active', desc: 'View your active numbers & OTPs', icon: LucideActivitySquare },
    { cmd: '/status', desc: 'View account stats & lifetime spent', icon: LucideList },
    { cmd: '/balance', desc: 'Check your current wallet balance', icon: LucideWallet },
    { cmd: '/unlink', desc: 'Disconnect your Telegram account', icon: LucideLogOut },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 sm:p-10 shadow-xl overflow-hidden text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <LucideBot className="w-64 h-64 -mt-16 -mr-16 rotate-12" />
        </div>
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <LucideBot className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Telegram Bot Integration</h1>
          </div>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
            Take full control of your SwiftOTP account directly from Telegram. Purchase numbers, manage your wallet, and receive instant SMS verification codes without ever opening your browser.
          </p>
        </div>
        <div className="relative z-10 shrink-0">
          <a 
            href="https://t.me/SwiftOTPOfficial_bot" 
            target="_blank" 
            className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-6 py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <LucideExternalLink className="w-5 h-5" />
            Open Bot in Telegram
          </a>
        </div>
      </div>

      {/* Connection Panel */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8">
          <h2 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
            <LucideSmartphone className="w-5 h-5 text-blue-500" />
            Connection Status
          </h2>

          {tgMsg.text && (
            <div className={`p-4 rounded-xl text-sm font-medium flex items-start gap-3 mb-6 ${tgMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
              {tgMsg.type === 'error' ? <LucideXCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <LucideCheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />}
              {tgMsg.text}
            </div>
          )}

          {profile?.telegram_id ? (
            <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-emerald-50/50 border border-emerald-100 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
              <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left z-10">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0 ring-4 ring-white shadow-sm">
                  <LucideCheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-emerald-900 font-bold text-lg">Active Connection</h3>
                  <p className="text-emerald-700/80 text-sm mt-0.5">Securely linked to Telegram ID: <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-200 font-bold tracking-wide">{profile.telegram_id}</code></p>
                </div>
              </div>
              <button
                onClick={handleUnlinkTelegram}
                disabled={tgLoading}
                className="mt-6 sm:mt-0 w-full sm:w-auto px-6 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-50 z-10"
              >
                {tgLoading ? 'Disconnecting...' : 'Disconnect Account'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="space-y-5">
                <div className="flex items-start gap-3.5 group">
                  <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 transition-colors group-hover:bg-blue-600 group-hover:text-white">1</div>
                  <p className="text-sm text-zinc-600 leading-relaxed">Open the bot in Telegram and send the command <code className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">/start</code></p>
                </div>
                <div className="flex items-start gap-3.5 group">
                  <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 transition-colors group-hover:bg-blue-600 group-hover:text-white">2</div>
                  <p className="text-sm text-zinc-600 leading-relaxed">The bot will reply instantly with your unique 10-digit Telegram ID number.</p>
                </div>
                <div className="flex items-start gap-3.5 group">
                  <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 transition-colors group-hover:bg-blue-600 group-hover:text-white">3</div>
                  <p className="text-sm text-zinc-600 leading-relaxed">Paste that ID in the box to securely connect your wallet to the bot.</p>
                </div>
              </div>
              <div className="bg-zinc-50 border border-zinc-200 p-6 rounded-xl">
                {!otpStep ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-zinc-700 mb-2">Paste Your Telegram ID</label>
                      <input
                        type="text"
                        value={telegramId}
                        onChange={(e) => setTelegramId(e.target.value.replace(/\D/g, ''))}
                        maxLength={12}
                        placeholder="e.g., 8252822439"
                        className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium tracking-wide shadow-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={tgLoading || !telegramId.trim()}
                      className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {tgLoading ? <LucideActivity className="w-4 h-4 animate-spin" /> : <LucideSmartphone className="w-4 h-4" />}
                      {tgLoading ? 'Sending Code...' : 'Send Verification Code'}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-center">
                      <p className="text-sm text-blue-800 font-medium">A 6-digit code was sent to <strong>{maskedEmail}</strong></p>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                      <LucideAlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 leading-relaxed font-medium">
                        If you don't receive the code within 1 minute, <strong>please check your Spam or Junk folder</strong>.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-zinc-700 mb-2">Enter Verification Code</label>
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        maxLength={6}
                        placeholder="Enter 6-digit code"
                        className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold tracking-[0.3em] text-center text-lg shadow-sm"
                      />
                    </div>
                    <button
                      onClick={handleLinkTelegram}
                      disabled={tgLoading || otpCode.length !== 6}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {tgLoading ? <LucideActivity className="w-4 h-4 animate-spin" /> : <LucideCheckCircle2 className="w-4 h-4" />}
                      {tgLoading ? 'Verifying...' : 'Verify & Connect'}
                    </button>
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => { setOtpStep(false); setOtpCode(''); setTgMsg({ type: '', text: '' }); }}
                        className="text-xs text-zinc-500 hover:text-zinc-700 font-medium transition-colors"
                      >
                        ← Change Telegram ID
                      </button>
                      <button
                        onClick={handleSendOtp as any}
                        disabled={resendTimer > 0}
                        className="text-xs text-blue-600 hover:text-blue-700 font-bold disabled:text-zinc-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                      </button>
                    </div>
                  </div>
                )}
                <div className="mt-5 flex items-start gap-2 p-3 bg-red-50/50 border border-red-100 rounded-lg">
                  <LucideAlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-700/90 leading-relaxed font-medium">
                    Never link someone else's ID. Doing so gives them full control over your wallet balance and numbers.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bot Capabilities Grid */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <LucideTerminal className="w-5 h-5 text-zinc-500" />
            Bot Capabilities
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Once connected, you can completely control your account directly from Telegram using these commands.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {COMMANDS.map((item, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all group cursor-default">
              <div className="p-2.5 bg-white rounded-lg border border-zinc-200 text-zinc-400 group-hover:text-blue-500 group-hover:border-blue-200 transition-colors shadow-sm shrink-0">
                <item.icon className="w-5 h-5" />
              </div>
              <div className="mt-0.5">
                <code className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                  {item.cmd}
                </code>
                <p className="text-sm text-zinc-600 font-medium mt-1.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
