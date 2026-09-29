import os

file_path = "src/app/dashboard/telegram/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

old_blocks = """          {/* Security Warning */}
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
          </div>"""

new_blocks = """          {/* Security Warning */}
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

if old_blocks in code:
    code = code.replace(old_blocks, new_blocks)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(code)
    print("Replaced with highly polished UI!")
else:
    print("Could not find the exact old block.")
