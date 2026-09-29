import os

file_path = "src/app/api/bot/command/route.ts"
with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# I will replace the single quote string with a template literal string
old_text1 = "'🤔 I didn\\'t quite catch that.\n\nOpen the Menu to see available commands, or type <code>/buy</code> to purchase a new number!'"
new_text1 = "`🤔 I didn't quite catch that.\\n\\nOpen the Menu to see available commands, or type <code>/buy</code> to purchase a new number!`"

code = code.replace(old_text1, new_text1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Fixed single quotes to backticks!")
