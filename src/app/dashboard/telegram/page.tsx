'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LucideSmartphone, LucideCheckCircle2, LucideXCircle, LucideActivity, LucideBot, LucideMessageSquare, LucideAlertTriangle, LucideTerminal, LucideArrowRight } from 'lucide-react';

export default function TelegramGuidePage() {
  const [telegramId, setTelegramId] = useState('');
  const [tgLoading, setTgLoading] = useState(false);
  const [tgMsg, setTgMsg] = useState({ type: '', text: '' });
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setProfile(data);
    };
    fetchProfile();
  }, []);

  const handleLinkTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setTgLoading(true);
    setTgMsg({ type: '', text: '' });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not logged in");
      const res = await fetch(`/api/user/link-telegram?t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ telegramId: String(telegramId).trim() })
      });
      const data = await res.json();

      if (data.success) {
        setTgMsg({ type: 'success', text: 'Telegram account linked successfully!' });
        setProfile({ ...profile, telegram_id: telegramId });
      } else {
        setTgMsg({ type: 'error', text: 'Failed: ' + data.error });
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

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 flex items-center gap-2">
          <LucideBot className="w-8 h-8 text-blue-500" />
          SwiftOTP Telegram Bot
        </h1>
        <p className="text-zinc-500 mt-2">Buy numbers and receive SMS codes instantly through our automated Telegram bot.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Side: The Guide */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
            <h2 className="font-bold text-lg text-zinc-900 mb-6">How to Connect</h2>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 before:to-transparent">
              
              <div className="relative flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold z-10 ring-4 ring-white shrink-0">1</div>
                <div>
                  <h3 className="font-bold text-zinc-900">Open the Bot</h3>
                  <p className="text-sm text-zinc-500 mt-1">Open Telegram and search for <b>@SwiftOTPOfficial_bot</b> or <a href="https://t.me/SwiftOTPOfficial_bot" target="_blank" className="text-blue-600 hover:underline">click here</a>.</p>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold z-10 ring-4 ring-white shrink-0">2</div>
                <div>
                  <h3 className="font-bold text-zinc-900">Get Your ID</h3>
                  <p className="text-sm text-zinc-500 mt-1">Send the command <b>/start</b> to the bot. It will reply with your unique 10-digit Telegram ID.</p>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold z-10 ring-4 ring-white shrink-0">3</div>
                <div>
                  <h3 className="font-bold text-zinc-900">Link Account</h3>
                  <p className="text-sm text-zinc-500 mt-1">Paste that ID into the secure connection box on this page to link your wallet.</p>
                </div>
              </div>

            </div>
          </div>

          {/* Security Warning */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-red-900 flex items-center gap-2 mb-2">
              <LucideAlertTriangle className="w-5 h-5" />
              Security Warning
            </h2>
            <p className="text-sm text-red-700 leading-relaxed">
              <strong>Do not paste anyone else's Telegram ID here!</strong> If you link someone else's ID, that person will have <b>full access</b> to spend your wallet balance, buy numbers, and view your private verification codes.
            </p>
          </div>

          {/* Available Commands */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-zinc-900 flex items-center gap-2 mb-4">
              <LucideTerminal className="w-5 h-5 text-zinc-500" />
              Available Bot Commands
            </h2>
            <ul className="space-y-3 text-sm text-zinc-600">
              <li><code className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded mr-2">/buy</code>Purchase a new verification number</li>
              <li><code className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded mr-2">/deposit</code>Top-up your wallet using Crypto</li>
              <li><code className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded mr-2">/active</code>View your active numbers & get OTPs</li>
              <li><code className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded mr-2">/status</code>View your account stats & lifetime spent</li>
              <li><code className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded mr-2">/balance</code>Check your current wallet balance</li>
            </ul>
          </div>
        </div>

        {/* Right Side: The Form */}
        <div>
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden sticky top-8">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
              <LucideSmartphone className="w-5 h-5 text-blue-500" />
              <h2 className="font-bold text-zinc-900">Connection Status</h2>
            </div>
            <div className="p-6">
              
              {tgMsg.text && (
                <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 mb-4 ${tgMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                  {tgMsg.type === 'error' ? <LucideXCircle className="w-4 h-4 shrink-0" /> : <LucideCheckCircle2 className="w-4 h-4 shrink-0" />}
                  {tgMsg.text}
                </div>
              )}

              {profile?.telegram_id ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4 text-emerald-600">
                    <LucideCheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-lg text-emerald-900 mb-1">Account Connected</h3>
                  <p className="text-sm text-emerald-700 mb-6">Your Telegram ID: <code>{profile.telegram_id}</code></p>
                  <button
                    onClick={handleUnlinkTelegram}
                    disabled={tgLoading}
                    className="w-full bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold py-3 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    {tgLoading ? 'Disconnecting...' : 'Disconnect Telegram'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLinkTelegram} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Paste Telegram ID</label>
                    <input
                      type="text"
                      value={telegramId}
                      onChange={(e) => setTelegramId(e.target.value.replace(/\D/g, ''))}
                        maxLength={12}
                      placeholder="e.g., 8252822439"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={tgLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {tgLoading ? <LucideActivity className="w-4 h-4 animate-spin" /> : <LucideMessageSquare className="w-4 h-4" />}
                    {tgLoading ? 'Linking...' : 'Connect to Telegram'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
