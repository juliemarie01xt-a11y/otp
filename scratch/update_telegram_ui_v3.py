import os

file_path = "src/app/dashboard/telegram/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

old_blocks = """          {/* Security Warning */}
          <div className="bg-red-50/50 border border-red-100 rounded-xl p-5 shadow-sm flex gap-4 mt-8">
            <div className="mt-0.5 text-red-500 shrink-0">
              <LucideAlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-red-900 text-sm mb-1">Security Warning</h2>
              <p className="text-sm text-red-700/90 leading-relaxed">
                <strong>Never link someone else's Telegram ID.</strong> If you do, that person will gain full control to spend your wallet balance and access your private verification codes.
              </p>
            </div>
          </div>

          {/* Available Commands */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm mt-6 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
              <LucideTerminal className="w-5 h-5 text-zinc-500" />
              <h2 className="font-bold text-zinc-900 text-sm">Bot Commands Reference</h2>
            </div>
            <div className="p-0">
              <div className="divide-y divide-zinc-100">
                {[
                  { cmd: '/buy', desc: 'Purchase a new verification number' },
                  { cmd: '/deposit', desc: 'Top-up your wallet using Crypto' },
                  { cmd: '/active', desc: 'View your active numbers & get OTPs' },
                  { cmd: '/status', desc: 'View your account stats & lifetime spent' },
                  { cmd: '/balance', desc: 'Check your current wallet balance' },
                  { cmd: '/unlink', desc: 'Disconnect your Telegram account' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-zinc-50 transition-colors">
                    <code className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded w-20 text-center shrink-0">
                      {item.cmd}
                    </code>
                    <span className="text-sm text-zinc-600">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>"""

new_blocks = """          {/* Security Warning */}
          <div className="mt-8 p-4 rounded-xl border border-red-200 bg-red-50/50 shadow-sm">
            <p className="text-[13px] text-red-800 leading-relaxed">
              <strong className="text-red-900 font-bold flex items-center gap-1.5 mb-1"><LucideAlertTriangle className="w-4 h-4"/> Security Notice</strong> 
              Never link someone else's Telegram ID. Doing so gives them full control over your wallet balance and private verification codes.
            </p>
          </div>

          {/* Available Commands */}
          <div className="mt-6">
            <h2 className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
              <LucideTerminal className="w-4 h-4 text-zinc-400" />
              Bot Commands Reference
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { cmd: '/buy', desc: 'Purchase number' },
                { cmd: '/deposit', desc: 'Top-up wallet' },
                { cmd: '/active', desc: 'View active OTPs' },
                { cmd: '/status', desc: 'Account stats' },
                { cmd: '/balance', desc: 'Check balance' },
                { cmd: '/unlink', desc: 'Disconnect bot' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border border-zinc-200 bg-white shadow-sm hover:border-blue-200 transition-colors">
                  <code className="text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                    {item.cmd}
                  </code>
                  <span className="text-xs text-zinc-600 font-medium">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>"""

if old_blocks in code:
    code = code.replace(old_blocks, new_blocks)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(code)
    print("Replaced with ultra-modern grid UI!")
else:
    print("Could not find the exact old block.")
