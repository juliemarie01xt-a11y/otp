import os

file_path = "src/app/dashboard/telegram/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# Add imports
if 'LucideAlertTriangle' not in code:
    code = code.replace("LucideMessageSquare, ", "LucideMessageSquare, LucideAlertTriangle, LucideTerminal, ")
    code = code.replace("import { ", "import { LucideAlertTriangle, LucideTerminal, ") # Fallback

# Add new blocks
anchor = "            </div>\n          </div>"
new_blocks = """            </div>
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
          </div>"""

if anchor in code:
    # only replace the first occurrence which is at the end of the left col
    code = code.replace(anchor, new_blocks, 1)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(code)
    print("Injected warning and commands!")
else:
    print("Anchor not found!")
