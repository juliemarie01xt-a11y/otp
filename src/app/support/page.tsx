'use client';

import { useState } from 'react';
import { TelegramIcon } from '@/components/TelegramIcon';
import { LucideMail, LucideMessageCircle, LucideChevronDown, LucideLifeBuoy, LucideCreditCard, LucidePhone, LucideArrowLeft } from 'lucide-react';
import Link from 'next/link';

const faqs = [
  {
    question: 'Why didn\'t I receive my OTP code?',
    answer: 'Occasionally, certain websites or carriers may flag or block a specific number. If your OTP code does not arrive within the 15-minute window, the order will automatically cancel and your wallet will be instantly refunded. You are only charged for successful codes.'
  },
  {
    question: 'How do I add funds to my account?',
    answer: 'Navigate to the "Recharge" tab in the sidebar. You can deposit funds using popular cryptocurrencies like Litecoin (LTC), USDT (TRC20), or Tron (TRX). Once the blockchain confirms your transaction, your balance will update automatically.'
  },
  {
    question: 'Can I reuse the exact same phone number?',
    answer: 'Our numbers are mostly designed for one-time verification. While you can click "Buy Again" to quickly purchase a new number from the exact same high-quality route/provider, we cannot guarantee you will receive the exact same physical phone number.'
  },
  {
    question: 'What happens if I cancel a number early?',
    answer: 'If you realize you selected the wrong country or service, you can safely click the "X" cancel button on the active number card. As long as no OTP has been received, your account will instantly receive a full refund.'
  },
  {
    question: 'Are there any hidden fees?',
    answer: 'No! The price you see on the dashboard is the exact price deducted from your wallet. We do not charge monthly maintenance fees or hidden processing fees on your numbers.'
  }
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-zinc-50 pt-12 pb-24">
      <div className="max-w-4xl mx-auto px-5 mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
          <LucideArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
      <div className="max-w-4xl mx-auto space-y-8 px-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Help & Support</h1>
        <p className="text-zinc-500 mt-1 text-sm">Find answers to common questions or get in touch with our team.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Contact Methods */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
              <LucideMessageCircle className="w-5 h-5 text-zinc-400" />
              <h2 className="font-bold text-zinc-900">Contact Us</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-3">
                  <TelegramIcon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-zinc-900 text-sm mb-1">Telegram Support</h3>
                <p className="text-zinc-500 text-xs mb-4">Fastest way to get help. We usually respond within minutes.</p>
                <a 
                  href="https://t.me/swiftotpofficial_Support"
                  target="_blank"
                  className="w-full inline-flex justify-center items-center gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors shadow-md"
                >
                  Message on Telegram
                </a>
                <p className="text-center text-xs text-zinc-400 mt-3 font-mono">@swiftotpofficial_Support</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-200">
            <h3 className="font-bold text-zinc-900 text-sm mb-2 flex items-center gap-2">
              <LucideLifeBuoy className="w-4 h-4 text-zinc-400" /> Need faster help?
            </h3>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Before reaching out, please check the Frequently Asked Questions on the right. 90% of user issues can be solved instantly by reading the FAQ!
            </p>
          </div>
        </div>

        {/* Right Column: FAQ */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50">
              <h2 className="font-bold text-zinc-900">Frequently Asked Questions</h2>
            </div>
            <div className="divide-y divide-zinc-100">
              {faqs.map((faq, idx) => (
                <div key={idx} className="group">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
                  >
                    <span className={`font-semibold text-sm ${openFaq === idx ? 'text-blue-600' : 'text-zinc-700 group-hover:text-zinc-900'}`}>
                      {faq.question}
                    </span>
                    <LucideChevronDown 
                      className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${openFaq === idx ? 'rotate-180 text-blue-600' : ''}`} 
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-6 pb-5 text-sm text-zinc-600 leading-relaxed animate-in slide-in-from-top-2 fade-in duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
    </div>
  );
}
