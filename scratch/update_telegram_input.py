import os

file_path = "src/app/dashboard/telegram/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

old_input = """                      <input
                        type="text"
                        value={telegramId}
                        onChange={(e) => setTelegramId(e.target.value)}
                        placeholder="e.g., 8252822439"
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        required
                      />"""

new_input = """                      <input
                        type="text"
                        value={telegramId}
                        onChange={(e) => setTelegramId(e.target.value.replace(/\\D/g, ''))}
                        maxLength={12}
                        placeholder="e.g., 8252822439"
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        required
                      />"""

if old_input in code:
    code = code.replace(old_input, new_input)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(code)
    print("Replaced input successfully!")
else:
    print("Could not find the exact old_input block.")
