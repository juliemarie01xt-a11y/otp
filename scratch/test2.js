const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/settings/page.tsx', 'utf8');

const regex = /{\/\* Link Telegram Box \*\/}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const newBox = `          {/* Telegram Bot Setup */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
              <LucideSmartphone className="w-5 h-5 text-blue-500" />
              <h2 className="font-bold text-zinc-900">Telegram Bot</h2>
            </div>
            <div className="p-6">
              
              {tgMsg.text && (
                <div className={\`p-3 rounded-lg text-sm font-medium flex items-center gap-2 mb-4 \${tgMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}\`}>
                  {tgMsg.type === 'error' ? <LucideXCircle className="w-4 h-4 shrink-0" /> : <LucideCheckCircle2 className="w-4 h-4 shrink-0" />}
                  {tgMsg.text}
                </div>
              )}

              {profile?.telegram_id ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mb-3 text-emerald-600">
                    <LucideCheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-emerald-900 mb-1">Account Linked</h3>
                  <p className="text-sm text-emerald-700 mb-4">Your Telegram ID: <code>{profile.telegram_id}</code></p>
                  <button
                    onClick={handleUnlinkTelegram}
                    disabled={tgLoading}
                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    {tgLoading ? 'Disconnecting...' : 'Disconnect Telegram'}
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-zinc-500 mb-4">Message <b>@SwiftOTPOfficial_bot</b> on Telegram with <code>/start</code> to get your ID.</p>
                  <form onSubmit={handleLinkTelegram} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Telegram ID</label>
                      <input
                        type="text"
                        value={telegramId}
                        onChange={(e) => setTelegramId(e.target.value)}
                        placeholder="e.g., 8252822439"
                        className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={tgLoading}
                      className="w-full bg-zinc-900 hover:bg-black text-white font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {tgLoading ? <LucideActivity className="w-4 h-4 animate-spin" /> : <LucideSmartphone className="w-4 h-4" />}
                      {tgLoading ? 'Linking...' : 'Link Account'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>`;

code = code.replace(regex, newBox);
fs.writeFileSync('src/app/dashboard/settings/page.tsx', code, 'utf8');
console.log('Replaced using regex!');
