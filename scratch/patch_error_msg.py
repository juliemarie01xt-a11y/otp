with open('src/app/api/vsim/allocate/route.ts', 'r', encoding='utf-8') as f:
    code = f.read()

import re

code = code.replace(
    "error: `Insufficient balance. This service costs $${maxPrice}, but your balance is $${userBalance}.`",
    "error: `Your wallet balance is insufficient for this transaction (Required: $${maxPrice}, Available: $${userBalance}). Please add funds to your wallet.`"
)

code = code.replace(
    "error: 'Insufficient balance. Please top up.'",
    "error: 'Your wallet balance is insufficient. Please add funds to your wallet.'"
)

code = code.replace(
    "lastError = 'Insufficient balance for this route. Please top up.';",
    "lastError = 'Your wallet balance is insufficient for this specific route. Please add funds to your wallet.';"
)

with open('src/app/api/vsim/allocate/route.ts', 'w', encoding='utf-8') as f:
    f.write(code)
print('done')
