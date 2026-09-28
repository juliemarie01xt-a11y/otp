with open('src/app/dashboard/recharge/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

old_input = """                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2.5 pl-7 pr-4 text-sm font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-shadow"
                  placeholder="Custom amount"
                />
              </div>
            </div>"""

new_input = """                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2.5 pl-7 pr-4 text-sm font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-shadow"
                  placeholder="Custom amount"
                />
              </div>
              
              {amount >= 1 && (
                <div className="mt-3 flex justify-between items-center text-xs text-zinc-500 bg-zinc-50 px-3 py-2 rounded border border-zinc-100">
                  <span>Estimated Total (incl. 1.5% fee):</span>
                  <span className="font-semibold text-zinc-900">${(amount * 1.015).toFixed(2)}</span>
                </div>
              )}
            </div>"""

code = code.replace(old_input, new_input)

with open('src/app/dashboard/recharge/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
