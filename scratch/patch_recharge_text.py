with open('src/app/dashboard/recharge/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

old_text = """            <p className="text-center text-[11px] text-zinc-400 font-medium">
              Secured by Plisio. USDT, Bitcoin, and Litecoin accepted.
            </p>"""

new_text = """            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 mt-4">
              <p className="text-[11px] text-blue-600 font-medium leading-relaxed">
                <strong className="font-bold">Don't worry about exact amounts!</strong><br />
                If you underpay or overpay, our system will automatically detect the exact amount of crypto we receive and credit your wallet fairly.
              </p>
            </div>
            <p className="text-center text-[11px] text-zinc-400 font-medium mt-2">
              Secured by Plisio. USDT, Bitcoin, and Litecoin accepted.
            </p>"""

code = code.replace(old_text, new_text)

with open('src/app/dashboard/recharge/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
